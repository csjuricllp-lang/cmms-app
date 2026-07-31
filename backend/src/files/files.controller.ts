import {
  Controller,
  Get,
  Post,
  UseInterceptors,
  UploadedFile,
  Delete,
  Param,
  UseGuards,
  Inject,
  Body,
  Req,
  Res,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { AuthGuard } from '@nestjs/passport';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

import { AllowAnyRole } from '../auth/decorators/allow-any-role.decorator';

// Only these MIME types are accepted for uploads.
const ALLOWED_MIME_TYPES = new Set([
  // Images (raster only - SVG excluded to prevent Stored XSS)
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  // Video / Audio (voice notes)
  'video/mp4',
  'video/webm',
  'audio/mpeg',
  'audio/webm',
  'audio/ogg',
]);

function validateMimeType(file: Express.Multer.File): void {
  if (!file || !ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw new BadRequestException(
      `File type '${file?.mimetype ?? 'unknown'}' is not allowed. Accepted types: images, PDF, Office documents, plain text, CSV, MP4/WebM video, and audio.`,
    );
  }
}

@UseGuards(AuthGuard('jwt'))
@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly prisma: PrismaService,
    @Inject('BullQueue_uploads') private readonly uploadsQueue: Queue,
  ) {}

  @AllowAnyRole()
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    validateMimeType(file);
    return this.filesService.uploadFile(file);
  }

  @AllowAnyRole()
  @Post('offline-queue')
  @UseInterceptors(FileInterceptor('file'))
  async uploadOfflineQueue(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Validate MIME type against allowlist
    validateMimeType(file);

    // Sanitize the original filename to strip any directory traversal components
    const safeOriginalName = path.basename(file.originalname);

    // Save the file temporarily
    const tempDir = path.join(os.tmpdir(), 'offline-uploads');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFileName = `${randomUUID()}-${safeOriginalName}`;
    const tempFilePath = path.join(tempDir, tempFileName);
    
    fs.writeFileSync(tempFilePath, file.buffer);

    // Queue for background processing
    const job = await this.uploadsQueue.add('process-offline-upload', {
      filePath: tempFilePath,
      originalname: safeOriginalName,
      mimetype: file.mimetype,
      size: file.size,
      folder: body.folder || 'offline-uploads',
      entityType: body.entityType,
      entityId: body.entityId,
      userId: req.user?.id, // Get from AuthGuard
    });

    return { 
      message: 'File queued for background upload',
      jobId: job.id,
      status: 'QUEUED'
    };
  }

  @AllowAnyRole()
  @Delete(':filename')
  async deleteFile(
    @Param('filename') rawFilename: string,
    @Req() req: any,
  ) {
    const organizationId: string = req.user?.organizationId;
    const filename = path.basename(rawFilename);

    if (!filename) {
      throw new BadRequestException('Invalid filename.');
    }

    // Ownership check: verify the file belongs to this organization
    // by looking it up through the WorkOrderFile record.
    const fileRecord = await this.prisma.workOrderFile.findFirst({
      where: {
        url: { contains: filename },
        workOrder: { organizationId },
      },
      select: { id: true },
    });

    if (!fileRecord) {
      throw new ForbiddenException(
        'File not found or you do not have permission to delete it.',
      );
    }

    return this.filesService.deleteFile(filename);
  }

  /**
   * Secure, tenant-isolated file streaming endpoint.
   * Enforces JWT authentication, organization ownership validation,
   * forced Content-Disposition attachment, and anti-XSS headers.
   */
  @AllowAnyRole()
  @Get('serve/*')
  async serveFile(
    @Req() req: any,
    @Res() res: any,
  ) {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw new ForbiddenException('User organization context missing.');
    }

    const wildcardPath = req.params[0] || req.params['0'] || '';
    const safeKey = path.normalize(wildcardPath).replace(/^(\.\.[\/\\])+/, '');
    const filename = path.basename(safeKey);

    if (!filename) {
      throw new BadRequestException('Invalid file key.');
    }

    // Tenant Ownership Check: verify the file belongs to the requesting user's organization
    const fileRecord = await this.prisma.workOrderFile.findFirst({
      where: {
        url: { contains: filename },
        workOrder: { organizationId },
      },
      select: { id: true, mimeType: true, filename: true },
    });

    if (!fileRecord) {
      throw new ForbiddenException('File not found or access denied.');
    }

    const filePath = path.join(os.tmpdir(), 'cmms-uploads', safeKey);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File on disk not found.');
    }

    const safeOriginalName = path.basename(fileRecord.filename || filename);

    // Hardened Security Headers to prevent Stored-XSS and MIME Sniffing
    res.setHeader('Content-Type', fileRecord.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${safeOriginalName}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'");
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  }
}

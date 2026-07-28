import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { FilesService } from '../../files/files.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';

@Processor('uploads')
export class UploadsQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(UploadsQueueProcessor.name);

  constructor(
    private readonly filesService: FilesService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing upload job ${job.id}`);
    const { filePath, originalname, mimetype, size, folder, entityType, entityId, userId } = job.data;

    try {
      // Ensure the temp file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`Temporary file not found at ${filePath}`);
      }

      // Read the temporary file buffer
      const buffer = fs.readFileSync(filePath);

      // Upload it properly using FilesService
      const uploadedPath = await this.filesService.uploadBuffer(buffer, originalname, mimetype, folder || 'offline-uploads');

      this.logger.log(`Successfully processed offline upload: ${uploadedPath}`);

      // Link the uploaded file to the entity
      if (entityType === 'WorkOrder' && entityId) {
        if (!userId) {
          this.logger.warn(`No userId provided for WorkOrderFile creation in job ${job.id}`);
        }
        
        await this.prisma.workOrderFile.create({
          data: {
            workOrderId: entityId,
            filename: originalname,
            url: uploadedPath.path,
            mimeType: mimetype,
            size: size || buffer.length,
            uploadedById: userId || null,
          },
        });
        this.logger.log(`Linked file ${uploadedPath.path} to WorkOrder ${entityId}`);
      }

      return { path: uploadedPath };
    } catch (error) {
      this.logger.error(`Error processing upload job ${job.id}:`, error);
      throw error;
    } finally {
      // Clean up the temporary file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Upload job ${job.id} completed successfully.`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(`Upload job ${job.id} failed:`, err);
  }
}

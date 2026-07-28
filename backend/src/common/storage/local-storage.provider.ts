import { Injectable } from '@nestjs/common';
import { StorageProvider } from './storage-provider.interface';
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';
import { tmpdir } from 'os';

@Injectable()
export class LocalStorageProvider extends StorageProvider {
  private readonly uploadPath = join(tmpdir(), 'cmms-uploads');

  constructor() {
    super();
    if (!existsSync(this.uploadPath)) {
      mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    const targetFolder = join(this.uploadPath, folder);
    if (!existsSync(targetFolder)) {
      mkdirSync(targetFolder, { recursive: true });
    }

    const fileName = `${randomUUID()}${extname(file.originalname)}`;
    const filePath = join(targetFolder, fileName);

    writeFileSync(filePath, file.buffer);

    return join(folder, fileName).replace(/\\/g, '/');
  }

  async deleteFile(fileKey: string): Promise<void> {
    if (!fileKey || fileKey.includes('..')) {
      throw new Error('Invalid file key: Path traversal attempt detected.');
    }

    const safeKey = join(...fileKey.split(/[/\\]/));
    const resolvedPath = join(this.uploadPath, safeKey);

    // Path traversal guard: ensure target file is strictly inside uploadPath
    if (!resolvedPath.startsWith(this.uploadPath)) {
      throw new Error('Invalid file key: Path traversal attempt detected.');
    }

    if (existsSync(resolvedPath)) {
      unlinkSync(resolvedPath);
    }
  }

  getFileUrl(fileKey: string): string {
    // Route file access through the authenticated FilesController endpoint
    return `/files/serve/${fileKey}`;
  }
}

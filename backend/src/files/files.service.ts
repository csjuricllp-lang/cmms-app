import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { StorageProvider } from '../common/storage/storage-provider.interface';
import { Express } from 'express'; // Required for type metadata in some configs

@Injectable()
export class FilesService {
  constructor(
    @Inject('STORAGE_PROVIDER') private storageProvider: StorageProvider,
  ) {}

  async uploadFile(file: Express.Multer.File, folder = 'general') {
    if (!file) {
      throw new NotFoundException('No file provided');
    }

    const path = await this.storageProvider.uploadFile(file, folder);

    return {
      filename: path.split('/').pop(),
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      path: this.storageProvider.getFileUrl(path),
      key: path, // used for deletion
    };
  }

  async deleteFile(fileKey: string) {
    await this.storageProvider.deleteFile(fileKey);
    return { message: 'File deleted successfully' };
  }

  async uploadBuffer(buffer: Buffer, originalname: string, mimetype: string, folder = 'archives') {
    // Create a mock Express.Multer.File object for the provider
    const file: any = {
      buffer,
      originalname,
      mimetype,
      size: buffer.length,
    };
    
    const path = await this.storageProvider.uploadFile(file, folder);
    
    return {
      filename: path.split('/').pop(),
      path: this.storageProvider.getFileUrl(path),
      key: path,
    };
  }
}

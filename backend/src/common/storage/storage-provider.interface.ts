export abstract class StorageProvider {
  abstract uploadFile(
    file: Express.Multer.File,
    folder: string,
  ): Promise<string>;
  abstract deleteFile(fileKey: string): Promise<void>;
  abstract getFileUrl(fileKey: string): string;
}

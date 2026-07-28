import { Module } from '@nestjs/common';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { LocalStorageProvider } from '../common/storage/local-storage.provider';
import { S3StorageProvider } from '../common/storage/s3-storage.provider';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
    ConfigModule,
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],
  controllers: [FilesController],
  providers: [
    FilesService,
    PrismaService,
    {
      provide: 'STORAGE_PROVIDER',
      useFactory: (configService: ConfigService) => {
        const type = configService.get('STORAGE_TYPE');
        return type === 'S3'
          ? new S3StorageProvider(configService)
          : new LocalStorageProvider();
      },
      inject: [ConfigService],
    },
  ],
  exports: [FilesService],
})
export class FilesModule {}

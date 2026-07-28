import { LocalStorageProvider } from '../common/storage/local-storage.provider';
import { FilesController } from './files.controller';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('Secure Authenticated File Serving & Storage (C5 Audit Fix)', () => {
  let localStorageProvider: LocalStorageProvider;
  let controller: FilesController;

  const mockFilesService = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
  };

  const mockPrisma = {
    workOrderFile: {
      findFirst: jest.fn(),
    },
  };

  const mockQueue = {
    add: jest.fn(),
  };

  beforeEach(() => {
    localStorageProvider = new LocalStorageProvider();
    controller = new FilesController(
      mockFilesService as any,
      mockPrisma as any,
      mockQueue as any,
    );
    jest.clearAllMocks();
  });

  it('LocalStorageProvider.getFileUrl should return authenticated /files/serve/ route', () => {
    const url = localStorageProvider.getFileUrl('general/sample-photo.png');
    expect(url).toBe('/files/serve/general/sample-photo.png');
    expect(url).not.toContain('/uploads/');
  });

  it('serveFile should REJECT request if user organization context is missing', async () => {
    const req = { user: {}, params: { '0': 'general/sample.png' } };
    const res = {};

    await expect(controller.serveFile(req, res)).rejects.toThrow(ForbiddenException);
  });

  it('serveFile should REJECT request if file does not belong to the user organization', async () => {
    mockPrisma.workOrderFile.findFirst.mockResolvedValue(null); // foreign org file

    const req = { user: { organizationId: 'org-A' }, params: { '0': 'general/sample.png' } };
    const res = {};

    await expect(controller.serveFile(req, res)).rejects.toThrow(ForbiddenException);
    expect(mockPrisma.workOrderFile.findFirst).toHaveBeenCalledWith({
      where: {
        url: { contains: 'sample.png' },
        workOrder: { organizationId: 'org-A' },
      },
      select: { id: true, mimeType: true, filename: true },
    });
  });
});

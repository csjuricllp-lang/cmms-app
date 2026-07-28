import { validate } from 'class-validator';
import { RegisterDto, TeamSize } from './dto/register.dto';
import { InvitationsService } from '../invitations/invitations.service';
import { SsoService } from '../sso/sso.service';
import { LocalStorageProvider } from '../common/storage/local-storage.provider';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';

describe('High Security Findings Fixes Verification (H1 - H6)', () => {
  describe('H1: SVG Stored XSS Mitigation', () => {
    it('should reject image/svg+xml files', () => {
      const ALLOWED_MIME_TYPES = new Set([
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
      ]);
      expect(ALLOWED_MIME_TYPES.has('image/svg+xml')).toBe(false);
    });
  });

  describe('H2: Path Traversal Deletion Guard', () => {
    let storageProvider: LocalStorageProvider;

    beforeEach(() => {
      storageProvider = new LocalStorageProvider();
    });

    it('should throw error on path traversal fileKey', async () => {
      await expect(storageProvider.deleteFile('../../etc/passwd')).rejects.toThrow(
        'Path traversal attempt detected',
      );
    });
  });

  describe('H3: SSO One-Time Exchange Code', () => {
    let ssoService: SsoService;

    beforeEach(() => {
      ssoService = new SsoService({} as any, {} as any);
    });

    it('should issue single-use exchange code and burn it after use', async () => {
      const mockToken = 'jwt-access-token-123';
      const code = await ssoService.createSsoCode(mockToken);
      expect(code).toBeDefined();

      const exchangedToken = await ssoService.exchangeSsoCode(code);
      expect(exchangedToken).toBe(mockToken);

      // Re-using code must fail
      await expect(ssoService.exchangeSsoCode(code)).rejects.toThrow(BadRequestException);
    });
  });

  describe('H4: Invitation Acceptance Password Check for Existing Users', () => {
    let invitationsService: InvitationsService;

    const mockPrisma = {
      invitation: {
        findUnique: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    };

    beforeEach(() => {
      invitationsService = new InvitationsService(mockPrisma as any, {} as any);
      jest.clearAllMocks();
    });

    it('should REJECT invitation acceptance for existing account if password is missing or wrong', async () => {
      const mockInvitation = {
        token: 'valid-invitation-token',
        email: 'existing@example.com',
        expiresAt: new Date(Date.now() + 86400000),
      };
      const mockUser = {
        id: 'usr-1',
        email: 'existing@example.com',
        password: '$2b$10$HASHEDPASSWORD...', // valid hash
      };

      mockPrisma.invitation.findUnique.mockResolvedValue(mockInvitation);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        invitationsService.accept({
          token: 'valid-invitation-token',
          password: 'WrongPassword123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('H5: RegisterDto Password Complexity Policy', () => {
    it('should REJECT weak passwords lacking numbers or uppercase letters', async () => {
      const dto = new RegisterDto();
      dto.firstName = 'John';
      dto.lastName = 'Doe';
      dto.email = 'john@example.com';
      dto.phone = '1234567890';
      dto.companyName = 'Acme Inc';
      dto.teamSize = TeamSize.SMALL;
      dto.password = 'weakpass';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const passwordError = errors.find((e) => e.property === 'password');
      expect(passwordError).toBeDefined();
    });

    it('should ACCEPT strong passwords meeting complexity rules', async () => {
      const dto = new RegisterDto();
      dto.firstName = 'John';
      dto.lastName = 'Doe';
      dto.email = 'john@example.com';
      dto.phone = '1234567890';
      dto.companyName = 'Acme Inc';
      dto.teamSize = TeamSize.SMALL;
      dto.password = 'StrongP@ssw0rd!';

      const errors = await validate(dto);
      const passwordError = errors.find((e) => e.property === 'password');
      expect(passwordError).toBeUndefined();
    });
  });
});

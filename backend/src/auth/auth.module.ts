import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { OnboardingService } from './onboarding.service';
import { RolesController } from './roles.controller';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    PassportModule,
    MailModule,
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
          throw new Error(
            'JWT_SECRET environment variable is not set. Refusing to start.',
          );
        }
        return {
          secret,
          signOptions: {
            expiresIn: (process.env.JWT_ACCESS_EXPIRY || '15m') as any,
          },
        };
      },
    }),
  ],
  controllers: [AuthController, RolesController],
  providers: [AuthService, JwtStrategy, OnboardingService],
  exports: [AuthService, JwtModule, OnboardingService],
})
export class AuthModule {}

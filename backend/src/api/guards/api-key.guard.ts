import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiKeyService } from '../api-key.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private apiKeyService: ApiKeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API Key missing (x-api-key header)');
    }

    const keyData = await this.apiKeyService.validateKey(apiKey);

    if (!keyData) {
      throw new UnauthorizedException('Invalid or expired API Key');
    }

    // Attach to request. TenancyInterceptor will pick it up and run with context.
    request['apiKey'] = keyData;

    return true;
  }
}

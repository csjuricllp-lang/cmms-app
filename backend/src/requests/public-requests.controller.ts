import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { Public } from '../auth/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';

@Controller('public-portal/requests')
export class PublicRequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  /**
   * Public endpoint to submit a maintenance request without an account.
   * Rate limited to 5 submissions per minute to prevent portal spam/DoS.
   */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post()
  async createPublicRequest(@Body() body: any) {
    if (!body || typeof body !== 'object') {
      throw new BadRequestException('Invalid request body.');
    }
    return this.requestsService.createPublic(body);
  }
}

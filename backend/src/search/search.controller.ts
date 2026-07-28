import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AllowAnyRole } from '../auth/decorators/allow-any-role.decorator';

@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @AllowAnyRole()
  @Get()
  async search(
    @Query('q') q: string,
    @Query('limit') limit: string,
    @Request() req: any,
  ) {
    const organizationId = req.user?.organizationId;
    const maxResults = Math.min(parseInt(limit || '5', 10), 10);
    return this.searchService.search(q, organizationId, maxResults);
  }
}

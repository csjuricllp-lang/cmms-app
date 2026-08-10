import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query } from '@nestjs/common';
import { PermitsService } from './permits.service';
import { CreatePermitDto } from './dto/create-permit.dto';
import { UpdatePermitDto, SignPermitDto } from './dto/update-permit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermitStatus } from '@prisma/client';

@Controller('api/permits')
@UseGuards(JwtAuthGuard)
export class PermitsController {
  constructor(private readonly permitsService: PermitsService) {}

  @Post()
  create(@Body() createPermitDto: CreatePermitDto) {
    return this.permitsService.create(createPermitDto);
  }

  @Get()
  findAll(
    @Query('status') status?: PermitStatus,
    @Query('workOrderId') workOrderId?: string,
  ) {
    return this.permitsService.findAll(status, workOrderId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.permitsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updatePermitDto: UpdatePermitDto) {
    return this.permitsService.update(id, updatePermitDto);
  }

  @Post(':id/submit')
  submitForApproval(@Param('id') id: string) {
    return this.permitsService.submitForApproval(id);
  }

  @Post(':id/sign')
  sign(@Param('id') id: string, @Body() signDto: SignPermitDto) {
    return this.permitsService.sign(id, signDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.permitsService.delete(id);
  }
}

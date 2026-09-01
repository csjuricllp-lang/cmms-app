import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  create(@Req() req: any, @Body() createDocumentDto: CreateDocumentDto) {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.id;
    return this.documentsService.create(organizationId, userId, createDocumentDto);
  }

  @Get()
  findAll(@Req() req: any) {
    const organizationId = req.user?.organizationId;
    return this.documentsService.findAll(organizationId);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    const organizationId = req.user?.organizationId;
    return this.documentsService.remove(id, organizationId);
  }
}

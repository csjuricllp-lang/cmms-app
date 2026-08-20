import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { CreateVendorDto, UpdateVendorDto } from './dto/vendor.dto';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/permissions/permission.enum';
import { FilesService } from '../files/files.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { MailService } from '../mail/mail.service';

@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('vendors')
export class VendorsController {
  constructor(
    private readonly vendorsService: VendorsService,
    private readonly filesService: FilesService,
    private readonly mailService: MailService,
  ) {}

  @RequirePermissions(Permission.CREATE_VENDOR)
  @Post()
  create(@Body() createVendorDto: CreateVendorDto) {
    return this.vendorsService.create(createVendorDto);
  }

  @RequirePermissions(Permission.READ_VENDOR)
  @Get()
  findAll() {
    return this.vendorsService.findAll();
  }

  @RequirePermissions(Permission.READ_VENDOR)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vendorsService.findOne(id);
  }

  @RequirePermissions(Permission.UPDATE_VENDOR)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVendorDto: UpdateVendorDto) {
    return this.vendorsService.update(id, updateVendorDto);
  }

  @RequirePermissions(Permission.DELETE_VENDOR)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vendorsService.remove(id);
  }

  @RequirePermissions(Permission.UPDATE_VENDOR)
  @Post(':id/files')
  @UseInterceptors(FileInterceptor('file'))
  async addFile(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const fileInfo = await this.filesService.uploadFile(file, `vendors/${id}`);
    return this.vendorsService.addFile(id, fileInfo);
  }

  @RequirePermissions(Permission.UPDATE_VENDOR)
  @Delete('files/:fileId')
  async removeFile(@Param('fileId') fileId: string) {
    return this.vendorsService.removeFile(fileId);
  }

  @RequirePermissions(Permission.READ_VENDOR)
  @Post(':id/contact')
  async contactVendor(
    @Param('id') id: string,
    @Body() body: { subject: string; message: string }
  ) {
    const vendor = await this.vendorsService.findOne(id);
    if (!vendor) {
      throw new Error('Vendor not found');
    }
    const email = vendor.email || 'la.sales@mcmaster.com'; // fallback if no email
    
    await this.mailService.sendVendorMessage(email, vendor.name, body.subject, body.message);
    return { success: true, message: 'Email sent successfully' };
  }
}

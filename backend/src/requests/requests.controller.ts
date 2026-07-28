import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  Req,
  Query,
} from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CreateRequestDto, UpdateRequestDto } from './dto/request.dto';
import { RequestQueryDto } from './dto/request-query.dto';
import { ApproveRequestDto } from './dto/approve-request.dto';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/permissions/permission.enum';
import { Public } from '../auth/decorators/public.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @RequirePermissions(Permission.CREATE_REQUEST)
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/requests',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  create(
    @Body() createRequestDto: CreateRequestDto,
    @Req() req: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      createRequestDto.imageUrl = `/files/requests/${file.filename}`;
    }
    return this.requestsService.create(createRequestDto, req.user.userOrgId);
  }

  /**
   * Public Guest Portal Endpoint: Allows anyone to submit a request
   * without an account, provided they have the organization ID.
   */
  @Public()
  @Post('portal')
  createGuest(@Body() createRequestDto: CreateRequestDto) {
    return this.requestsService.create(createRequestDto);
  }

  @RequirePermissions(Permission.READ_REQUEST)
  @Get()
  findAll(@Req() req: any, @Query() query: RequestQueryDto) {
    return this.requestsService.findAll(query);
  }

  @RequirePermissions(Permission.READ_REQUEST)
  @Get('settings')
  getSettings() {
    return this.requestsService.getSettings();
  }

  @RequirePermissions(Permission.UPDATE_REQUEST)
  @Patch('settings')
  updateSettings(
    @Body() dto: { fieldSettings?: any; formTasks?: any; requestPortals?: any },
  ) {
    return this.requestsService.updateSettings(dto);
  }

  @Public()
  @Get('portal-config/:customUrl')
  getPortalConfig(@Param('customUrl') customUrl: string) {
    return this.requestsService.getPortalConfig(customUrl);
  }

  @RequirePermissions(Permission.READ_REQUEST)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.requestsService.findOne(id);
  }

  @RequirePermissions(Permission.UPDATE_REQUEST)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRequestDto: UpdateRequestDto) {
    return this.requestsService.update(id, updateRequestDto);
  }

  @RequirePermissions(Permission.UPDATE_REQUEST)
  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() dto: ApproveRequestDto) {
    return this.requestsService.approve(id, dto);
  }

  @RequirePermissions(Permission.UPDATE_REQUEST)
  @Post(':id/reject')
  reject(@Param('id') id: string) {
    return this.requestsService.reject(id);
  }

  @RequirePermissions(Permission.DELETE_REQUEST)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.requestsService.remove(id);
  }
}

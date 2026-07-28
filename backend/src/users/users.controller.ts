import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/permissions/permission.enum';
import { TenancyContext } from '../common/tenancy.context';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @RequirePermissions(Permission.MANAGE_USERS)
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @RequirePermissions(Permission.READ_WORK_ORDER, Permission.READ_REQUEST)
  @Get()
  findAll(@Query('status') status?: string) {
    return this.usersService.findAll(status);
  }

  @RequirePermissions(Permission.READ_WORK_ORDER, Permission.READ_REQUEST)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @RequirePermissions(Permission.MANAGE_USERS)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @RequirePermissions(Permission.MANAGE_USERS)
  @Post(':id/locations')
  updateLocationAccess(
    @Param('id') userId: string,
    @Body('locationIds') locationIds: string[],
  ) {
    const organizationId = TenancyContext.organizationId;
    return this.usersService.updateLocationAccess(
      userId,
      organizationId,
      locationIds,
    );
  }

  @RequirePermissions(Permission.MANAGE_USERS)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}

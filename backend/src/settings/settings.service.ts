import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { TenancyContext } from '../common/tenancy.context';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async create(createSettingDto: CreateSettingDto) {
    const organizationId = TenancyContext.organizationId;
    return this.prisma.setting.upsert({
      where: {
        key_organizationId: {
          key: createSettingDto.key,
          organizationId,
        },
      },
      update: { value: createSettingDto.value },
      create: { ...createSettingDto, organizationId },
    });
  }

  async findAll() {
    const organizationId = TenancyContext.organizationId;
    return this.prisma.setting.findMany({
      where: { organizationId },
    });
  }

  async findOne(key: string) {
    const organizationId = TenancyContext.organizationId;
    const setting = await this.prisma.setting.findFirst({
      where: { key, organizationId },
    });
    if (!setting) {
      throw new NotFoundException(`Setting with key ${key} not found`);
    }
    return setting;
  }

  async update(key: string, updateSettingDto: UpdateSettingDto) {
    const organizationId = TenancyContext.organizationId;
    await this.findOne(key);
    return this.prisma.setting.update({
      where: {
        key_organizationId: {
          key,
          organizationId,
        },
      },
      data: updateSettingDto,
    });
  }

  async remove(key: string) {
    const organizationId = TenancyContext.organizationId;
    await this.findOne(key);
    return this.prisma.setting.delete({
      where: {
        key_organizationId: {
          key,
          organizationId,
        },
      },
    });
  }

  // --- Type-Safe Helpers for Business Logic ---

  async getNumber(key: string, defaultValue: number): Promise<number> {
    const organizationId = TenancyContext.organizationId;
    try {
      const setting = await this.prisma.setting.findUnique({
        where: { key_organizationId: { key, organizationId } },
      });
      return setting ? Number(setting.value) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  async getString(key: string, defaultValue: string): Promise<string> {
    const organizationId = TenancyContext.organizationId;
    try {
      const setting = await this.prisma.setting.findUnique({
        where: { key_organizationId: { key, organizationId } },
      });
      return setting ? setting.value : defaultValue;
    } catch {
      return defaultValue;
    }
  }
}

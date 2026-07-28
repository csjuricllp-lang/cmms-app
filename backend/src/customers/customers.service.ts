import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { Customer } from '@prisma/client';
import { TenancyContext } from '../common/tenancy.context';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const organizationId = TenancyContext.organizationId || '';
    return this.prisma.customer.create({
      data: {
        ...createCustomerDto,
        organizationId,
      },
    });
  }

  async findAll(): Promise<Customer[]> {
    const organizationId = TenancyContext.organizationId;
    return this.prisma.customer.findMany({ where: { organizationId } });
  }

  async findOne(id: string): Promise<Customer> {
    const organizationId = TenancyContext.organizationId;
    const customer = await this.prisma.customer.findFirst({ where: { id, organizationId } });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }
    return customer;
  }

  async update(
    id: string,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<Customer> {
    await this.findOne(id);
    return this.prisma.customer.update({
      where: { id },
      data: updateCustomerDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.customer.delete({ where: { id } });
    return { message: 'Customer deleted successfully' };
  }
}

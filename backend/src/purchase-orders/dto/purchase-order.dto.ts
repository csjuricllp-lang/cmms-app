import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  IsDateString,
  Min,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PurchaseOrderStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  ORDERED = 'ORDERED',
  RECEIVED = 'RECEIVED',
  DENIED = 'DENIED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class CreatePurchaseOrderItemDto {
  @IsString()
  @IsNotEmpty()
  partId: string;

  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  quantity: number;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  unitCost: number;
}

export class CreatePurchaseOrderDto {
  @IsString()
  @IsOptional()
  number?: string;

  @IsString()
  @IsNotEmpty()
  vendorId: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  company?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  additionalDetails?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemDto)
  items: CreatePurchaseOrderItemDto[];

  @IsDateString()
  @IsOptional()
  expectedDeliveryDate?: string;

  @IsNumber()
  @IsOptional()
  shippingCost?: number;

  @IsNumber()
  @IsOptional()
  taxAmount?: number;

  @IsString()
  @IsOptional()
  billingAddressType?: string;

  @IsString()
  @IsOptional()
  shippingAddressType?: string;

  @IsString()
  @IsOptional()
  shippingUserName?: string;

  @IsDateString()
  @IsOptional()
  purchaseDate?: string;

  @IsString()
  @IsOptional()
  terms?: string;

  @IsString()
  @IsOptional()
  shippingMethod?: string;

  @IsString()
  @IsOptional()
  fob?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];

  @IsString()
  @IsOptional()
  workOrderId?: string;

  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @IsBoolean()
  @IsOptional()
  includeTaxOnPdf?: boolean;

  @IsString()
  @IsOptional()
  billingCompanyName?: string;

  @IsString()
  @IsOptional()
  billingAddress?: string;

  @IsString()
  @IsOptional()
  billingCity?: string;

  @IsString()
  @IsOptional()
  billingState?: string;

  @IsString()
  @IsOptional()
  billingZip?: string;

  @IsString()
  @IsOptional()
  billingPhone?: string;

  @IsString()
  @IsOptional()
  billingFax?: string;

  @IsBoolean()
  @IsOptional()
  writeShippingDetailsManually?: boolean;

  @IsString()
  @IsOptional()
  shippingCompanyName?: string;

  @IsString()
  @IsOptional()
  shippingAddress?: string;

  @IsString()
  @IsOptional()
  shippingCity?: string;

  @IsString()
  @IsOptional()
  shippingState?: string;

  @IsString()
  @IsOptional()
  shippingZip?: string;

  @IsString()
  @IsOptional()
  shippingPhone?: string;

  @IsString()
  @IsOptional()
  shippingFax?: string;

  @IsBoolean()
  @IsOptional()
  printBackupSignToPdf?: boolean;
}

export class UpdatePurchaseOrderDto {
  @IsEnum(PurchaseOrderStatus)
  @IsOptional()
  status?: PurchaseOrderStatus;

  @IsString()
  @IsOptional()
  number?: string;

  @IsString()
  @IsOptional()
  vendorId?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  company?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  additionalDetails?: string;

  @IsDateString()
  @IsOptional()
  expectedDeliveryDate?: string;

  @IsNumber()
  @IsOptional()
  shippingCost?: number;

  @IsNumber()
  @IsOptional()
  taxAmount?: number;

  @IsString()
  @IsOptional()
  billingAddressType?: string;

  @IsString()
  @IsOptional()
  shippingAddressType?: string;

  @IsString()
  @IsOptional()
  shippingUserName?: string;

  @IsDateString()
  @IsOptional()
  purchaseDate?: string;

  @IsString()
  @IsOptional()
  terms?: string;

  @IsString()
  @IsOptional()
  shippingMethod?: string;

  @IsString()
  @IsOptional()
  fob?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemDto)
  @IsOptional()
  items?: CreatePurchaseOrderItemDto[];

  @IsString()
  @IsOptional()
  workOrderId?: string;

  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @IsBoolean()
  @IsOptional()
  includeTaxOnPdf?: boolean;

  @IsString()
  @IsOptional()
  billingCompanyName?: string;

  @IsString()
  @IsOptional()
  billingAddress?: string;

  @IsString()
  @IsOptional()
  billingCity?: string;

  @IsString()
  @IsOptional()
  billingState?: string;

  @IsString()
  @IsOptional()
  billingZip?: string;

  @IsString()
  @IsOptional()
  billingPhone?: string;

  @IsString()
  @IsOptional()
  billingFax?: string;

  @IsBoolean()
  @IsOptional()
  writeShippingDetailsManually?: boolean;

  @IsString()
  @IsOptional()
  shippingCompanyName?: string;

  @IsString()
  @IsOptional()
  shippingAddress?: string;

  @IsString()
  @IsOptional()
  shippingCity?: string;

  @IsString()
  @IsOptional()
  shippingState?: string;

  @IsString()
  @IsOptional()
  shippingZip?: string;

  @IsString()
  @IsOptional()
  shippingPhone?: string;

  @IsString()
  @IsOptional()
  shippingFax?: string;

  @IsBoolean()
  @IsOptional()
  printBackupSignToPdf?: boolean;
}

export class ReceivePurchaseOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiveItemDto)
  items: ReceiveItemDto[];
}

class ReceiveItemDto {
  @IsString()
  @IsNotEmpty()
  itemId: string; // PurchaseOrderItem ID

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  quantityReceived: number;
}

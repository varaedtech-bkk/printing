// Prisma-compatible schema types
// This file provides the same interface as the old Drizzle schema but uses Prisma types

import { z } from "zod";

// Re-export Prisma generated types
export type {
  User,
  ProductCategory,
  Product,
  ProductOption,
  DesignTemplate,
  UserDesignProject,
  CartItem,
  Order,
  OrderItem,
  Notification,
  UserRole,
  OrderStatus,
} from "@prisma/client";

// Import types for interface definitions
import type { Order as PrismaOrder, OrderItem as PrismaOrderItem } from "@prisma/client";

// Zod schemas for validation (keeping the same interface as before)
export const insertUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  profileImageUrl: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(["CUSTOMER", "VENDOR", "ADMIN"]).default("CUSTOMER"),
  isActive: z.boolean().default(true),
  permissions: z.array(z.string()).optional(),
  password: z.string(),
  shopName: z.string().optional(),
  shopDescription: z.string().optional(),
  shopBanner: z.string().optional(),
});

export const insertProductCategorySchema = z.object({
  nameEn: z.string(),
  nameTh: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  image: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const insertProductSchema = z.object({
  categoryId: z.string(),
  vendorId: z.string(),
  nameEn: z.string(),
  nameTh: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  basePrice: z.number(),
  image: z.string().optional(),
  specifications: z.record(z.any()).optional(),
  isActive: z.boolean().default(true),
  availableOptionTypes: z.array(z.string()).default([]),
});

export const insertProductOptionSchema = z.object({
  productId: z.string(),
  type: z.string(),
  nameEn: z.string(),
  nameTh: z.string(),
  defaultPriceModifier: z.number().default(0),
  priceRules: z.record(z.any()).optional(),
  isDefault: z.boolean().default(false),
});

export const insertDesignTemplateSchema = z.object({
  categoryId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  templateData: z.record(z.any()),
  tags: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

export const insertUserDesignProjectSchema = z.object({
  userId: z.string(),
  productId: z.string(),
  templateId: z.string().optional(),
  name: z.string(),
  designData: z.record(z.any()),
  previewImage: z.string().optional(),
  isCompleted: z.boolean().default(false),
});

export const insertCartItemSchema = z.object({
  userId: z.string(),
  productId: z.string(),
  designProjectId: z.string().optional(),
  quantity: z.number().int().min(1),
  selectedOptions: z.record(z.any()),
  unitPrice: z.string(),
  totalPrice: z.string(),
});

export const insertOrderSchema = z.object({
  userId: z.string(),
  orderNumber: z.string(),
  status: z.enum(["PENDING", "RECEIVED", "IN_PRODUCTION", "PRINTED", "SHIPPED", "DELIVERED", "CANCELLED"]).default("PENDING"),
  subtotal: z.number(),
  shippingCost: z.number().default(0),
  totalAmount: z.number(),
  paymentMethod: z.string().optional(),
  paymentStatus: z.string().default("pending"),
  shippingAddress: z.record(z.any()).optional(),
  trackingNumber: z.string().optional(),
  notes: z.string().optional(),
});

export const insertOrderItemSchema = z.object({
  orderId: z.string().optional(), // Will be set when creating order with items
  productId: z.string(),
  designProjectId: z.string().optional(),
  quantity: z.number().int().min(1),
  selectedOptions: z.record(z.any()),
  unitPrice: z.string(),
  totalPrice: z.string(),
  designData: z.record(z.any()).optional(),
  printFiles: z.array(z.string()).default([]),
});

export const insertNotificationSchema = z.object({
  userId: z.string(),
  title: z.string(),
  body: z.string().optional(),
  isRead: z.boolean().default(false),
});

// Product option validation
export const productOptionZodSchema = z.object({
  id: z.string(),
  productId: z.string().optional(),
  type: z.string(),
  nameEn: z.string(),
  nameTh: z.string(),
  defaultPriceModifier: z.number(),
  priceRules: z.record(z.any()).optional().nullable(),
  isDefault: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const productOptionClientSchema = productOptionZodSchema;

// Price rules schema
export const priceRuleSchema = z.object({
  quantityRanges: z.array(z.object({
    min: z.number(),
    max: z.number(),
    modifier: z.number(),
  })).optional().default([]),
});

export type PriceRule = z.infer<typeof priceRuleSchema>;
export type ProductOptionClient = z.infer<typeof productOptionZodSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertProductCategory = z.infer<typeof insertProductCategorySchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertProductOption = z.infer<typeof insertProductOptionSchema>;
export type InsertDesignTemplate = z.infer<typeof insertDesignTemplateSchema>;
export type InsertUserDesignProject = z.infer<typeof insertUserDesignProjectSchema>;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Enhanced Product Template System
export interface ProductTemplate {
  id: string;
  nameEn: string;
  nameTh: string;
  categoryId: string;
  description: string | null;
  thumbnail: string | null;
  templateData: any; // Canvas elements, dimensions, etc.
  pricePerUnit: number;
  minQuantity: number;
  maxQuantity: number | null;
  dimensions: {
    width: number;
    height: number;
    unit: 'mm' | 'cm' | 'inch';
  };
  printSpecs: {
    dpi: number;
    colors: 'CMYK' | 'RGB' | 'BW';
    paperType: string;
    finish: string;
  };
  customizableElements: string[]; // IDs of elements that can be customized
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Note: UserDesignProject type is imported from Prisma above

// Extended Order type that includes items (for queries with include)
export interface OrderWithItems {
  id: string;
  orderNumber: string;
  userId: string;
  totalAmount: string;
  status: string;
  paymentStatus?: string;
  paymentMethod?: string;
  shippingAddress?: any;
  trackingNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  items?: PrismaOrderItem[];
}

// Print Orders
export interface PrintOrder {
  id: string;
  userId: string;
  designProjectId: string;
  vendorId: string;
  orderNumber: string;
  status: 'pending' | 'confirmed' | 'printing' | 'shipped' | 'delivered' | 'cancelled';
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  printSpecifications: any;
  shippingAddress: any;
  trackingNumber: string | null;
  estimatedDelivery: Date | null;
  actualDelivery: Date | null;
  vendorNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

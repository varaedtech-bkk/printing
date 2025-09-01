import { PrismaClient, UserRole, OrderStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import type {
  User,
  InsertUser,
  ProductCategory,
  InsertProductCategory,
  Product,
  InsertProduct,
  ProductOption,
  InsertProductOption,
  DesignTemplate,
  InsertDesignTemplate,
  UserDesignProject,
  InsertUserDesignProject,
  CartItem,
  InsertCartItem,
  Order,
  InsertOrder,
  OrderItem,
  InsertOrderItem,
  Notification,
  InsertNotification,
} from "@shared/prisma-schema";

const SALT_ROUNDS = 10;

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  listUsers(): Promise<User[]>;
  listVendors(): Promise<User[]>;
  findVendorByShopName(shopName: string): Promise<User | null>;

  // Product operations
  getProductCategories(): Promise<ProductCategory[]>;
  getProductCategoryBySlug(slug: string): Promise<ProductCategory | null>;
  createProductCategory(category: InsertProductCategory): Promise<ProductCategory>;
  getProducts(categoryId?: string, vendorId?: string): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product>;
  getProductOptions(productId: string): Promise<ProductOption[]>;
  createProductOption(option: InsertProductOption): Promise<ProductOption>;

  // Design template operations
  getDesignTemplates(categoryId?: string): Promise<DesignTemplate[]>;
  getDesignTemplate(id: string): Promise<DesignTemplate | undefined>;
  createDesignTemplate(template: InsertDesignTemplate): Promise<DesignTemplate>;

  // User design project operations
  getUserDesignProjects(userId: string): Promise<UserDesignProject[]>;
  getDesignProject(id: string): Promise<UserDesignProject | undefined>;
  createDesignProject(project: InsertUserDesignProject): Promise<UserDesignProject>;
  updateDesignProject(id: string, updates: Partial<InsertUserDesignProject>): Promise<UserDesignProject>;
  deleteDesignProject(id: string): Promise<void>;

  // Cart operations
  getCartItems(userId: string): Promise<CartItem[]>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: string, updates: Partial<InsertCartItem>): Promise<CartItem>;
  removeFromCart(id: string): Promise<void>;

  // Order operations
  getOrders(userId: string): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  createOrderWithItems(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  updateOrder(id: string, updates: Partial<InsertOrder>): Promise<Order>;
  getOrderItems(orderId: string): Promise<OrderItem[]>;
  getPaginatedOrders(filters: {
    vendorId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ orders: Order[]; total: number }>;
  isOrderOwnedByVendor(orderId: string, vendorId: string): Promise<boolean>;

  // Notification operations
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<Notification>;
}

export class PrismaStorage implements IStorage {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const user = await this.prisma.user.findUnique({
      where: { id }
    });
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = await this.prisma.user.findUnique({
      where: { email }
    });
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const hashedPassword = user.password ? await bcrypt.hash(user.password, SALT_ROUNDS) : '';

    return await this.prisma.user.create({
      data: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl || null,
        phone: user.phone || null,
        role: user.role as UserRole || UserRole.CUSTOMER,
        isActive: user.isActive ?? true,
        permissions: user.permissions || undefined,
        password: hashedPassword,
        shopName: null,
        shopDescription: null,
        shopBanner: null,
      }
    });
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const updateData: any = { ...updates };

    if (updates.password) {
      updateData.password = await bcrypt.hash(updates.password, SALT_ROUNDS);
    }

    if (updates.role) {
      updateData.role = updates.role as UserRole;
    }

    return await this.prisma.user.update({
      where: { id },
      data: updateData
    });
  }

  async listUsers(): Promise<User[]> {
    return await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async listVendors(): Promise<User[]> {
    return await this.prisma.user.findMany({
      where: { role: UserRole.VENDOR },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findVendorByShopName(shopName: string): Promise<User | null> {
    return await this.prisma.user.findFirst({
      where: {
        role: UserRole.VENDOR,
        shopName: shopName
      }
    });
  }

  // Product operations
  async getProductCategories(): Promise<ProductCategory[]> {
    return await this.prisma.productCategory.findMany({
      where: { isActive: true },
      orderBy: { nameEn: 'asc' }
    });
  }

  async getProductCategoryBySlug(slug: string): Promise<ProductCategory | null> {
    const category = await this.prisma.productCategory.findUnique({
      where: { slug }
    });
    return category;
  }

  async createProductCategory(category: InsertProductCategory): Promise<ProductCategory> {
    return await this.prisma.productCategory.create({
      data: {
        nameEn: category.nameEn,
        nameTh: category.nameTh,
        slug: category.slug,
        description: category.description || null,
        image: category.image || null,
        isActive: category.isActive ?? true,
      }
    });
  }

  async getProducts(categoryId?: string, vendorId?: string): Promise<Product[]> {
    const where: any = { isActive: true };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (vendorId) {
      where.vendorId = vendorId;
    }

    return await this.prisma.product.findMany({
      where,
      include: {
        category: true,
        vendor: true,
        options: true,
      },
      orderBy: { nameEn: 'asc' }
    });
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        vendor: true,
        options: true,
      }
    });
    return product || undefined;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    return await this.prisma.product.create({
      data: {
        categoryId: product.categoryId,
        vendorId: product.vendorId,
        nameEn: product.nameEn,
        nameTh: product.nameTh,
        slug: product.slug,
        description: product.description || null,
        basePrice: product.basePrice,
        image: product.image || null,
        specifications: product.specifications || undefined,
        isActive: product.isActive ?? true,
        availableOptionTypes: product.availableOptionTypes || [],
      },
      include: {
        category: true,
        vendor: true,
        options: true,
      }
    });
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product> {
    return await this.prisma.product.update({
      where: { id },
      data: updates,
      include: {
        category: true,
        vendor: true,
        options: true,
      }
    });
  }

  async getProductOptions(productId: string): Promise<ProductOption[]> {
    return await this.prisma.productOption.findMany({
      where: { productId },
      orderBy: { type: 'asc' }
    });
  }

  async createProductOption(option: InsertProductOption): Promise<ProductOption> {
    return await this.prisma.productOption.create({
      data: {
        productId: option.productId,
        type: option.type,
        nameEn: option.nameEn,
        nameTh: option.nameTh,
        defaultPriceModifier: option.defaultPriceModifier,
        priceRules: option.priceRules || undefined,
        isDefault: option.isDefault ?? false,
      }
    });
  }

  // Design template operations
  async getDesignTemplates(categoryId?: string): Promise<DesignTemplate[]> {
    const where: any = { isActive: true };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    return await this.prisma.designTemplate.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { name: 'asc' }
    });
  }

  async getDesignTemplate(id: string): Promise<DesignTemplate | undefined> {
    const template = await this.prisma.designTemplate.findUnique({
      where: { id },
      include: {
        category: true,
      }
    });
    return template || undefined;
  }

  async createDesignTemplate(template: InsertDesignTemplate): Promise<DesignTemplate> {
    return await this.prisma.designTemplate.create({
      data: {
        categoryId: template.categoryId,
        name: template.name,
        description: template.description || null,
        thumbnail: template.thumbnail || null,
        templateData: template.templateData || undefined,
        tags: template.tags,
        isActive: template.isActive ?? true,
      },
      include: {
        category: true,
      }
    });
  }

  // User design project operations
  async getUserDesignProjects(userId: string): Promise<UserDesignProject[]> {
    return await this.prisma.userDesignProject.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    }) as any;
  }

  async getDesignProject(id: string): Promise<UserDesignProject | undefined> {
    const project = await this.prisma.userDesignProject.findUnique({
      where: { id }
    });
    return project as any;
  }

  async createDesignProject(project: InsertUserDesignProject): Promise<UserDesignProject> {
    return await this.prisma.userDesignProject.create({
      data: {
        userId: project.userId,
        productId: project.productId,
        templateId: project.templateId || null,
        name: project.name,
        designData: project.designData || undefined,
        previewImage: project.previewImage || null,
        isCompleted: project.isCompleted ?? false,
      }
    }) as any;
  }

  async updateDesignProject(id: string, updates: Partial<InsertUserDesignProject>): Promise<UserDesignProject> {
    const updateData: any = { ...updates };

    return await this.prisma.userDesignProject.update({
      where: { id },
      data: updateData
    }) as any;
  }

  async deleteDesignProject(id: string): Promise<void> {
    await this.prisma.userDesignProject.delete({
      where: { id }
    });
  }

  // Cart operations
  async getCartItems(userId: string): Promise<CartItem[]> {
    return await this.prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: true,
        designProject: true,
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    return await this.prisma.cartItem.create({
      data: {
        userId: item.userId,
        productId: item.productId,
        designProjectId: item.designProjectId || null,
        quantity: item.quantity,
        selectedOptions: item.selectedOptions,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      },
      include: {
        product: true,
        designProject: true,
      }
    });
  }

  async updateCartItem(id: string, updates: Partial<InsertCartItem>): Promise<CartItem> {
    return await this.prisma.cartItem.update({
      where: { id },
      data: updates,
      include: {
        product: true,
        designProject: true,
      }
    });
  }

  async removeFromCart(id: string): Promise<void> {
    await this.prisma.cartItem.delete({
      where: { id }
    });
  }

  // Order operations
  async getOrders(userId: string): Promise<Order[]> {
    return await this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
            designProject: true,
          }
        },
        user: true,
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
            designProject: true,
          }
        },
        user: true,
      }
    });
    return order || undefined;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    return await this.prisma.order.create({
      data: {
        userId: order.userId,
        orderNumber: order.orderNumber,
        status: order.status as OrderStatus || OrderStatus.PENDING,
        subtotal: order.subtotal,
        shippingCost: order.shippingCost || 0,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod || null,
        paymentStatus: order.paymentStatus || 'pending',
        shippingAddress: order.shippingAddress || undefined,
        trackingNumber: order.trackingNumber || null,
        notes: order.notes || undefined,
      },
      include: {
        items: true,
        user: true,
      }
    });
  }

  async createOrderWithItems(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    return await this.prisma.order.create({
      data: {
        userId: order.userId,
        orderNumber: order.orderNumber,
        status: order.status as OrderStatus || OrderStatus.PENDING,
        subtotal: order.subtotal,
        shippingCost: order.shippingCost || 0,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod || null,
        paymentStatus: order.paymentStatus || 'pending',
        shippingAddress: order.shippingAddress || undefined,
        trackingNumber: order.trackingNumber || null,
        notes: order.notes || undefined,
        items: {
          create: items.map(item => ({
            productId: item.productId,
            designProjectId: item.designProjectId || null,
            quantity: item.quantity,
            selectedOptions: item.selectedOptions,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            designData: item.designData || undefined,
            printFiles: item.printFiles,
          }))
        }
      },
      include: {
        items: {
          include: {
            product: true,
            designProject: true,
          }
        },
        user: true,
      }
    });
  }

  async updateOrder(id: string, updates: Partial<InsertOrder>): Promise<Order> {
    const updateData: any = { ...updates };

    if (updates.status) {
      updateData.status = updates.status as OrderStatus;
    }

    return await this.prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            product: true,
            designProject: true,
          }
        },
        user: true,
      }
    });
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return await this.prisma.orderItem.findMany({
      where: { orderId },
      include: {
        product: true,
        designProject: true,
        order: true,
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  async getPaginatedOrders(filters: {
    vendorId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ orders: Order[]; total: number }> {
    const where: any = {};

    if (filters.vendorId) {
      // For vendor orders, we need to find orders that contain products from this vendor
      const vendorProducts = await this.prisma.product.findMany({
        where: { vendorId: filters.vendorId },
        select: { id: true }
      });

      const productIds = vendorProducts.map(p => p.id);

      where.items = {
        some: {
          productId: {
            in: productIds
          }
        }
      };
    }

    if (filters.status) {
      where.status = filters.status as OrderStatus;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                include: {
                  vendor: true
                }
              },
              designProject: true,
            }
          },
          user: true,
        },
        orderBy: { createdAt: 'desc' },
        take: filters.limit,
        skip: filters.offset,
      }),
      this.prisma.order.count({ where })
    ]);

    return { orders, total };
  }

  async isOrderOwnedByVendor(orderId: string, vendorId: string): Promise<boolean> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) return false;

    return order.items.some(item => item.product.vendorId === vendorId);
  }

  // Notification operations
  async getNotifications(userId: string): Promise<Notification[]> {
    return await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    return await this.prisma.notification.create({
      data: {
        userId: notification.userId,
        title: notification.title,
        body: notification.body || null,
        isRead: notification.isRead ?? false,
      }
    });
  }

  async markNotificationRead(id: string): Promise<Notification> {
    return await this.prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
  }
}

// Export singleton instance
export const prismaStorage = new PrismaStorage();

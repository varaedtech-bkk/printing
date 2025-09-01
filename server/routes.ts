import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { prismaStorage } from "./storage";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
import { insertProductCategorySchema, insertProductSchema, insertUserDesignProjectSchema, insertCartItemSchema, insertOrderSchema, insertOrderItemSchema, insertProductOptionSchema } from "@shared/prisma-schema";
import { z } from "zod";
import {
  generateDesignFromText,
  generateColorPalette,
  analyzeDesignImage,
  removeBackground,
  generateDesignVariations,
  getCostMetrics,
  resetCostMetrics,
  logAICall
} from "./ai";
import { ProductOption, ProductOptionClient } from "@shared/prisma-schema";
import { productOptionZodSchema } from "@shared/prisma-schema";
import { priceRuleSchema } from "@shared/prisma-schema";
import { InsertUser } from "@shared/prisma-schema"; // Import InsertUser
import bcrypt from 'bcrypt'; // Import bcrypt

const SALT_ROUNDS = 10; // Define salt rounds for bcrypt

export async function registerRoutes(app: Express): Promise<Server> {
  // Role guard using session
  function requireRole(allowed: string[]) {
    return (req: any, res: any, next: any) => {
      const role = (req.session?.user?.role as string) || "";
      if (!allowed.includes(role)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      next();
    };
  }

  function hasPermission(req: any, perm: string) {
    const user = req.session?.user;
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    const perms: string[] = user.permissions || [];
    return perms.includes(perm);
  }

  // Auth routes
  app.post("/api/auth/login", async (req: any, res) => {
    try {
      const { email } = req.body as { email?: string };
      if (!email) return res.status(400).json({ message: "Email required" });
      const user = await prismaStorage.getUserByEmail(email);
      if (!user || user.isActive === false) return res.status(401).json({ message: "Invalid credentials" });
      req.session.user = { id: user.id, role: user.role || "CUSTOMER", email: user.email };
      res.json(req.session.user);
    } catch {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req: any, res) => {
    req.session?.destroy(() => {});
    res.status(204).send();
  });

  app.get("/api/auth/me", (req: any, res) => {
    res.json(req.session?.user || null);
  });

  // Product categories routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await prismaStorage.getProductCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const categoryData = insertProductCategorySchema.parse(req.body);
      const category = await prismaStorage.createProductCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(400).json({ message: "Invalid category data" });
    }
  });

  // Template routes - Remove this duplicate endpoint since we have one below
  // app.get("/api/templates", async (req, res) => {
  //   try {
  //     const { category, tags, search } = req.query;

  //     let where: any = { isActive: true };

  //     // Filter by category
  //     if (category && typeof category === 'string') {
  //       where.category = category;
  //     }

  //     // Filter by tags
  //     if (tags && Array.isArray(tags)) {
  //       where.tags = {
  //         hasSome: tags
  //       };
  //     }

  //     // Search by title or description
  //     if (search && typeof search === 'string') {
  //       where.OR = [
  //         { title: { contains: search, mode: 'insensitive' } },
  //         { description: { contains: search, mode: 'insensitive' } }
  //       ];
  //     }

  //     const templates = await prisma.template.findMany({
  //       where,
  //       select: {
  //         id: true,
  //         title: true,
  //         description: true,
  //         category: true,
  //         tags: true,
  //         thumbnailUrl: true,
  //         baseProductId: true,
  //         createdAt: true
  //       },
  //       orderBy: { createdAt: 'desc' }
  //     });

  //     res.json({ success: true, templates });
  //   } catch (error) {
  //     console.error('Error fetching templates:', error);
  //     res.status(500).json({ success: false, error: 'Failed to fetch templates' });
  //   }
  // });

  // REMOVED: Duplicate template endpoint - using the correct one below
  // app.get("/api/templates/:id", async (req, res) => {
  //   try {
  //     const { id } = req.params;
  //
  //     const template = await prisma.template.findUnique({
  //       where: { id },
  //       select: {
  //         id: true,
  //         title: true,
  //         description: true,
  //         category: true,
  //         tags: true,
  //         thumbnailUrl: true,
  //         templateData: true,
  //         baseProductId: true,
  //         isActive: true
  //       }
  //     });
  //
  //     if (!template || !template.isActive) {
  //       return res.status(404).json({ success: false, error: 'Template not found' });
  //     }
  //
  //     res.json({ success: true, template });
  //   } catch (error) {
  //     console.error('Error fetching template:', error);
  //     res.status(500).json({ success: false, error: 'Failed to fetch template' });
  //   }
  // });

  app.post("/api/templates", requireRole(['ADMIN']), async (req, res) => {
    try {
      const { title, description, category, tags, thumbnailUrl, templateData, baseProductId } = req.body;
      
      const template = await prisma.template.create({
        data: {
          title,
          description,
          category,
          tags: tags || [],
          thumbnailUrl,
          templateData,
          baseProductId
        }
      });
      
      res.json({ success: true, template });
    } catch (error) {
      console.error('Error creating template:', error);
      res.status(500).json({ success: false, error: 'Failed to create template' });
    }
  });

  app.put("/api/templates/:id", requireRole(['ADMIN']), async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, category, tags, thumbnailUrl, templateData, baseProductId, isActive } = req.body;
      
      const template = await prisma.template.update({
        where: { id },
        data: {
          title,
          description,
          category,
          tags: tags || [],
          thumbnailUrl,
          templateData,
          baseProductId,
          isActive
        }
      });
      
      res.json({ success: true, template });
    } catch (error) {
      console.error('Error updating template:', error);
      res.status(500).json({ success: false, error: 'Failed to update template' });
    }
  });

  app.delete("/api/templates/:id", requireRole(['ADMIN']), async (req, res) => {
    try {
      const { id } = req.params;
      
      await (prisma as any).template.update({
        where: { id },
        data: { isActive: false }
      });
      
      res.json({ success: true, message: 'Template deleted successfully' });
    } catch (error) {
      console.error('Error deleting template:', error);
      res.status(500).json({ success: false, error: 'Failed to delete template' });
    }
  });

  // Products routes (handled by the main products route below)

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await prismaStorage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      // Attach options to the product
      const options = await prismaStorage.getProductOptions(req.params.id);
      res.json({ ...product, options });
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // New Gogoprint-style API endpoints
  app.get("/api/products/:id/pricing", async (req, res) => {
    try {
      const product = await prismaStorage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const locationId = req.query.location || "bangkok";

      const pricings = await prisma.productPricing.findMany({
        where: {
          productId: product.id,
          location: { locationId: locationId as string },
          isActive: true
        },
        include: {
          location: true
        },
        orderBy: { quantity: 'asc' }
      });

      res.json(pricings);
    } catch (error) {
      console.error("Error fetching product pricing:", error);
      res.status(500).json({ message: "Failed to fetch product pricing" });
    }
  });

  app.get("/api/products/:slug/sizes", async (req, res) => {
    try {
      const product = await prisma.product.findUnique({
        where: { slug: req.params.slug }
      });
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const sizes = await prisma.productSize.findMany({
        where: { productId: product.id, isActive: true },
        orderBy: { isPopular: 'desc' }
      });

      res.json(sizes);
    } catch (error) {
      console.error("Error fetching product sizes:", error);
      res.status(500).json({ message: "Failed to fetch product sizes" });
    }
  });

  app.get("/api/products/:slug/paper-types", async (req, res) => {
    try {
      const product = await prisma.product.findUnique({
        where: { slug: req.params.slug }
      });
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const paperTypes = await prisma.paperType.findMany({
        where: { productId: product.id, isActive: true },
        orderBy: { isPopular: 'desc' }
      });

      res.json(paperTypes);
    } catch (error) {
      console.error("Error fetching paper types:", error);
      res.status(500).json({ message: "Failed to fetch paper types" });
    }
  });

  app.get("/api/products/:slug/printing-sides", async (req, res) => {
    try {
      const product = await prisma.product.findUnique({
        where: { slug: req.params.slug }
      });
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const printingSides = await prisma.printingSide.findMany({
        where: { productId: product.id, isActive: true },
        orderBy: { isPopular: 'desc' }
      });

      res.json(printingSides);
    } catch (error) {
      console.error("Error fetching printing sides:", error);
      res.status(500).json({ message: "Failed to fetch printing sides" });
    }
  });

  app.get("/api/products/:slug/finishing-options", async (req, res) => {
    try {
      const product = await prisma.product.findUnique({
        where: { slug: req.params.slug }
      });
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const finishingOptions = await prisma.finishingOption.findMany({
        where: { productId: product.id, isActive: true },
        orderBy: { isPopular: 'desc' }
      });

      res.json(finishingOptions);
    } catch (error) {
      console.error("Error fetching finishing options:", error);
      res.status(500).json({ message: "Failed to fetch finishing options" });
    }
  });

  app.get("/api/products/:slug/pricing", async (req, res) => {
    try {
      const product = await prisma.product.findUnique({
        where: { slug: req.params.slug }
      });
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const locationId = req.query.location || "bangkok";

      const pricings = await prisma.productPricing.findMany({
        where: {
          productId: product.id,
          location: { locationId: locationId as string },
          isActive: true
        },
        include: {
          location: true
        },
        orderBy: { quantity: 'asc' }
      });

      res.json(pricings);
    } catch (error) {
      console.error("Error fetching product pricing:", error);
      res.status(500).json({ message: "Failed to fetch product pricing" });
    }
  });

  app.get("/api/products/:id/options", async (req, res) => {
    try {
      const options = await prismaStorage.getProductOptions(req.params.id);
      res.json(options);
    } catch (error) {
      console.error("Error fetching product options:", error);
      res.status(500).json({ message: "Failed to fetch product options" });
    }
  });

  // Admin product vendor assignment
  app.post("/api/admin/products/:id/vendor", requireRole(["ADMIN"]), async (req: any, res) => {
    try {
      const { vendorId } = req.body as { vendorId?: string };
      if (!vendorId) return res.status(400).json({ message: "vendorId required" });
      const product = await prismaStorage.updateProduct(req.params.id, { vendorId } as any);
      res.json(product);
    } catch (error) {
      console.error("Error assigning vendor:", error);
      res.status(500).json({ message: "Failed to assign vendor" });
    }
  });

  // Design templates routes
  app.get("/api/templates", async (req, res) => {
    try {
      const categoryId = req.query.category as string;
      const templates = await prismaStorage.getDesignTemplates(categoryId);

      // Transform the data to match frontend expectations
      const transformedTemplates = templates.map(template => ({
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.categoryId, // Map categoryId to category for frontend compatibility
        tags: template.tags,
        thumbnail: (() => {
          const name = template.name.toLowerCase().replace(/\s+/g, '-');
          // Map common template names to our created images (prioritize over database values)
          const imageMap: { [key: string]: string } = {
            'event-flyer': '/images/templates/event-flyer.svg',
            'modern-business-card': '/images/templates/business-card-modern.svg',
            'vintage-poster': '/images/templates/vintage-poster.svg',
            'creative-flyer': '/images/templates/creative-flyer.svg'
          };
          return imageMap[name] || template.thumbnail || '/images/templates/default-template.svg';
        })(),
        baseProductId: template.categoryId, // Use categoryId as baseProductId for now
        createdAt: template.createdAt
      }));

      res.json(transformedTemplates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.get("/api/templates/:id", async (req, res) => {
    try {
      console.log("🔍 Fetching template with ID:", req.params.id);
      const template = await prismaStorage.getDesignTemplate(req.params.id);
      console.log("🔍 Template query result:", template ? "Found" : "Not found");

      if (!template) {
        console.log("❌ Template not found in database for ID:", req.params.id);
        return res.status(404).json({ message: "Template not found" });
      }

      // Transform the template data to match frontend expectations
      const transformedTemplate = {
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.categoryId, // Map categoryId to category for frontend compatibility
        tags: template.tags,
        thumbnail: (() => {
          const name = template.name.toLowerCase().replace(/\s+/g, '-');
          // Map common template names to our created images (prioritize over database values)
          const imageMap: { [key: string]: string } = {
            'event-flyer': '/images/templates/event-flyer.svg',
            'modern-business-card': '/images/templates/business-card-modern.svg',
            'vintage-poster': '/images/templates/vintage-poster.svg',
            'creative-flyer': '/images/templates/creative-flyer.svg'
          };
          return imageMap[name] || template.thumbnail || '/images/templates/default-template.svg';
        })(),
        templateData: template.templateData, // Include the Konva JSON data
        createdAt: template.createdAt
      };

      res.json(transformedTemplate);
    } catch (error) {
      console.error("Error fetching template:", error);
      res.status(500).json({ message: "Failed to fetch template" });
    }
  });

  // Design projects routes (for logged-in users)
  app.get("/api/design-projects", async (req: any, res) => {
    try {
      // In production, get userId from authentication
      const userId = req.session?.user?.id as string;
      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }
      const projects = await prismaStorage.getUserDesignProjects(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching design projects:", error);
      res.status(500).json({ message: "Failed to fetch design projects" });
    }
  });

  app.post("/api/design-projects", async (req, res) => {
    try {
      console.log('📥 Received design project data:', {
        userId: req.body.userId,
        productId: req.body.productId,
        name: req.body.name,
        designDataType: typeof req.body.designData,
        hasDesignData: !!req.body.designData,
        previewImageLength: req.body.previewImage?.length || 0
      });

      const projectData = insertUserDesignProjectSchema.parse(req.body);
      console.log('✅ Design project data validated successfully');

      const project = await prismaStorage.createDesignProject(projectData);
      console.log('✅ Design project created:', project.id);

      res.status(201).json(project);
    } catch (error) {
      console.error("❌ Error creating design project:", error);
      console.error("❌ Request body:", JSON.stringify(req.body, null, 2));

      // Provide more detailed error information
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: "Invalid project data structure",
          issues: error.errors
        });
      } else {
        res.status(400).json({
          message: "Invalid project data",
          details: error instanceof Error ? error.message : String(error)
        });
      }
    }
  });

  app.put("/api/design-projects/:id", async (req, res) => {
    try {
      console.log('📝 Updating design project:', req.params.id);
      console.log('📥 Update data:', {
        userId: req.body.userId,
        productId: req.body.productId,
        name: req.body.name,
        designDataType: typeof req.body.designData,
        hasDesignData: !!req.body.designData
      });

      const updates = insertUserDesignProjectSchema.partial().parse(req.body);
      console.log('✅ Update data validated successfully');

      const project = await prismaStorage.updateDesignProject(req.params.id, updates);
      console.log('✅ Design project updated:', project.id);

      res.json(project);
    } catch (error) {
      console.error("❌ Error updating design project:", error);
      console.error("❌ Update request body:", JSON.stringify(req.body, null, 2));

      // Provide more detailed error information
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: "Invalid project data structure",
          issues: error.errors
        });
      } else {
        res.status(400).json({
          message: "Invalid project data",
          details: error instanceof Error ? error.message : String(error)
        });
      }
    }
  });

  app.delete("/api/design-projects/:id", async (req, res) => {
    try {
      await prismaStorage.deleteDesignProject(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting design project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Cart routes
  app.get("/api/cart", async (req: any, res) => {
    try {
      const userId = req.session?.user?.id as string;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const cartItems = await prismaStorage.getCartItems(userId);
      res.json(cartItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.post("/api/cart", async (req: any, res) => {
    try {
      if (!req.session?.user?.id) {
        return res.status(401).json({ message: "Authentication required to add item to cart" });
      }
      const userId = req.session.user.id;

      const { productId, quantity, designProjectId, selectedOptions } = req.body; // Removed Zod parsing here to ensure proper type handling below
      const parsedQuantity = z.number().int().min(1).parse(quantity);
      const parsedSelectedOptions = z.array(productOptionZodSchema).optional().default([]).parse(selectedOptions); // Use productOptionZodSchema for parsing

      const product = await prismaStorage.getProduct(productId || ''); // Ensure productId is string
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${productId}` });
      }

      let unitPrice = parseFloat(product.basePrice?.toString() || '0');
      
      const allProductOptions = await prismaStorage.getProductOptions(productId || '');

      // Apply product options defaultPriceModifier
      if (parsedSelectedOptions && parsedSelectedOptions.length > 0) {
        for (const option of parsedSelectedOptions as Array<ProductOptionClient>) {
          const foundOption = allProductOptions.find(opt => opt.id === option.id);
          if (foundOption) {
            unitPrice += parseFloat(foundOption.defaultPriceModifier?.toString() || '0');
          }
        }
      }

      let totalPrice = unitPrice * parsedQuantity;

      // Apply price rules from all selected options (e.g., quantity-based discounts)
      if (parsedSelectedOptions && parsedSelectedOptions.length > 0) {
        for (const selectedOption of parsedSelectedOptions as Array<ProductOptionClient>) {
          const foundOption = allProductOptions.find(opt => opt.id === selectedOption.id);
          if (foundOption && foundOption.priceRules) {
            const parsedPriceRules = priceRuleSchema.parse(foundOption.priceRules);
            for (const rule of parsedPriceRules.quantityRanges || []) {
              if (parsedQuantity >= rule.min && parsedQuantity <= rule.max) {
                totalPrice *= rule.modifier;
                break; // Apply first matching rule and exit
              }
            }
          }
        }
      }

      const validatedCartItemData: z.infer<typeof insertCartItemSchema> = {
        userId,
        productId,
        designProjectId,
        quantity: parsedQuantity,
        selectedOptions: parsedSelectedOptions, // Use parsedSelectedOptions (ProductOptionClient[])
        unitPrice: unitPrice.toFixed(2), // Ensure 2 decimal places and type string
        totalPrice: totalPrice.toFixed(2), // Ensure 2 decimal places and type string
      };

      const cartItem = await prismaStorage.addToCart(validatedCartItemData);
      res.status(201).json(cartItem);
    } catch (error) {
      console.error("Error adding to cart:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid cart item data", issues: error.errors });
      }
      res.status(400).json({ message: "Invalid cart item data" });
    }
  });

  app.put("/api/cart/:id", async (req: any, res) => {
    try {
      if (!req.session?.user?.id) {
        return res.status(401).json({ message: "Authentication required to update cart item" });
      }
      const userId = req.session.user.id;
      const cartItemId = req.params.id;

      const updates = insertCartItemSchema.partial().parse(req.body);

      // Only allow quantity update for now, or ensure unitPrice/totalPrice are re-calculated
      if (updates.quantity !== undefined) {
        const existingCartItems = await prismaStorage.getCartItems(userId);
        const existingCartItem = existingCartItems.find(item => item.id === cartItemId);
        if (!existingCartItem || existingCartItem.userId !== userId) {
          return res.status(404).json({ message: "Cart item not found or unauthorized" });
        }

        const product = await prismaStorage.getProduct(existingCartItem.productId || ''); // Ensure productId is string
        if (!product) {
          return res.status(404).json({ message: `Product not found for cart item: ${existingCartItem.productId}` });
        }

        let unitPrice = parseFloat(product.basePrice?.toString() || '0');

        const allProductOptions = await prismaStorage.getProductOptions(existingCartItem.productId || '');

        // Apply product options defaultPriceModifier from existing cart item
        if (existingCartItem.selectedOptions && (existingCartItem.selectedOptions as ProductOptionClient[]).length > 0) {
          for (const option of existingCartItem.selectedOptions as Array<ProductOptionClient>) {
            const foundOption = allProductOptions.find(opt => opt.id === option.id);
            if (foundOption) {
              unitPrice += parseFloat(foundOption.defaultPriceModifier?.toString() || '0');
            }
          }
        }

        const newQuantity = updates.quantity;
        let newTotalPrice = unitPrice * (newQuantity ?? 0);

        // Apply price rules from all selected options (e.g., quantity-based discounts)
        if (existingCartItem.selectedOptions && (existingCartItem.selectedOptions as ProductOptionClient[]).length > 0) {
          for (const selectedOption of existingCartItem.selectedOptions as Array<ProductOptionClient>) {
            const foundOption = allProductOptions.find(opt => opt.id === selectedOption.id);
            if (foundOption && foundOption.priceRules) {
              const parsedPriceRules = priceRuleSchema.parse(foundOption.priceRules);
              for (const rule of parsedPriceRules.quantityRanges || []) {
                if ((newQuantity ?? 0) >= rule.min && (newQuantity ?? 0) <= rule.max) {
                  newTotalPrice *= rule.modifier;
                  break; // Apply first matching rule and exit
                }
              }
            }
          }
        }

        const updatedCartItemData: Partial<z.infer<typeof insertCartItemSchema>> = { // Use Partial for updates
          quantity: newQuantity,
          unitPrice: unitPrice.toFixed(2), // Ensure 2 decimal places and type string
          totalPrice: newTotalPrice.toFixed(2), // Ensure 2 decimal places and type string
        };
        const cartItem = await prismaStorage.updateCartItem(cartItemId, updatedCartItemData);
        return res.json(cartItem);
      } else {
        // If other fields are updated, and not quantity, directly update (should not happen for prices)
        const cartItem = await prismaStorage.updateCartItem(cartItemId, updates);
        return res.json(cartItem);
      }
    } catch (error) {
      console.error("Error updating cart item:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid cart item data", issues: error.errors });
      }
      res.status(400).json({ message: "Invalid cart item data" });
    }
  });

  app.delete("/api/cart/:id", async (req, res) => {
    try {
      await prismaStorage.removeFromCart(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing from cart:", error);
      res.status(500).json({ message: "Failed to remove from cart" });
    }
  });

  // Orders routes
  app.get("/api/orders", async (req: any, res) => {
    try {
      const userId = req.session?.user?.id as string;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const orders = await prismaStorage.getOrders(userId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });
  // Vendor orders
  app.get("/api/vendor/orders", requireRole(["VENDOR", "ADMIN"]), async (req: any, res) => {
    try {
      const vendorId = req.session?.user?.id as string;
      if (!vendorId) return res.status(401).json({ message: "Authentication required" });

      const { status, limit, offset } = req.query as { status?: string; limit?: string; offset?: string };
      const parsedLimit = limit ? parseInt(limit) : undefined;
      const parsedOffset = offset ? parseInt(offset) : undefined;

      const { orders, total } = await prismaStorage.getPaginatedOrders({
        vendorId,
        status,
        limit: parsedLimit,
        offset: parsedOffset,
      });
      res.json({ orders, total });
    } catch (error) {
      console.error("Error fetching vendor orders:", error);
      res.status(500).json({ message: "Failed to fetch vendor orders" });
    }
  });

  app.post("/api/orders/:id/status", requireRole(["VENDOR", "ADMIN"]), async (req, res) => {
    try {
      const { status } = req.body as { status?: string };
      if (!status) return res.status(400).json({ message: "Status required" });
      if (!(req as any).session?.user || (!hasPermission(req, 'order:update_status') && (req as any).session.user.role !== 'ADMIN')) {
        return res.status(403).json({ message: 'Missing permission: order:update_status' });
      }
      // Vendors can only update orders containing their products
      const role = (req as any).session?.user?.role;
      const vendorId = (req as any).session?.user?.id;
      if (role === 'VENDOR') {
        const owns = await prismaStorage.isOrderOwnedByVendor(req.params.id, vendorId || '');
        if (!owns) return res.status(403).json({ message: "Forbidden" });
      }
      const order = await prismaStorage.updateOrder(req.params.id, { status } as any);
      res.json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Admin vendors list
  app.get("/api/admin/vendors", requireRole(["ADMIN"]), async (_req, res) => {
    try {
      const vendors = await prismaStorage.listVendors();
      res.json(vendors);
    } catch (error) {
      console.error("Error listing vendors:", error);
      res.status(500).json({ message: "Failed to list vendors" });
    }
  });

  app.post("/api/admin/vendors/:id/toggle", requireRole(["ADMIN"]), async (req: any, res) => {
    try {
      const isActive = !!req.body?.isActive;
      const user = await prismaStorage.updateUser(req.params.id, { isActive } as any);
      res.json(user);
    } catch (error) {
      console.error("Error updating vendor:", error);
      res.status(500).json({ message: "Failed to update vendor" });
    }
  });

  app.post("/api/admin/vendors/:id/permissions", requireRole(["ADMIN"]), async (req: any, res) => {
    try {
      const permissions = req.body?.permissions || [];
      const user = await prismaStorage.updateUser(req.params.id, { permissions } as any);
      res.json(user);
    } catch (error) {
      console.error("Error updating permissions:", error);
      res.status(500).json({ message: "Failed to update permissions" });
    }
  });

  // Vendor shop routes (public access for customers)
  app.get("/api/vendor/shop/:shopName", async (req, res) => {
    try {
      const { shopName } = req.params;

      // Find vendor by shopName directly
      const vendor = await prismaStorage.findVendorByShopName(shopName.toLowerCase());

      if (!vendor) {
        return res.status(404).json({ message: "Vendor shop not found" });
      }

      res.json(vendor);
    } catch (error) {
      console.error("Error fetching vendor shop:", error);
      res.status(500).json({ message: "Failed to fetch vendor shop" });
    }
  });

  // Get products by vendor (updated to handle both category slug and categoryId)
  app.get("/api/products", async (req, res) => {
    try {
      const { vendorId, category, categoryId } = req.query;

      // If category slug is provided, convert to categoryId
      let finalCategoryId: string | undefined;
      if (category) {
        const categoryData = await prismaStorage.getProductCategoryBySlug(category as string);
        finalCategoryId = categoryData?.id;
      } else if (categoryId) {
        finalCategoryId = categoryId as string;
      }

      const products = await prismaStorage.getProducts(finalCategoryId, vendorId as string);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Admin all orders
  app.get("/api/admin/orders", requireRole(["ADMIN"]), async (req: any, res) => {
    try {
      const { status, limit, offset } = req.query as { status?: string; limit?: string; offset?: string };
      const parsedLimit = limit ? parseInt(limit) : undefined;
      const parsedOffset = offset ? parseInt(offset) : undefined;

      const { orders, total } = await prismaStorage.getPaginatedOrders({
        status,
        limit: parsedLimit,
        offset: parsedOffset,
      });
      res.json({ orders, total });
    } catch (error) {
      console.error("Error listing all orders:", error);
      res.status(500).json({ message: "Failed to list orders" });
    }
  });
  
  // Admin user management
  app.get("/api/admin/users", requireRole(["ADMIN"]), async (_req, res) => {
    try {
      const users = await prismaStorage.listUsers();
      res.json(users);
    } catch (error) {
      console.error("Error listing users:", error);
      res.status(500).json({ message: "Failed to list users" });
    }
  });

  app.post("/api/admin/users", requireRole(["ADMIN"]), async (req: any, res) => {
    try {
      const { password, email, firstName, lastName, role, isActive, permissions, phone, profileImageUrl } = req.body;

      if (!email || !firstName || !lastName || !role) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Hash password if provided
      const hashedPassword = password ? await bcrypt.hash(password, SALT_ROUNDS) : '';

      const userData: InsertUser = {
        email,
        firstName,
        lastName,
        role,
        isActive: isActive ?? true, // default to true if not provided
        permissions: permissions ?? [],
        phone: phone ?? null,
        profileImageUrl: profileImageUrl ?? null,
        password: hashedPassword // Use hashed password or empty string
      };

      const user = await prismaStorage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", issues: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/admin/users/:id", requireRole(["ADMIN"]), async (req: any, res) => {
    try {
      const userId = req.params.id;
      const { password, ...updates } = req.body; 

      const userUpdates: Partial<InsertUser> = { ...updates };

      // Hash new password if provided and not empty
      if (password) {
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        userUpdates.password = hashedPassword;
      }
      
      const user = await prismaStorage.updateUser(userId, userUpdates);
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", issues: error.errors });
      }
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.post("/api/orders", async (req: any, res) => {
    try {
      if (!req.session?.user?.id) {
        return res.status(401).json({ message: "Authentication required to place an order" });
      }
      const userId = req.session.user.id;

      // Validate and parse the order data, excluding items for now as they are processed separately
      const { items: clientItems, ...orderData } = req.body; // Extract items manually
      const parsedOrderData = insertOrderSchema.parse(orderData); // Use insertOrderSchema for parsing
      
      if (!Array.isArray(clientItems) || clientItems.length === 0) {
        return res.status(400).json({ message: "Order must contain items" });
      }

      const validatedOrderItems: z.infer<typeof insertOrderItemSchema>[] = []; // Use insertOrderItemSchema for items
      let calculatedSubtotal = 0;

      for (const clientItem of clientItems) {
        // Validate each item using insertOrderItemSchema
        const parsedClientItem = insertOrderItemSchema.parse(clientItem);
        
        const product = await prismaStorage.getProduct(parsedClientItem.productId || ''); // Ensure productId is string
        if (!product) {
          return res.status(404).json({ message: `Product not found: ${parsedClientItem.productId}` });
        }

        // Server-side price validation and calculation
        let unitPrice = parseFloat(product.basePrice?.toString() || '0');
        
        const allProductOptions = await prismaStorage.getProductOptions(parsedClientItem.productId || '');

        // Apply any product options price modifiers if applicable
        if (parsedClientItem.selectedOptions && parsedClientItem.selectedOptions.length > 0) {
          for (const option of parsedClientItem.selectedOptions as Array<ProductOptionClient>) {
            const foundOption = allProductOptions.find(opt => opt.id === option.id);
            if (foundOption) unitPrice += parseFloat(foundOption.defaultPriceModifier?.toString() || '0');
          }
        }

        let totalPrice = unitPrice * parsedClientItem.quantity;

        // Apply price rules from all selected options (e.g., quantity-based discounts)
        if (parsedClientItem.selectedOptions && parsedClientItem.selectedOptions.length > 0) {
          for (const selectedOption of parsedClientItem.selectedOptions as Array<ProductOptionClient>) {
            const foundOption = allProductOptions.find(opt => opt.id === selectedOption.id);
            if (foundOption && foundOption.priceRules) {
              const parsedPriceRules = priceRuleSchema.parse(foundOption.priceRules);
              for (const rule of parsedPriceRules.quantityRanges || []) {
                if (parsedClientItem.quantity >= rule.min && parsedClientItem.quantity <= rule.max) {
                  totalPrice *= rule.modifier;
                  break; // Apply first matching rule and exit
                }
              }
            }
          }
        }
        
        validatedOrderItems.push({
          productId: product.id,
          quantity: parsedClientItem.quantity,
          unitPrice: unitPrice.toFixed(2), // Ensure 2 decimal places and type string
          totalPrice: totalPrice.toFixed(2), // Ensure 2 decimal places and type string
          designProjectId: parsedClientItem.designProjectId,
          selectedOptions: parsedClientItem.selectedOptions, // Include selected options in order item
          printFiles: [], // Initialize as empty array for print files
        });
        calculatedSubtotal += totalPrice;
      }

      // Recalculate shipping cost and total amount on the server
      const shippingCost = calculatedSubtotal > 1000 ? 0 : 50;
      const totalAmount = calculatedSubtotal + shippingCost;
      
      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const finalOrderData = {
        ...parsedOrderData, // Use parsed order data
        userId,
        orderNumber,
        subtotal: parseFloat(calculatedSubtotal.toFixed(2)), // Convert to number
        shippingCost: parseFloat(shippingCost.toFixed(2)), // Convert to number
        totalAmount: parseFloat(totalAmount.toFixed(2)), // Convert to number
      } as z.infer<typeof insertOrderSchema>;

      const order = await prismaStorage.createOrderWithItems(finalOrderData, validatedOrderItems);

      // Create vendor notifications for each product's vendor and emit SSE event
      try {
        const orderItems = await prismaStorage.getOrderItems(order.id);
        for (const item of orderItems) {
          const product = await prismaStorage.getProduct(item.productId || ''); // Ensure productId is string
          if (product?.vendorId) {
            await prismaStorage.createNotification({
              userId: product.vendorId,
              title: `New Order ${order.orderNumber}`,
              body: `You have a new order containing your product (${product.nameEn}). Quantity: ${item.quantity}.`,
            } as any);
            // Emit SSE
            const event = {
              type: 'new-order',
              orderId: order.id,
              orderNumber: order.orderNumber,
            };
            app.get('sseEmit')?.(product.vendorId, event);
          }
        }
      } catch (notifyErr) {
        console.error("Failed to create vendor notifications", notifyErr);
      }
      
      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid order data", issues: error.errors });
      }
      res.status(400).json({ message: "Invalid order data" });
    }
  });
  // Notification routes
  app.get("/api/notifications", async (req: any, res) => {
    try {
      const userId = req.session?.user?.id as string;
      if (!userId) return res.status(400).json({ message: "User ID required" });
      const notifs = await prismaStorage.getNotifications(userId);
      res.json(notifs);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications/:id/read", async (req, res) => {
    try {
      const notif = await prismaStorage.markNotificationRead(req.params.id);
      res.json(notif);
    } catch (error) {
      console.error("Error updating notification:", error);
      res.status(500).json({ message: "Failed to update notification" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await prismaStorage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      const items = await prismaStorage.getOrderItems(req.params.id);
      res.json({ ...order, items });
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // AI text content generation
  app.post("/api/ai/generate-text", async (req, res) => {
    try {
      const { businessType, tone, length } = req.body;

      if (!businessType) {
        return res.status(400).json({ message: "Business type required" });
      }

      // Simple fallback text generation (could be enhanced with AI)
      const textTemplates = {
        restaurant: {
          casual: "Welcome to our cozy restaurant! Enjoy authentic flavors and warm hospitality.",
          professional: "Experience culinary excellence at our fine dining establishment, featuring locally sourced ingredients and exceptional service.",
          friendly: "Come taste the love in every bite! Our restaurant serves up smiles with every meal."
        },
        retail: {
          casual: "Shop your favorites and discover something new! Great prices, friendly service.",
          professional: "Your premier destination for quality products and exceptional shopping experience.",
          friendly: "Browse, shop, and smile! We're here to make your shopping experience delightful."
        },
        service: {
          casual: "We're here to help you succeed! Professional services with a personal touch.",
          professional: "Delivering excellence in service with attention to detail and customer satisfaction.",
          friendly: "Your success is our mission! Let's work together to achieve great results."
        }
      };

      const templates = (textTemplates as any)[businessType.toLowerCase()] || textTemplates.service;
      const selectedTone = templates[tone] || templates.professional;

      res.json({
        content: selectedTone,
        businessType,
        tone: tone || 'professional',
        suggestions: [
          "Consider adding your unique selling points",
          "Include a call-to-action",
          "Mention contact information",
          "Add location or hours if relevant"
        ]
      });
    } catch (error) {
      console.error("Error generating text:", error);
      res.status(500).json({ message: "Failed to generate text content" });
    }
  });

  // AI-powered design routes
  app.post("/api/ai/design-from-text", async (req, res) => {
    try {
      const { prompt, productType, dimensions } = req.body;

      if (!prompt || !productType || !dimensions) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const startTime = Date.now();
      const design = await generateDesignFromText(prompt, productType, dimensions);
      const processingTime = Date.now() - startTime;

      // Log the AI call (estimate tokens used)
      const estimatedTokens = Math.ceil((prompt.length + JSON.stringify(design).length) / 4);
      logAICall(estimatedTokens);

      console.log(`🎨 Design generated in ${processingTime}ms, ~${estimatedTokens} tokens`);

      res.json(design);
    } catch (error) {
      console.error("Error generating design from text:", error);

      // Check if it's a quota exceeded error and provide fallback
      if ((error as Error).message.includes("429") || (error as Error).message.includes("quota")) {
        console.log("⚠️  AI quota exceeded, using fallback design");
        return res.json({
          layout: "Clean and professional layout with balanced spacing",
          colors: ["#3B82F6", "#1E40AF", "#F8FAFC"],
          fonts: ["Inter", "Poppins"],
          elements: [
            {
              type: "text",
              content: "Your Business Name",
              position: { x: 50, y: 50 },
              style: { fontSize: "18px", fontWeight: "bold", color: "#1E40AF" }
            },
            {
              type: "text",
              content: "Professional Services",
              position: { x: 50, y: 100 },
              style: { fontSize: "14px", color: "#64748B" }
            }
          ],
          reasoning: "Classic professional design with modern colors suitable for Thai business market. Due to high demand, using pre-designed template."
        });
      }

      res.status(500).json({ message: "Failed to generate design" });
    }
  });

  app.post("/api/ai/color-palette", async (req, res) => {
    try {
      console.log('🎨 Color palette request received:', {
        body: req.body,
        headers: req.headers,
        method: req.method,
        url: req.url
      });

      const { brandDescription, industry } = req.body;

      if (!brandDescription || !industry) {
        console.log('❌ Missing required fields:', { brandDescription, industry });
        return res.status(400).json({ 
          message: "Brand description and industry required",
          received: { brandDescription, industry },
          body: req.body
        });
      }

      const startTime = Date.now();
      const palette = await generateColorPalette(brandDescription, industry);
      const processingTime = Date.now() - startTime;

      // Log the AI call
      const estimatedTokens = Math.ceil((brandDescription.length + industry.length + JSON.stringify(palette).length) / 4);
      logAICall(estimatedTokens);

      console.log(`🎨 Color palette generated in ${processingTime}ms, ~${estimatedTokens} tokens`);

      res.json(palette);
    } catch (error) {
      console.error("Error generating color palette:", error);

      // Provide fallback palettes when API quota exceeded
      if ((error as Error).message.includes("429") || (error as Error).message.includes("quota")) {
        console.log("⚠️  AI quota exceeded, using fallback palette");
        const fallbackPalettes = {
          "business": {
            primary: "#1E40AF",
            secondary: "#3B82F6",
            accent: "#F59E0B",
            neutral: ["#F8FAFC", "#E2E8F0", "#64748B"],
            reasoning: "Professional blue palette with warm accent, suitable for Thai business market"
          },
          "creative": {
            primary: "#7C3AED",
            secondary: "#A855F7",
            accent: "#F97316",
            neutral: ["#FAF5FF", "#E2E8F0", "#64748B"],
            reasoning: "Creative purple and orange combination for modern Thai brands"
          },
          "food": {
            primary: "#DC2626",
            secondary: "#EF4444",
            accent: "#F59E0B",
            neutral: ["#FEF2F2", "#E2E8F0", "#64748B"],
            reasoning: "Appetizing red and orange palette perfect for Thai food businesses"
          }
        };

        const description = (req.body.brandDescription || '').toLowerCase();
        const selectedPalette = fallbackPalettes[(description.includes('food') ? 'food' : description.includes('creative') ? 'creative' : 'business')];
        return res.json(selectedPalette);
      }

      res.status(500).json({ message: "Failed to generate color palette" });
    }
  });

  app.post("/api/ai/analyze-image", async (req, res) => {
    try {
      const { image } = req.body;

      if (!image) {
        return res.status(400).json({ message: "Image data required" });
      }

      // Remove data URL prefix if present
      const base64Image = image.replace(/^data:image\/[a-z]+;base64,/, '');

      const startTime = Date.now();
      const analysis = await analyzeDesignImage(base64Image);
      const processingTime = Date.now() - startTime;

      // Log the AI call (images use more tokens)
      const estimatedTokens = Math.ceil((base64Image.length / 100) + JSON.stringify(analysis).length / 4);
      logAICall(estimatedTokens);

      console.log(`🔍 Image analyzed in ${processingTime}ms, ~${estimatedTokens} tokens`);

      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing image:", error);
      res.status(500).json({ message: "Failed to analyze image" });
    }
  });

  app.post("/api/ai/remove-background", async (req, res) => {
    try {
      const { image } = req.body;

      if (!image) {
        return res.status(400).json({ message: "Image data required" });
      }

      const base64Image = image.replace(/^data:image\/[a-z]+;base64,/, '');

      const startTime = Date.now();
      const result = await removeBackground(base64Image);
      const processingTime = Date.now() - startTime;

      const estimatedTokens = Math.ceil((base64Image.length / 100) + JSON.stringify(result).length / 4);
      logAICall(estimatedTokens);

      console.log(`✂️  Background removed in ${processingTime}ms, ~${estimatedTokens} tokens`);

      res.json(result);
    } catch (error) {
      console.error("Error removing background:", error);
      res.status(500).json({ message: "Failed to remove background" });
    }
  });

  app.post("/api/ai/design-variations", async (req, res) => {
    try {
      const { currentDesign, variationType } = req.body;

      if (!currentDesign || !variationType) {
        return res.status(400).json({ message: "Design data and variation type required" });
      }

      const startTime = Date.now();
      const variations = await generateDesignVariations(currentDesign, variationType);
      const processingTime = Date.now() - startTime;

      const estimatedTokens = Math.ceil((JSON.stringify(currentDesign).length + JSON.stringify(variations).length) / 4);
      logAICall(estimatedTokens);

      console.log(`🔄 Design variations generated in ${processingTime}ms, ~${estimatedTokens} tokens`);

      res.json(variations);
    } catch (error) {
      console.error("Error generating design variations:", error);
      res.status(500).json({ message: "Failed to generate variations" });
    }
  });

  // Price calculation route
  app.post("/api/calculate-price", async (req, res) => {
    try {
      const { productId, quantity, selectedOptions } = req.body;
      
      if (!productId || !quantity) {
        return res.status(400).json({ message: "Product ID and quantity required" });
      }

      const product = await prismaStorage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      let totalPrice = parseFloat(product.basePrice?.toString() || '0') * quantity;
      
      // Get all product options to apply rules from
      const allProductOptions = await prismaStorage.getProductOptions(productId || '');

      // Apply default price modifiers from selected options
      if (selectedOptions && selectedOptions.length > 0) {
        for (const selectedOption of selectedOptions as Array<ProductOptionClient>) {
          const foundOption = allProductOptions.find(opt => opt.id === selectedOption.id);
          if (foundOption) {
            totalPrice += parseFloat(foundOption.defaultPriceModifier?.toString() || '0') * quantity;
          }
        }
      }

      // Apply price rules from all selected options (e.g., quantity-based discounts)
      if (selectedOptions && selectedOptions.length > 0) {
        for (const selectedOption of selectedOptions as Array<ProductOptionClient>) {
          const foundOption = allProductOptions.find(opt => opt.id === selectedOption.id);
          if (foundOption && foundOption.priceRules) {
            const parsedPriceRules = priceRuleSchema.parse(foundOption.priceRules);
            for (const rule of parsedPriceRules.quantityRanges || []) {
              if (quantity >= rule.min && quantity <= rule.max) {
                totalPrice *= rule.modifier;
                break; // Apply first matching rule and exit
              }
            }
          }
        }
      }

      // No longer using fixed quantity discounts, rules are dynamic per option
      // if (quantity >= 500) {
      //   totalPrice *= 0.9; // 10% discount
      // } else if (quantity >= 200) {
      //   totalPrice *= 0.95; // 5% discount
      // }

      const shippingCost = totalPrice > 1000 ? 0 : 50;
      const subtotal = totalPrice; // Subtotal before shipping
      const finalTotalPrice = totalPrice + shippingCost;

      res.json({
        basePrice: parseFloat(product.basePrice?.toString() || '0'),
        quantity,
        subtotal: subtotal,
        shippingCost: shippingCost,
        totalPrice: finalTotalPrice
      });
    } catch (error) {
      console.error("Error calculating price:", error);
      res.status(500).json({ message: "Failed to calculate price" });
    }
  });

  // AI Cost monitoring endpoints
  app.get("/api/ai/cost-metrics", async (req, res) => {
    try {
      const metrics = getCostMetrics();
      res.json({
        ...metrics,
        savings: {
          cachedPercentage: metrics.totalRequests > 0 ? (metrics.cachedResponses / (metrics.totalRequests + metrics.cachedResponses)) * 100 : 0,
          estimatedMonthlySavings: metrics.estimatedCost * 0.3 // Rough estimate of cache savings
        }
      });
    } catch (error) {
      console.error("Error fetching AI cost metrics:", error);
      res.status(500).json({ message: "Failed to fetch cost metrics" });
    }
  });

  app.post("/api/ai/reset-cost-metrics", async (req, res) => {
    try {
      resetCostMetrics();
      res.json({ message: "Cost metrics reset successfully" });
    } catch (error) {
      console.error("Error resetting cost metrics:", error);
      res.status(500).json({ message: "Failed to reset cost metrics" });
    }
  });

  // Contact form endpoint
  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // In production, integrate with email service (SendGrid, AWS SES, etc.)
      console.log('Contact form submission:', { name, email, subject, message });
      
      // For now, just acknowledge receipt
      res.status(200).json({ 
        message: "Thank you for your message! We'll get back to you soon.",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error processing contact form:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // ===== VENDOR SUBMISSION ROUTES =====

  // Submit design to vendors
  app.post("/api/designs/submit-to-vendors", async (req: any, res) => {
    try {
      const { designId, vendorIds, quantity, specifications } = req.body;
      const userId = req.session?.user?.id;

      if (!userId || !designId || !vendorIds || !Array.isArray(vendorIds)) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Get the design project
      const design = await prismaStorage.getDesignProject(designId);
      if (!design || design.userId !== userId) {
        return res.status(404).json({ message: "Design not found" });
      }

      // Get vendors
      const vendors = await prismaStorage.listVendors();
      const selectedVendors = vendors.filter(v => vendorIds.includes(v.id));

      if (selectedVendors.length === 0) {
        return res.status(400).json({ message: "No valid vendors selected" });
      }

      // Create print orders for each vendor
      const orders = [];
      for (const vendor of selectedVendors) {
        // Here you would create a print order record
        // For now, we'll just simulate the submission
        orders.push({
          vendorId: vendor.id,
          vendorName: `${vendor.firstName} ${vendor.lastName}`,
          status: 'submitted'
        });

        // Create notification for vendor
        await prismaStorage.createNotification({
          userId: vendor.id,
          title: `New Print Order`,
          body: `New design submitted for printing. Quantity: ${quantity}`,
        } as any);
      }

      res.json({
        message: "Design submitted to vendors successfully",
        orders,
        designId,
        submittedAt: new Date()
      });
    } catch (error) {
      console.error("Error submitting to vendors:", error);
      res.status(500).json({ message: "Failed to submit design to vendors" });
    }
  });

  // Get vendor quotes for a design
  app.get("/api/designs/:designId/quotes", async (req: any, res) => {
    try {
      const { designId } = req.params;
      const userId = req.session?.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Get design project
      const design = await prismaStorage.getDesignProject(designId);
      if (!design || design.userId !== userId) {
        return res.status(404).json({ message: "Design not found" });
      }

      // Simulate vendor quotes (in real app, this would be from vendor responses)
      const quotes = [
        {
          vendorId: "vendor1",
          vendorName: "PrintMaster Pro",
          price: 25.50,
          turnaroundDays: 3,
          currency: "THB",
          specifications: {
            paperType: "Glossy Cardstock",
            colorMode: "CMYK",
            finish: "Matte"
          }
        },
        {
          vendorId: "vendor2",
          vendorName: "QuickPrint Bangkok",
          price: 22.00,
          turnaroundDays: 5,
          currency: "THB",
          specifications: {
            paperType: "Standard Cardstock",
            colorMode: "CMYK",
            finish: "Glossy"
          }
        }
      ];

      res.json({ quotes });
    } catch (error) {
      console.error("Error fetching quotes:", error);
      res.status(500).json({ message: "Failed to fetch vendor quotes" });
    }
  });

  // Accept vendor quote and place order
  app.post("/api/designs/:designId/accept-quote", async (req: any, res) => {
    try {
      const { designId } = req.params;
      const { vendorId, quoteId } = req.body;
      const userId = req.session?.user?.id;

      if (!userId || !vendorId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Get design project
      const design = await prismaStorage.getDesignProject(designId);
      if (!design || design.userId !== userId) {
        return res.status(404).json({ message: "Design not found" });
      }

      // Create a print order (simulated)
      const orderNumber = `PRINT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Update design status
      await prismaStorage.updateDesignProject(designId, { status: 'submitted' } as any);

      // Create notification for vendor
      await prismaStorage.createNotification({
        userId: vendorId,
        title: `Order Confirmed`,
        body: `Order ${orderNumber} has been confirmed and is ready for printing.`,
      } as any);

      res.json({
        message: "Quote accepted and order placed",
        orderNumber,
        status: 'confirmed',
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
      });
    } catch (error) {
      console.error("Error accepting quote:", error);
      res.status(500).json({ message: "Failed to accept quote" });
    }
  });

  // ===== STRIPE PAYMENT ROUTES =====

  // Create payment intent for Thai banking
  app.post("/api/stripe/create-payment-intent", async (req: any, res) => {
    try {
      const { amount, orderId, customerEmail } = req.body;

      if (!amount || !orderId) {
        return res.status(400).json({ message: "Amount and orderId are required" });
      }

      const StripeService = (await import('./stripe')).default;
      const paymentIntent = await StripeService.createThaiPaymentIntent({
        amount: parseFloat(amount),
        orderId,
        customerEmail,
      });

      res.json(paymentIntent);
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  // Confirm payment intent
  app.post("/api/stripe/confirm-payment/:paymentIntentId", async (req: any, res) => {
    try {
      const { paymentIntentId } = req.params;

      const StripeService = (await import('./stripe')).default;
      const confirmation = await StripeService.confirmPaymentIntent(paymentIntentId);

      res.json(confirmation);
    } catch (error) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ message: "Failed to confirm payment" });
    }
  });

  // Get Thai banking options
  app.get("/api/stripe/thai-banks", async (req, res) => {
    try {
      const { THAI_BANKING_OPTIONS } = await import('./stripe');
      res.json(THAI_BANKING_OPTIONS);
    } catch (error) {
      console.error("Error getting Thai banks:", error);
      res.status(500).json({ message: "Failed to get Thai banking options" });
    }
  });

  // Webhook endpoint for Stripe events
  app.post("/api/stripe/webhook", express.raw({ type: 'application/json' }), async (req: any, res) => {
    try {
      const sig = req.headers['stripe-signature'];
      const rawBody = req.body;

      const StripeService = (await import('./stripe')).default;
      const result = await StripeService.handleWebhook(rawBody, sig);

      res.json(result);
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(400).json({ message: "Webhook error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

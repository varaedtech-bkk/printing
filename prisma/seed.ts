import { PrismaClient, UserRole, OrderStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Utility function to hash passwords
async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

// Sample data for seeding
const sampleUsers = [
  {
    email: "admin@cognitosphere.com",
    firstName: "System",
    lastName: "Administrator",
    role: UserRole.ADMIN,
    phone: "+66-2-123-4567",
    password: "admin123!@#",
    permissions: ["all"]
  },
  {
    email: "sunny@srcprint.com",
    firstName: "Sunny",
    lastName: "Chen",
    role: UserRole.VENDOR,
    phone: "+66-2-123-4567",
    password: "vendor123!@#",
    permissions: ["products:manage", "orders:view"],
    shopName: "sunnyshop",
    shopDescription: "Premium business cards and professional printing services",
    shopBanner: "/images/shops/sunny-banner.jpg"
  },
  {
    email: "contact@bkkprints.com",
    firstName: "Somchai",
    lastName: "Prasert",
    role: UserRole.VENDOR,
    phone: "+66-2-987-6543",
    password: "vendor123!@#",
    permissions: ["products:manage", "orders:view"],
    shopName: "bkkprints",
    shopDescription: "Large format printing and outdoor banners",
    shopBanner: "/images/shops/bkk-banner.jpg"
  },
  {
    email: "hello@creativeprint.co.th",
    firstName: "Creative",
    lastName: "Print Co",
    role: UserRole.VENDOR,
    phone: "+66-2-555-0123",
    password: "vendor123!@#",
    permissions: ["products:manage", "orders:view"],
    shopName: "creativeprint",
    shopDescription: "Creative designs and custom printing solutions",
    shopBanner: "/images/shops/creative-banner.jpg"
  }
];

const sampleCategories = [
  {
    nameEn: "Business Cards",
    nameTh: "นามบัตร",
    slug: "business-cards",
    description: "Professional business cards in various styles and materials",
    image: "/images/categories/business-cards.jpg"
  },
  {
    nameEn: "Flyers & Brochures",
    nameTh: "ใบปลิวและโบรชัวร์",
    slug: "flyers-brochures",
    description: "Marketing materials and promotional flyers",
    image: "/images/categories/flyers.jpg"
  },
  {
    nameEn: "Banners & Posters",
    nameTh: "แบนเนอร์และโปสเตอร์",
    slug: "banners-posters",
    description: "Large format printing for events and advertising",
    image: "/images/categories/banners.jpg"
  },
  {
    nameEn: "Stickers & Labels",
    nameTh: "สติ๊กเกอร์และลาเบล",
    slug: "stickers-labels",
    description: "Custom stickers and labels for branding",
    image: "/images/categories/stickers.jpg"
  }
];

async function main() {
  console.log("🌱 Seeding database with Prisma...");

  try {
    // Use a transaction for data consistency
    await prisma.$transaction(async (tx) => {
      // Create users with proper password hashing
      console.log("👤 Creating users...");
      const createdUsers = [];

      for (const userData of sampleUsers) {
        const user = await tx.user.upsert({
          where: { email: userData.email },
          update: {},
          create: {
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role,
            phone: userData.phone,
            isActive: true,
            password: await hashPassword(userData.password),
            permissions: userData.permissions,
            ...(userData.shopName && {
              shopName: userData.shopName,
              shopDescription: userData.shopDescription,
              shopBanner: userData.shopBanner
            })
          }
        });
        createdUsers.push(user);
      }

      console.log(`✅ Created ${createdUsers.length} users`);

      // Create product categories
      console.log("📂 Creating product categories...");
      const createdCategories = [];

      for (const categoryData of sampleCategories) {
        const category = await tx.productCategory.upsert({
          where: { slug: categoryData.slug },
          update: {},
          create: {
            nameEn: categoryData.nameEn,
            nameTh: categoryData.nameTh,
            slug: categoryData.slug,
            description: categoryData.description,
            image: categoryData.image,
            isActive: true
          }
        });
        createdCategories.push(category);
      }

      console.log(`✅ Created ${createdCategories.length} product categories`);

      // Get vendors for product creation
      const vendors = createdUsers.filter(user => user.role === UserRole.VENDOR);
      const businessCardsCategory = createdCategories.find(cat => cat.slug === "business-cards")!;
      const flyersCategory = createdCategories.find(cat => cat.slug === "flyers-brochures")!;
      const bannersCategory = createdCategories.find(cat => cat.slug === "banners-posters")!;
      const stickersCategory = createdCategories.find(cat => cat.slug === "stickers-labels")!;

      // Create products
      console.log("📦 Creating products...");

      // Business Cards
      const standardBusinessCard = await tx.product.upsert({
        where: { slug: "standard-business-card" },
        update: {},
        create: {
          categoryId: businessCardsCategory.id,
          vendorId: vendors[0].id,
          nameEn: "Standard Business Card",
          nameTh: "นามบัตรมาตรฐาน",
          slug: "standard-business-card",
          description: "Classic 9cm x 5.4cm business card with premium finish",
          basePrice: 2.50,
          image: "/images/products/business-card-standard.jpg",
          specifications: {
            size: "9cm x 5.4cm",
            material: "300gsm Art Card",
            finish: "Matte/Gloss",
            colors: "Full Color (CMYK)"
          },
          isActive: true,
          availableOptionTypes: ["quantity", "paper", "finish"]
        }
      });

      const squareBusinessCard = await tx.product.upsert({
        where: { slug: "square-business-card" },
        update: {},
        create: {
          categoryId: businessCardsCategory.id,
          vendorId: vendors[0].id,
          nameEn: "Square Business Card",
          nameTh: "นามบัตรสี่เหลี่ยม",
          slug: "square-business-card",
          description: "Modern square business card design",
          basePrice: 3.00,
          image: "/images/products/business-card-square.jpg",
          specifications: {
            size: "8.5cm x 8.5cm",
            material: "300gsm Art Card",
            finish: "Gloss",
            colors: "Full Color (CMYK)"
          },
          isActive: true,
          availableOptionTypes: ["quantity", "paper", "finish"]
        }
      });

      // Flyers
      const a4Flyer = await tx.product.upsert({
        where: { slug: "a4-flyer" },
        update: {},
        create: {
          categoryId: flyersCategory.id,
          vendorId: vendors[1].id,
          nameEn: "A4 Flyer",
          nameTh: "ใบปลิว A4",
          slug: "a4-flyer",
          description: "Standard A4 promotional flyer",
          basePrice: 1.20,
          image: "/images/products/flyer-a4.jpg",
          specifications: {
            size: "A4 (21cm x 29.7cm)",
            material: "150gsm Glossy Paper",
            finish: "Gloss",
            colors: "Full Color (CMYK)"
          },
          isActive: true,
          availableOptionTypes: ["quantity", "paper", "finish"]
        }
      });

      // Banners
      const vinylBanner = await tx.product.upsert({
        where: { slug: "vinyl-banner" },
        update: {},
        create: {
          categoryId: bannersCategory.id,
          vendorId: vendors[1].id,
          nameEn: "Vinyl Banner",
          nameTh: "แบนเนอร์ไวนิล",
          slug: "vinyl-banner",
          description: "Outdoor vinyl banner for advertising",
          basePrice: 25.00,
          image: "/images/products/banner-vinyl.jpg",
          specifications: {
            size: "Custom sizes available",
            material: "440gsm Vinyl",
            finish: "Gloss",
            colors: "Full Color (CMYK)"
          },
          isActive: true,
          availableOptionTypes: ["quantity", "size", "finish"]
        }
      });

      // Stickers
      const roundStickers = await tx.product.upsert({
        where: { slug: "round-stickers" },
        update: {},
        create: {
          categoryId: stickersCategory.id,
          vendorId: vendors[2].id,
          nameEn: "Round Stickers",
          nameTh: "สติ๊กเกอร์กลม",
          slug: "round-stickers",
          description: "Custom round stickers for branding",
          basePrice: 0.15,
          image: "/images/products/stickers-round.jpg",
          specifications: {
            size: "5cm diameter",
            material: "Vinyl sticker paper",
            finish: "Gloss",
            colors: "Full Color (CMYK)"
          },
          isActive: true,
          availableOptionTypes: ["quantity", "size", "finish"]
        }
      });

      console.log("✅ Created products");

      // Create product options
      console.log("⚙️ Creating product options...");

      const products = [standardBusinessCard, squareBusinessCard, a4Flyer, vinylBanner, roundStickers];

      for (const product of products) {
        // Quantity options
        await tx.productOption.createMany({
          data: [
            {
              productId: product.id,
              type: "quantity",
              nameEn: "100",
              nameTh: "100",
              defaultPriceModifier: 0,
              isDefault: product.slug === "standard-business-card" ? false : true
            },
            {
              productId: product.id,
              type: "quantity",
              nameEn: "250",
              nameTh: "250",
              defaultPriceModifier: 0,
              isDefault: product.slug === "standard-business-card" ? false : false
            },
            {
              productId: product.id,
              type: "quantity",
              nameEn: "500",
              nameTh: "500",
              defaultPriceModifier: 0,
              isDefault: product.slug === "standard-business-card" ? true : false
            },
            {
              productId: product.id,
              type: "quantity",
              nameEn: "1000",
              nameTh: "1000",
              defaultPriceModifier: 0,
              isDefault: false
            }
          ]
        });
      }

      console.log("✅ Created product options");

      // Create design templates
      console.log("🎨 Creating design templates...");

      const businessCardTemplate = await tx.designTemplate.upsert({
        where: { id: "business-card-template-1" },
        update: {},
        create: {
          categoryId: businessCardsCategory.id,
          name: "Modern Business Card",
          description: "Clean and professional business card template",
          thumbnail: "/images/templates/business-card-modern.jpg",
          templateData: {
            version: "1.0",
            canvas: {
              width: 350,
              height: 200,
              backgroundColor: "#ffffff"
            },
            elements: [
              {
                type: "text",
                id: "name",
                x: 175,
                y: 80,
                text: "Your Name",
                fontSize: 18,
                fontFamily: "Inter",
                fill: "#000000",
                align: "center"
              },
              {
                type: "text",
                id: "title",
                x: 175,
                y: 105,
                text: "Your Title",
                fontSize: 12,
                fontFamily: "Inter",
                fill: "#666666",
                align: "center"
              },
              {
                type: "text",
                id: "contact",
                x: 175,
                y: 140,
                text: "Phone | Email | Website",
                fontSize: 10,
                fontFamily: "Inter",
                fill: "#333333",
                align: "center"
              }
            ]
          },
          tags: ["modern", "professional", "clean"],
          isActive: true
        }
      });

      const flyerTemplate = await tx.designTemplate.upsert({
        where: { id: "flyer-template-1" },
        update: {},
        create: {
          categoryId: flyersCategory.id,
          name: "Event Flyer",
          description: "Promotional flyer template for events",
          thumbnail: "/images/templates/event-flyer.jpg",
          templateData: {
            version: "1.0",
            canvas: {
              width: 595,
              height: 842,
              backgroundColor: "#ffffff"
            },
            elements: [
              {
                type: "text",
                id: "title",
                x: 297,
                y: 100,
                text: "EVENT TITLE",
                fontSize: 48,
                fontFamily: "Inter",
                fill: "#2563eb",
                align: "center",
                fontWeight: "bold"
              },
              {
                type: "text",
                id: "subtitle",
                x: 297,
                y: 180,
                text: "Join us for an amazing experience",
                fontSize: 24,
                fontFamily: "Inter",
                fill: "#666666",
                align: "center"
              },
              {
                type: "rectangle",
                id: "background",
                x: 50,
                y: 250,
                width: 495,
                height: 400,
                fill: "#f3f4f6",
                stroke: "#d1d5db",
                strokeWidth: 1
              }
            ]
          },
          tags: ["event", "promotional", "colorful"],
          isActive: true
        }
      });

      console.log("✅ Created design templates");

      // Create location for pricing
      console.log("📍 Creating locations...");
      const bangkokLocation = await tx.location.upsert({
        where: { locationId: "bangkok" },
        update: {},
        create: {
          locationId: "bangkok",
          name: "Bangkok, Thailand",
          address: "Bangkok 10400, Thailand",
          isActive: true
        }
      });

      console.log("✅ Created locations");

      // Create product pricing
      console.log("💰 Creating product pricing...");

      const pricingData = [
        // Standard Business Card pricing
        { productId: standardBusinessCard.id, quantity: 100, basePrice: 250.00, discountedPrice: 225.00 },
        { productId: standardBusinessCard.id, quantity: 250, basePrice: 400.00, discountedPrice: 360.00 },
        { productId: standardBusinessCard.id, quantity: 500, basePrice: 600.00, discountedPrice: 540.00 },
        { productId: standardBusinessCard.id, quantity: 1000, basePrice: 900.00, discountedPrice: 810.00 },

        // A4 Flyer pricing
        { productId: a4Flyer.id, quantity: 100, basePrice: 120.00, discountedPrice: 108.00 },
        { productId: a4Flyer.id, quantity: 250, basePrice: 250.00, discountedPrice: 225.00 },
        { productId: a4Flyer.id, quantity: 500, basePrice: 400.00, discountedPrice: 360.00 },
        { productId: a4Flyer.id, quantity: 1000, basePrice: 650.00, discountedPrice: 585.00 },

        // Vinyl Banner pricing (per square meter)
        { productId: vinylBanner.id, quantity: 1, basePrice: 1500.00, discountedPrice: 1350.00 },

        // Round Stickers pricing (per piece)
        { productId: roundStickers.id, quantity: 100, basePrice: 15.00, discountedPrice: 13.50 },
        { productId: roundStickers.id, quantity: 250, basePrice: 30.00, discountedPrice: 27.00 },
        { productId: roundStickers.id, quantity: 500, basePrice: 50.00, discountedPrice: 45.00 },
        { productId: roundStickers.id, quantity: 1000, basePrice: 80.00, discountedPrice: 72.00 }
      ];

      for (const pricing of pricingData) {
        await tx.productPricing.upsert({
          where: {
            productId_locationId_quantity: {
              productId: pricing.productId,
              locationId: bangkokLocation.id,
              quantity: pricing.quantity
            }
          },
          update: {},
          create: {
            productId: pricing.productId,
            locationId: bangkokLocation.id,
            quantity: pricing.quantity,
            basePrice: pricing.basePrice,
            discountedPrice: pricing.discountedPrice,
            isActive: true
          }
        });
      }

      console.log("✅ Created product pricing");

    }, {
      timeout: 60000 // 60 second timeout for large transactions
      });

    console.log("🎉 Database seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log("- 4 users created (1 admin, 3 vendors)");
    console.log("- 4 product categories created");
    console.log("- 5 products created with options");
    console.log("- 2 design templates created");
    console.log("- 1 location created");
    console.log("- Product pricing created for all products");
    console.log("\n🔑 Test Credentials:");
    console.log("- Admin: admin@cognitosphere.com / admin123!@#");
    console.log("- Vendor: sunny@srcprint.com / vendor123!@#");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  });

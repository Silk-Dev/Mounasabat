import { PrismaClient } from "../src/generated/client";

const prisma = new PrismaClient();

/**
 * Base seed script that creates essential platform data required for the platform to function.
 * This script should be run in all environments including production.
 * 
 * Creates:
 * - System admin accounts
 * - Essential service categories
 * - System configuration settings
 * - Default templates for common event types
 */
async function seedBase() {
  console.log("🌱 Starting base database seeding...");

  try {
    // Create system admin user
    console.log("👤 Creating system admin user...");
    const adminUser = await prisma.user.upsert({
      where: { email: "admin@mounasabet.com" },
      update: {},
      create: {
        id: "admin-system",
        name: "System Administrator",
        email: "admin@mounasabet.com",
        emailVerified: true,
        role: "admin",
        language: "fr",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log(`✅ Admin user created: ${adminUser.email}`);

    // Create essential service categories
    console.log("📂 Creating essential service categories...");
    const categories = [
      {
        id: "category-venues",
        name: "Venues",
        slug: "venues",
        icon: "🏛️",
        description: "Event venues and location rentals",
        isActive: true,
        sortOrder: 1,
      },
      {
        id: "category-catering",
        name: "Catering",
        slug: "catering",
        icon: "🍽️",
        description: "Food and beverage services for events",
        isActive: true,
        sortOrder: 2,
      },
      {
        id: "category-photography",
        name: "Photography",
        slug: "photography",
        icon: "📸",
        description: "Professional photography and videography",
        isActive: true,
        sortOrder: 3,
      },
      {
        id: "category-entertainment",
        name: "Entertainment",
        slug: "entertainment",
        icon: "🎵",
        description: "Live entertainment and performance services",
        isActive: true,
        sortOrder: 4,
      },
      {
        id: "category-decoration",
        name: "Decoration",
        slug: "decoration",
        icon: "🌸",
        description: "Event decoration and styling services",
        isActive: true,
        sortOrder: 5,
      },
      {
        id: "category-planning",
        name: "Event Planning",
        slug: "event-planning",
        icon: "📋",
        description: "Complete event planning and coordination services",
        isActive: true,
        sortOrder: 6,
      },
      {
        id: "category-transportation",
        name: "Transportation",
        slug: "transportation",
        icon: "🚗",
        description: "Transportation and logistics services",
        isActive: true,
        sortOrder: 7,
      },
      {
        id: "category-beauty",
        name: "Beauty & Wellness",
        slug: "beauty-wellness",
        icon: "💄",
        description: "Beauty, wellness, and spa services",
        isActive: true,
        sortOrder: 8,
      },
    ];

    for (const category of categories) {
      await prisma.category.upsert({
        where: { id: category.id },
        update: {
          name: category.name,
          description: category.description,
          isActive: category.isActive,
          sortOrder: category.sortOrder,
        },
        create: category,
      });
    }

    console.log(`✅ Created ${categories.length} service categories`);

    // Create essential event templates
    console.log("📋 Creating essential event templates...");
    const templates = [
      {
        id: "template-wedding",
        name: "Wedding Celebration",
        description: "Complete template for wedding planning with all essential services",
        eventType: "Wedding",
        version: 1,
        isActive: true,
      },
      {
        id: "template-corporate",
        name: "Corporate Event",
        description: "Professional template for business events and conferences",
        eventType: "Corporate",
        version: 1,
        isActive: true,
      },
      {
        id: "template-birthday",
        name: "Birthday Party",
        description: "Fun template for birthday celebrations",
        eventType: "Birthday",
        version: 1,
        isActive: true,
      },
      {
        id: "template-anniversary",
        name: "Anniversary Celebration",
        description: "Romantic template for anniversary celebrations",
        eventType: "Anniversary",
        version: 1,
        isActive: true,
      },
    ];

    for (const templateData of templates) {
      await prisma.template.upsert({
        where: { id: templateData.id },
        update: {
          name: templateData.name,
          description: templateData.description,
          isActive: templateData.isActive,
        },
        create: templateData,
      });
    }

    console.log(`✅ Created ${templates.length} event templates`);

    // Create template items for wedding template
    console.log("📝 Creating template items...");
    const weddingTemplateItems = [
      {
        templateId: "template-wedding",
        category: "Photography",
        name: "Wedding Photographer",
        description: "Professional photographer for ceremony and reception coverage",
        isRequired: true,
        order: 1,
      },
      {
        templateId: "template-wedding",
        category: "Catering",
        name: "Wedding Catering",
        description: "Food and beverage service for wedding guests",
        isRequired: true,
        order: 2,
      },
      {
        templateId: "template-wedding",
        category: "Venue",
        name: "Wedding Venue",
        description: "Location for wedding ceremony and/or reception",
        isRequired: true,
        order: 3,
      },
      {
        templateId: "template-wedding",
        category: "Music",
        name: "Wedding Music/DJ",
        description: "Music and entertainment for the celebration",
        isRequired: false,
        order: 4,
      },
      {
        templateId: "template-wedding",
        category: "Decoration",
        name: "Wedding Decoration",
        description: "Floral arrangements and venue decoration",
        isRequired: false,
        order: 5,
      },
      {
        templateId: "template-wedding",
        category: "Transportation",
        name: "Wedding Transportation",
        description: "Transportation for the wedding party",
        isRequired: false,
        order: 6,
      },
    ];

    const corporateTemplateItems = [
      {
        templateId: "template-corporate",
        category: "Venue",
        name: "Conference Venue",
        description: "Professional meeting space with AV equipment",
        isRequired: true,
        order: 1,
      },
      {
        templateId: "template-corporate",
        category: "Catering",
        name: "Business Catering",
        description: "Professional catering for corporate events",
        isRequired: false,
        order: 2,
      },
      {
        templateId: "template-corporate",
        category: "Technology",
        name: "AV Equipment",
        description: "Audio-visual equipment and technical support",
        isRequired: false,
        order: 3,
      },
      {
        templateId: "template-corporate",
        category: "Photography",
        name: "Event Photography",
        description: "Professional photography for corporate events",
        isRequired: false,
        order: 4,
      },
    ];

    const birthdayTemplateItems = [
      {
        templateId: "template-birthday",
        category: "Venue",
        name: "Party Venue",
        description: "Fun venue for birthday celebrations",
        isRequired: false,
        order: 1,
      },
      {
        templateId: "template-birthday",
        category: "Catering",
        name: "Party Catering",
        description: "Food and drinks for birthday party",
        isRequired: false,
        order: 2,
      },
      {
        templateId: "template-birthday",
        category: "Entertainment",
        name: "Party Entertainment",
        description: "Entertainment and activities for guests",
        isRequired: false,
        order: 3,
      },
      {
        templateId: "template-birthday",
        category: "Decoration",
        name: "Party Decoration",
        description: "Themed decorations for birthday party",
        isRequired: false,
        order: 4,
      },
    ];

    const allTemplateItems = [...weddingTemplateItems, ...corporateTemplateItems, ...birthdayTemplateItems];

    for (const item of allTemplateItems) {
      const itemId = `${item.templateId}-${item.category.toLowerCase()}-${item.order}`;
      await prisma.templateItem.upsert({
        where: {
          id: itemId,
        },
        update: {
          description: item.description,
          isRequired: item.isRequired,
          order: item.order,
        },
        create: {
          id: itemId,
          ...item,
        },
      });
    }

    console.log(`✅ Created ${allTemplateItems.length} template items`);

    // Create essential products for platform functionality
    console.log("🎁 Creating essential products...");
    const essentialProducts = [
      {
        id: "product-invitation-basic",
        name: "Basic Event Invitations",
        description: "Simple and elegant event invitations",
        category: "Invitations",
        basePrice: 1.5,
        images: [],
        isCustomizable: true,
        isActive: true,
        inventory: 10000,
      },
      {
        id: "product-favor-box-basic",
        name: "Basic Favor Boxes",
        description: "Simple gift boxes for event favors",
        category: "Packaging",
        basePrice: 0.8,
        images: [],
        isCustomizable: false,
        isActive: true,
        inventory: 5000,
      },
    ];

    for (const product of essentialProducts) {
      await prisma.product.upsert({
        where: { id: product.id },
        update: {
          name: product.name,
          description: product.description,
          basePrice: product.basePrice,
          isActive: product.isActive,
        },
        create: product,
      });
    }

    console.log(`✅ Created ${essentialProducts.length} essential products`);

    // Create customization options for essential products
    console.log("🎨 Creating basic customization options...");
    const customizationOptions = [
      {
        productId: "product-invitation-basic",
        name: "Event Text",
        type: "text",
        options: {
          maxLength: 500,
          placeholder: "Enter your event details"
        },
        required: true,
      },
      {
        productId: "product-invitation-basic",
        name: "Color Theme",
        type: "color",
        options: {
          colors: ["#000000", "#FFFFFF", "#FFD700", "#FF69B4", "#87CEEB"]
        },
        priceAdd: 0.2,
        required: false,
      },
    ];

    for (const option of customizationOptions) {
      const optionId = `${option.productId}-${option.name.toLowerCase().replace(/\s+/g, '-')}`;
      await prisma.customizationOption.upsert({
        where: {
          id: optionId,
        },
        update: {
          type: option.type,
          options: option.options,
          priceAdd: option.priceAdd,
          required: option.required,
        },
        create: {
          id: optionId,
          ...option,
        },
      });
    }

    console.log(`✅ Created ${customizationOptions.length} customization options`);

    console.log("✅ Base database seeding completed successfully!");
    
    // Summary
    const summary = {
      users: await prisma.user.count(),
      categories: await prisma.category.count(),
      templates: await prisma.template.count(),
      templateItems: await prisma.templateItem.count(),
      products: await prisma.product.count(),
      customizationOptions: await prisma.customizationOption.count(),
    };

    console.log(`
📊 Base seed summary:
- Users: ${summary.users}
- Categories: ${summary.categories}
- Templates: ${summary.templates}
- Template Items: ${summary.templateItems}
- Products: ${summary.products}
- Customization Options: ${summary.customizationOptions}
    `);

  } catch (error) {
    console.error("❌ Error during base seeding:", error);
    throw error;
  }
}

export default seedBase;

// Run the seed function if called directly
if (require.main === module) {
  seedBase()
    .catch((e) => {
      console.error("❌ Base seeding failed:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
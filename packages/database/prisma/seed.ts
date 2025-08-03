import { PrismaClient } from "../src/generated/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Clean existing data (in development only)
  if (process.env.NODE_ENV !== "production") {
    console.log("🧹 Cleaning existing data...");
    await prisma.notification.deleteMany();
    await prisma.conciergeRequest.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.review.deleteMany();
    await prisma.orderTracking.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.quoteItem.deleteMany();
    await prisma.quote.deleteMany();
    await prisma.message.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.packageItem.deleteMany();
    await prisma.package.deleteMany();
    await prisma.templateItem.deleteMany();
    await prisma.template.deleteMany();
    await prisma.customizationOption.deleteMany();
    await prisma.product.deleteMany();
    await prisma.service.deleteMany();
    await prisma.issue.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.provider.deleteMany();
    await prisma.event.deleteMany();
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();
  }

  // Create sample users
  console.log("👥 Creating sample users...");
  const users = await Promise.all([
    prisma.user.create({
      data: {
        id: "user-1",
        name: "Ahmed Ben Ali",
        email: "ahmed@example.com",
        emailVerified: true,
        language: "fr",
        phoneNumber: "+216 20 123 456",
        address: "Tunis, Tunisia",
        preferences: {
          notifications: { email: true, sms: false },
          theme: "light"
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        id: "user-2",
        name: "Fatima Trabelsi",
        email: "fatima@example.com",
        emailVerified: true,
        language: "ar",
        phoneNumber: "+216 25 789 012",
        address: "Sfax, Tunisia",
        preferences: {
          notifications: { email: true, sms: true },
          theme: "dark"
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        id: "user-3",
        name: "Mohamed Khelifi",
        email: "mohamed@example.com",
        emailVerified: true,
        language: "fr",
        phoneNumber: "+216 22 345 678",
        address: "Sousse, Tunisia",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
  ]);

  // Create sample providers
  console.log("🏢 Creating sample providers...");
  const providers = await Promise.all([
    prisma.provider.create({
      data: {
        id: "provider-1",
        userId: "user-2",
        name: "Fatima's Wedding Photography",
        description: "Professional wedding and event photography services in Tunisia",
        contactEmail: "fatima@example.com",
        phoneNumber: "+216 25 789 012",
        address: "Sfax, Tunisia",
        website: "https://fatimaphoto.tn",
        businessLicense: "BL-2024-001",
        isVerified: true,
        rating: 4.8,
        reviewCount: 25,
        location: { lat: 34.7406, lng: 10.7603 },
        coverageAreas: ["Sfax", "Sousse", "Monastir"],
        services: ["Wedding Photography", "Event Photography", "Portrait Photography"],
      },
    }),
    prisma.provider.create({
      data: {
        id: "provider-2",
        userId: users[0].id,
        name: "Elite Catering Services",
        description: "Premium catering services for weddings and corporate events",
        contactEmail: "ahmed@example.com",
        phoneNumber: "+216 20 123 456",
        address: "Tunis, Tunisia",
        businessLicense: "BL-2024-002",
        isVerified: true,
        rating: 4.6,
        reviewCount: 18,
        location: { lat: 36.8065, lng: 10.1815 },
        coverageAreas: ["Tunis", "Ariana", "Ben Arous"],
        services: ["Wedding Catering", "Corporate Catering", "Event Planning"],
      },
    }),
  ]);

  // Create sample services
  console.log("🎯 Creating sample services...");
  const services = await Promise.all([
    prisma.service.create({
      data: {
        id: "service-1",
        providerId: providers[0].id,
        name: "Wedding Photography Package",
        description: "Complete wedding photography coverage including ceremony, reception, and couple portraits",
        category: "Photography",
        images: [
          "https://example.com/wedding-photo-1.jpg",
          "https://example.com/wedding-photo-2.jpg"
        ],
        pricingType: "FIXED",
        basePrice: 1200.0,
        priceUnit: "per_event",
        location: "Sfax, Tunisia",
        coverageArea: ["Sfax", "Sousse", "Monastir"],
      },
    }),
    prisma.service.create({
      data: {
        id: "service-2",
        providerId: providers[0].id,
        name: "Event Photography",
        description: "Professional photography for corporate events, birthdays, and celebrations",
        category: "Photography",
        images: ["https://example.com/event-photo-1.jpg"],
        pricingType: "QUOTE",
        location: "Sfax, Tunisia",
        coverageArea: ["Sfax", "Sousse"],
      },
    }),
    prisma.service.create({
      data: {
        id: "service-3",
        providerId: providers[1].id,
        name: "Wedding Catering Premium",
        description: "Premium catering service with traditional Tunisian and international cuisine",
        category: "Catering",
        images: [
          "https://example.com/catering-1.jpg",
          "https://example.com/catering-2.jpg"
        ],
        pricingType: "FIXED",
        basePrice: 45.0,
        priceUnit: "per_person",
        location: "Tunis, Tunisia",
        coverageArea: ["Tunis", "Ariana", "Ben Arous"],
      },
    }),
  ]);

  // Create sample products
  console.log("🎁 Creating sample products...");
  const products = await Promise.all([
    prisma.product.create({
      data: {
        id: "product-1",
        name: "Custom Wedding Invitation Cards",
        description: "Beautiful personalized wedding invitation cards with custom text and design",
        category: "Invitations",
        basePrice: 2.5,
        images: [
          "https://example.com/invitation-1.jpg",
          "https://example.com/invitation-2.jpg"
        ],
        isCustomizable: true,
        inventory: 1000,
      },
    }),
    prisma.product.create({
      data: {
        id: "product-2",
        name: "Personalized Coffee Mugs",
        description: "Custom coffee mugs with photos and text for wedding favors",
        category: "Gifts",
        basePrice: 8.0,
        images: ["https://example.com/mug-1.jpg"],
        isCustomizable: true,
        inventory: 500,
      },
    }),
    prisma.product.create({
      data: {
        id: "product-3",
        name: "Wedding Favor Boxes",
        description: "Elegant gift boxes for wedding favors and treats",
        category: "Packaging",
        basePrice: 1.2,
        images: ["https://example.com/box-1.jpg"],
        isCustomizable: false,
        inventory: 2000,
      },
    }),
  ]);

  // Create customization options for products
  console.log("🎨 Creating customization options...");
  await Promise.all([
    prisma.customizationOption.create({
      data: {
        productId: products[0].id,
        name: "Custom Text",
        type: "text",
        options: {
          maxLength: 200,
          fonts: ["Arial", "Times New Roman", "Calligraphy"]
        },
        required: true,
      },
    }),
    prisma.customizationOption.create({
      data: {
        productId: products[0].id,
        name: "Color Theme",
        type: "color",
        options: {
          colors: ["#FFD700", "#FF69B4", "#87CEEB", "#98FB98"]
        },
        priceAdd: 0.5,
        required: false,
      },
    }),
    prisma.customizationOption.create({
      data: {
        productId: products[1].id,
        name: "Photo Upload",
        type: "image",
        options: {
          maxFiles: 2,
          formats: ["jpg", "png"]
        },
        priceAdd: 2.0,
        required: false,
      },
    }),
  ]);

  // Create event templates
  console.log("📋 Creating event templates...");
  const templates = await Promise.all([
    prisma.template.create({
      data: {
        id: "template-1",
        name: "Traditional Tunisian Wedding",
        description: "Complete template for a traditional Tunisian wedding celebration",
        eventType: "Wedding",
        version: 1,
      },
    }),
    prisma.template.create({
      data: {
        id: "template-2",
        name: "Corporate Event",
        description: "Professional template for corporate events and conferences",
        eventType: "Corporate",
        version: 1,
      },
    }),
    prisma.template.create({
      data: {
        id: "template-3",
        name: "Birthday Celebration",
        description: "Fun template for birthday parties and celebrations",
        eventType: "Birthday",
        version: 1,
      },
    }),
  ]);

  // Create template items
  console.log("📝 Creating template items...");
  await Promise.all([
    // Wedding template items
    prisma.templateItem.create({
      data: {
        templateId: templates[0].id,
        category: "Photography",
        name: "Wedding Photographer",
        description: "Professional photographer for ceremony and reception",
        isRequired: true,
        order: 1,
      },
    }),
    prisma.templateItem.create({
      data: {
        templateId: templates[0].id,
        category: "Catering",
        name: "Wedding Catering",
        description: "Food and beverage service for guests",
        isRequired: true,
        order: 2,
      },
    }),
    prisma.templateItem.create({
      data: {
        templateId: templates[0].id,
        category: "Decoration",
        name: "Venue Decoration",
        description: "Floral arrangements and venue styling",
        isRequired: false,
        order: 3,
      },
    }),
    // Corporate template items
    prisma.templateItem.create({
      data: {
        templateId: templates[1].id,
        category: "Venue",
        name: "Conference Room",
        description: "Professional meeting space with AV equipment",
        isRequired: true,
        order: 1,
      },
    }),
    prisma.templateItem.create({
      data: {
        templateId: templates[1].id,
        category: "Catering",
        name: "Business Lunch",
        description: "Professional catering for corporate events",
        isRequired: false,
        order: 2,
      },
    }),
  ]);

  // Create sample packages
  console.log("📦 Creating sample packages...");
  const packages = await Promise.all([
    prisma.package.create({
      data: {
        id: "package-1",
        providerId: providers[0].id,
        name: "Complete Wedding Photography",
        description: "Full wedding coverage with engagement session",
        totalPrice: 1500.0,
        discount: 200.0,
      },
    }),
    prisma.package.create({
      data: {
        id: "package-2",
        providerId: providers[1].id,
        name: "Wedding Catering Deluxe",
        description: "Premium catering with appetizers, main course, and dessert",
        totalPrice: 2500.0,
        discount: 300.0,
      },
    }),
  ]);

  // Create package items
  console.log("📋 Creating package items...");
  await Promise.all([
    prisma.packageItem.create({
      data: {
        packageId: packages[0].id,
        serviceId: services[0].id,
        quantity: 1,
        price: 1200.0,
      },
    }),
    prisma.packageItem.create({
      data: {
        packageId: packages[1].id,
        serviceId: services[2].id,
        quantity: 1,
        price: 2200.0,
      },
    }),
  ]);

  // Create sample events
  console.log("🎉 Creating sample events...");
  const events = await Promise.all([
    prisma.event.create({
      data: {
        id: "event-1",
        name: "Ahmed & Leila's Wedding",
        description: "Traditional Tunisian wedding celebration",
        type: "Wedding",
        status: "ACTIVE",
        startDate: new Date("2025-09-15T16:00:00Z"),
        endDate: new Date("2025-09-15T23:00:00Z"),
        templateId: templates[0].id,
      },
    }),
    prisma.event.create({
      data: {
        id: "event-2",
        name: "Tech Conference 2025",
        description: "Annual technology conference",
        type: "Corporate",
        status: "DRAFT",
        startDate: new Date("2025-10-20T09:00:00Z"),
        endDate: new Date("2025-10-20T17:00:00Z"),
        templateId: templates[1].id,
      },
    }),
  ]);

  // Create sample bookings
  console.log("📅 Creating sample bookings...");
  await Promise.all([
    prisma.booking.create({
      data: {
        id: "booking-1",
        eventId: events[0].id,
        userId: users[0].id,
        providerId: providers[0].id,
        serviceId: services[0].id,
        startTime: new Date("2025-09-15T16:00:00Z"),
        endTime: new Date("2025-09-15T23:00:00Z"),
        status: "CONFIRMED",
        paymentStatus: "PAID",
      },
    }),
    prisma.booking.create({
      data: {
        id: "booking-2",
        eventId: events[0].id,
        userId: users[0].id,
        providerId: providers[1].id,
        serviceId: services[2].id,
        startTime: new Date("2025-09-15T18:00:00Z"),
        endTime: new Date("2025-09-15T22:00:00Z"),
        status: "PENDING",
        paymentStatus: "UNPAID",
      },
    }),
  ]);

  // Create sample orders
  console.log("🛒 Creating sample orders...");
  const orders = await Promise.all([
    prisma.order.create({
      data: {
        id: "order-1",
        userId: users[0].id,
        orderType: "PRODUCT",
        status: "CONFIRMED",
        totalAmount: 125.0,
        eventId: events[0].id,
      },
    }),
    prisma.order.create({
      data: {
        id: "order-2",
        userId: users[1].id,
        orderType: "BOOKING",
        status: "PENDING",
        totalAmount: 1200.0,
      },
    }),
  ]);

  // Create order items
  console.log("📦 Creating order items...");
  await Promise.all([
    prisma.orderItem.create({
      data: {
        orderId: orders[0].id,
        productId: products[0].id,
        name: "Custom Wedding Invitations",
        description: "Personalized wedding invitations with gold theme",
        quantity: 50,
        unitPrice: 2.5,
        totalPrice: 125.0,
        customization: {
          text: "Ahmed & Leila invite you to their wedding",
          color: "#FFD700",
          font: "Calligraphy"
        },
      },
    }),
  ]);

  // Create sample reviews
  console.log("⭐ Creating sample reviews...");
  await Promise.all([
    prisma.review.create({
      data: {
        userId: users[0].id,
        providerId: providers[0].id,
        serviceId: services[0].id,
        rating: 5,
        comment: "Excellent photography service! Fatima captured every special moment perfectly.",
        isVerified: true,
      },
    }),
    prisma.review.create({
      data: {
        userId: users[1].id,
        providerId: providers[1].id,
        serviceId: services[2].id,
        rating: 4,
        comment: "Great catering service with delicious traditional food.",
        isVerified: true,
      },
    }),
  ]);

  // Create sample favorites
  console.log("❤️ Creating sample favorites...");
  await Promise.all([
    prisma.favorite.create({
      data: {
        userId: users[0].id,
        providerId: providers[0].id,
      },
    }),
    prisma.favorite.create({
      data: {
        userId: users[1].id,
        productId: products[0].id,
      },
    }),
  ]);

  // Create sample conversations and messages
  console.log("💬 Creating sample conversations...");
  const conversations = await Promise.all([
    prisma.conversation.create({
      data: {
        id: "conv-1",
        userId: users[0].id,
        providerId: providers[0].id,
        serviceId: services[1].id,
        status: "ACTIVE",
      },
    }),
  ]);

  await Promise.all([
    prisma.message.create({
      data: {
        conversationId: conversations[0].id,
        senderId: users[0].id,
        content: "Hi, I'm interested in your event photography service for my birthday party.",
        messageType: "TEXT",
      },
    }),
    prisma.message.create({
      data: {
        conversationId: conversations[0].id,
        senderId: users[1].id, // Provider user
        content: "Hello! I'd be happy to help with your birthday party. Could you tell me more about the event?",
        messageType: "TEXT",
      },
    }),
  ]);

  // Create sample quotes
  console.log("💰 Creating sample quotes...");
  const quotes = await Promise.all([
    prisma.quote.create({
      data: {
        id: "quote-1",
        conversationId: conversations[0].id,
        providerId: providers[0].id,
        totalAmount: 800.0,
        status: "PENDING",
        validUntil: new Date("2025-08-30T23:59:59Z"),
        notes: "Quote for birthday party photography including 4 hours coverage",
      },
    }),
  ]);

  await Promise.all([
    prisma.quoteItem.create({
      data: {
        quoteId: quotes[0].id,
        description: "Birthday party photography (4 hours)",
        quantity: 1,
        unitPrice: 600.0,
        totalPrice: 600.0,
      },
    }),
    prisma.quoteItem.create({
      data: {
        quoteId: quotes[0].id,
        description: "Photo editing and digital delivery",
        quantity: 1,
        unitPrice: 200.0,
        totalPrice: 200.0,
      },
    }),
  ]);

  // Create sample concierge requests
  console.log("🎩 Creating sample concierge requests...");
  await Promise.all([
    prisma.conciergeRequest.create({
      data: {
        userId: users[0].id,
        eventType: "Wedding",
        description: "I need full planning service for my wedding with 150 guests",
        budget: 15000.0,
        eventDate: new Date("2025-12-20T16:00:00Z"),
        location: "Tunis, Tunisia",
        status: "PENDING",
      },
    }),
  ]);

  // Create sample notifications
  console.log("🔔 Creating sample notifications...");
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: users[0].id,
        type: "EMAIL",
        title: "Booking Confirmed",
        message: "Your booking for wedding photography has been confirmed!",
        isRead: false,
        data: {
          bookingId: "booking-1",
          eventDate: "2025-09-15"
        },
      },
    }),
    prisma.notification.create({
      data: {
        userId: users[1].id,
        type: "IN_APP",
        title: "New Quote Request",
        message: "You have received a new quote request for event photography.",
        isRead: false,
        data: {
          conversationId: conversations[0].id
        },
      },
    }),
  ]);

  console.log("✅ Database seeding completed successfully!");
  console.log(`
📊 Seeded data summary:
- Users: ${users.length}
- Providers: ${providers.length}
- Services: ${services.length}
- Products: ${products.length}
- Templates: ${templates.length}
- Events: ${events.length}
- Orders: ${orders.length}
- Conversations: ${conversations.length}
- Reviews: ${await prisma.review.count()}
- Notifications: ${await prisma.notification.count()}
  `);
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

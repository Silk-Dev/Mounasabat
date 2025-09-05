import { PrismaClient } from "@prisma/client";


const prisma = new PrismaClient();

async function main() {
  console.log("🧪 Starting test database seeding...");

  // Clean all data for testing
  console.log("🧹 Cleaning test database...");
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

  // Create minimal test data
  console.log("👥 Creating test users...");
  const testUser = await prisma.user.create({
    data: {
      id: "test-user-1",
      name: "Test User",
      email: "test@example.com",
      emailVerified: true,
      language: "fr",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const testProvider = await prisma.provider.create({
    data: {
      id: "test-provider-1",
      userId: testUser.id,
      name: "Test Provider",
      description: "Test provider for unit tests",
      contactEmail: "test@example.com",
      isVerified: true,
      rating: 4.5,
      reviewCount: 10,
      location: { lat: 36.8065, lng: 10.1815 },
      services: ["Test Service"],
    },
  });

  const testService = await prisma.service.create({
    data: {
      id: "test-service-1",
      providerId: testProvider.id,
      name: "Test Service",
      description: "Test service for unit tests",
      category: "Testing",
      pricingType: "FIXED",
      basePrice: 100.0,
      priceUnit: "per_hour",
    },
  });

  const testProduct = await prisma.product.create({
    data: {
      id: "test-product-1",
      name: "Test Product",
      description: "Test product for unit tests",
      category: "Testing",
      basePrice: 10.0,
      isCustomizable: true,
      inventory: 100,
    },
  });

  const testTemplate = await prisma.template.create({
    data: {
      id: "test-template-1",
      name: "Test Template",
      description: "Test template for unit tests",
      eventType: "Test",
      version: 1,
    },
  });

  await prisma.templateItem.create({
    data: {
      templateId: testTemplate.id,
      category: "Testing",
      name: "Test Item",
      description: "Test template item",
      isRequired: true,
      order: 1,
    },
  });

  const testEvent = await prisma.event.create({
    data: {
      id: "test-event-1",
      name: "Test Event",
      description: "Test event for unit tests",
      type: "Test",
      status: "DRAFT",
      templateId: testTemplate.id,
    },
  });

  console.log("✅ Test database seeding completed!");
  console.log(`
📊 Test data summary:
- Test User: ${testUser.id}
- Test Provider: ${testProvider.id}
- Test Service: ${testService.id}
- Test Product: ${testProduct.id}
- Test Template: ${testTemplate.id}
- Test Event: ${testEvent.id}
  `);
}

main()
  .catch((e) => {
    console.error("❌ Error during test seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
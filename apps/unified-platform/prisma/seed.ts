import { SeedManager } from "@/lib/database/seed-manager";
import { PrismaClient } from "@prisma/client";


const prisma = new PrismaClient();
const seedManager = new SeedManager(prisma);

async function main() {
  console.log("🌱 Starting database seeding...");

  // Check environment and determine seeding strategy
  const isProduction = process.env.NODE_ENV === "production";
  const includeDemoData = process.env.INCLUDE_DEMO_DATA === "true" || (!isProduction && process.env.INCLUDE_DEMO_DATA !== "false");

  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`Include demo data: ${includeDemoData}`);

  // Clean existing data (in development only)
  if (!isProduction) {
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
    await prisma.systemSettings.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
  }

  // Run seeding using the seed manager
  const result = await seedManager.runFullSeed({
    includeDemo: includeDemoData,
    verbose: true,
  });

  if (!result.success) {
    throw new Error(`Seeding failed: ${result.message}${result.error ? ` - ${result.error}` : ""}`);
  }

  console.log("✅", result.message);
  
  if (result.counts) {
    console.log(`
📊 Final database summary:
- Users: ${result.counts.users}
- Providers: ${result.counts.providers}
- Services: ${result.counts.services}
- Products: ${result.counts.products}
- Templates: ${result.counts.templates}
- Template Items: ${result.counts.templateItems}
- Events: ${result.counts.events}
- Bookings: ${result.counts.bookings}
- Orders: ${result.counts.orders}
- Reviews: ${result.counts.reviews}
- Conversations: ${result.counts.conversations}
- Messages: ${result.counts.messages}
- Favorites: ${result.counts.favorites}
- Notifications: ${result.counts.notifications}
- Categories: ${result.counts.categories}
- System Settings: ${result.counts.systemSettings}
    `);
  }

  return;


}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

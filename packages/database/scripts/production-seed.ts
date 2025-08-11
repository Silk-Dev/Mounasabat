import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedProduction() {
  console.log('🌱 Seeding production database...');

  try {
    // Create admin user
    const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123!', 12);
    
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@mounasabet.com' },
      update: {},
      create: {
        email: 'admin@mounasabet.com',
        name: 'Platform Administrator',
        password: adminPassword,
        role: 'ADMIN',
        emailVerified: new Date(),
        isActive: true,
      },
    });

    console.log('✅ Admin user created');

    // Create service categories
    const categories = [
      {
        name: 'Wedding Venues',
        description: 'Beautiful venues for your special day',
        slug: 'wedding-venues',
        isActive: true,
      },
      {
        name: 'Catering Services',
        description: 'Professional catering for all events',
        slug: 'catering-services',
        isActive: true,
      },
      {
        name: 'Photography',
        description: 'Capture your precious moments',
        slug: 'photography',
        isActive: true,
      },
      {
        name: 'Event Planning',
        description: 'Complete event planning services',
        slug: 'event-planning',
        isActive: true,
      },
      {
        name: 'Entertainment',
        description: 'Music, DJ, and entertainment services',
        slug: 'entertainment',
        isActive: true,
      },
      {
        name: 'Decoration',
        description: 'Beautiful decorations for any occasion',
        slug: 'decoration',
        isActive: true,
      },
    ];

    for (const category of categories) {
      await prisma.category.upsert({
        where: { slug: category.slug },
        update: {},
        create: category,
      });
    }

    console.log('✅ Service categories created');

    // Create sample locations
    const locations = [
      {
        name: 'Tunis',
        country: 'Tunisia',
        coordinates: [36.8065, 10.1815],
        isActive: true,
      },
      {
        name: 'Sfax',
        country: 'Tunisia',
        coordinates: [34.7406, 10.7603],
        isActive: true,
      },
      {
        name: 'Sousse',
        country: 'Tunisia',
        coordinates: [35.8256, 10.6369],
        isActive: true,
      },
      {
        name: 'Kairouan',
        country: 'Tunisia',
        coordinates: [35.6781, 10.0963],
        isActive: true,
      },
    ];

    for (const location of locations) {
      await prisma.location.upsert({
        where: { name: location.name },
        update: {},
        create: location,
      });
    }

    console.log('✅ Locations created');

    // Create platform settings
    const settings = [
      {
        key: 'platform_name',
        value: 'Mounasabet',
        type: 'STRING',
        description: 'Platform name',
      },
      {
        key: 'platform_commission',
        value: '5.0',
        type: 'DECIMAL',
        description: 'Platform commission percentage',
      },
      {
        key: 'min_booking_amount',
        value: '50.0',
        type: 'DECIMAL',
        description: 'Minimum booking amount',
      },
      {
        key: 'max_booking_amount',
        value: '50000.0',
        type: 'DECIMAL',
        description: 'Maximum booking amount',
      },
      {
        key: 'booking_cancellation_hours',
        value: '24',
        type: 'INTEGER',
        description: 'Hours before event to allow cancellation',
      },
      {
        key: 'review_moderation_enabled',
        value: 'true',
        type: 'BOOLEAN',
        description: 'Enable review moderation',
      },
      {
        key: 'auto_approve_providers',
        value: 'false',
        type: 'BOOLEAN',
        description: 'Auto-approve new providers',
      },
    ];

    for (const setting of settings) {
      await prisma.platformSetting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: setting,
      });
    }

    console.log('✅ Platform settings created');

    // Create email templates
    const emailTemplates = [
      {
        name: 'booking_confirmation',
        subject: 'Booking Confirmation - {{booking_id}}',
        htmlContent: `
          <h1>Booking Confirmed!</h1>
          <p>Dear {{customer_name}},</p>
          <p>Your booking has been confirmed.</p>
          <p><strong>Booking ID:</strong> {{booking_id}}</p>
          <p><strong>Service:</strong> {{service_name}}</p>
          <p><strong>Date:</strong> {{event_date}}</p>
          <p><strong>Total:</strong> {{total_amount}}</p>
        `,
        textContent: 'Your booking {{booking_id}} has been confirmed.',
        isActive: true,
      },
      {
        name: 'booking_cancelled',
        subject: 'Booking Cancelled - {{booking_id}}',
        htmlContent: `
          <h1>Booking Cancelled</h1>
          <p>Dear {{customer_name}},</p>
          <p>Your booking has been cancelled.</p>
          <p><strong>Booking ID:</strong> {{booking_id}}</p>
          <p>If you have any questions, please contact support.</p>
        `,
        textContent: 'Your booking {{booking_id}} has been cancelled.',
        isActive: true,
      },
      {
        name: 'provider_welcome',
        subject: 'Welcome to Mounasabet!',
        htmlContent: `
          <h1>Welcome to Mounasabet!</h1>
          <p>Dear {{provider_name}},</p>
          <p>Your provider account has been approved.</p>
          <p>You can now start receiving bookings!</p>
        `,
        textContent: 'Welcome to Mounasabet! Your provider account is now active.',
        isActive: true,
      },
    ];

    for (const template of emailTemplates) {
      await prisma.emailTemplate.upsert({
        where: { name: template.name },
        update: {},
        create: template,
      });
    }

    console.log('✅ Email templates created');

    // Refresh materialized views
    await prisma.$executeRaw`REFRESH MATERIALIZED VIEW search_index`;
    
    console.log('✅ Materialized views refreshed');

    console.log('🎉 Production database seeded successfully!');

  } catch (error) {
    console.error('❌ Error seeding production database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
if (require.main === module) {
  seedProduction()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default seedProduction;
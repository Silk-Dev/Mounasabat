import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Demo seed script that creates realistic sample data for development and testing.
 * This script should NOT be run in production environments.
 * 
 * Creates:
 * - Sample users (customers and providers)
 * - Sample providers with complete profiles
 * - Diverse service offerings
 * - Sample bookings and orders
 * - Reviews and ratings
 * - Conversations and messages
 */
async function seedDemo() {
  console.log("🎭 Starting demo database seeding...");

  if (process.env.NODE_ENV === "production") {
    console.warn("⚠️  Demo seeding is not allowed in production environment");
    return;
  }

  try {
    // Create sample customers
    console.log("👥 Creating sample customers...");
    const customers = [
      {
        id: "customer-ahmed",
        name: "Ahmed Ben Ali",
        email: "ahmed.benali@example.com",
        emailVerified: true,
        language: "fr",
        phoneNumber: "+216 20 123 456",
        address: "Avenue Habib Bourguiba, Tunis 1000, Tunisia",
        preferences: {
          notifications: { email: true, sms: false, push: true },
          theme: "light",
          language: "fr"
        },
        createdAt: new Date("2024-01-15T10:00:00Z"),
        updatedAt: new Date("2024-01-15T10:00:00Z"),
      },
      {
        id: "customer-leila",
        name: "Leila Trabelsi",
        email: "leila.trabelsi@example.com",
        emailVerified: true,
        language: "ar",
        phoneNumber: "+216 25 789 012",
        address: "Rue de la République, Sfax 3000, Tunisia",
        preferences: {
          notifications: { email: true, sms: true, push: true },
          theme: "light",
          language: "ar"
        },
        createdAt: new Date("2024-02-20T14:30:00Z"),
        updatedAt: new Date("2024-02-20T14:30:00Z"),
      },
      {
        id: "customer-mohamed",
        name: "Mohamed Khelifi",
        email: "mohamed.khelifi@example.com",
        emailVerified: true,
        language: "fr",
        phoneNumber: "+216 22 345 678",
        address: "Boulevard 14 Janvier, Sousse 4000, Tunisia",
        preferences: {
          notifications: { email: true, sms: false, push: false },
          theme: "dark",
          language: "fr"
        },
        createdAt: new Date("2024-03-10T09:15:00Z"),
        updatedAt: new Date("2024-03-10T09:15:00Z"),
      },
    ];

    for (const customer of customers) {
      await prisma.user.upsert({
        where: { id: customer.id },
        update: {},
        create: customer,
      });
    }

    console.log(`✅ Created ${customers.length} sample customers`);

    // Create sample provider users
    console.log("🏢 Creating sample provider users...");
    const providerUsers = [
      {
        id: "provider-user-fatima",
        name: "Fatima Mansouri",
        email: "fatima.mansouri@example.com",
        emailVerified: true,
        language: "fr",
        phoneNumber: "+216 26 456 789",
        address: "Rue Mongi Slim, Tunis 1002, Tunisia",
        createdAt: new Date("2023-06-15T08:00:00Z"),
        updatedAt: new Date("2023-06-15T08:00:00Z"),
      },
      {
        id: "provider-user-karim",
        name: "Karim Bouazizi",
        email: "karim.bouazizi@example.com",
        emailVerified: true,
        language: "fr",
        phoneNumber: "+216 27 567 890",
        address: "Avenue de la Liberté, Sfax 3027, Tunisia",
        createdAt: new Date("2023-08-20T11:30:00Z"),
        updatedAt: new Date("2023-08-20T11:30:00Z"),
      },
      {
        id: "provider-user-amina",
        name: "Amina Gharbi",
        email: "amina.gharbi@example.com",
        emailVerified: true,
        language: "ar",
        phoneNumber: "+216 28 678 901",
        address: "Rue Ibn Khaldoun, Sousse 4051, Tunisia",
        createdAt: new Date("2023-09-10T16:45:00Z"),
        updatedAt: new Date("2023-09-10T16:45:00Z"),
      },
    ];

    for (const providerUser of providerUsers) {
      await prisma.user.upsert({
        where: { id: providerUser.id },
        update: {},
        create: providerUser,
      });
    }

    console.log(`✅ Created ${providerUsers.length} provider users`);

    // Create sample providers
    console.log("🎯 Creating sample providers...");
    const providers = [
      {
        id: "provider-fatima-photo",
        userId: "provider-user-fatima",
        name: "Fatima's Wedding Photography",
        description: "Professional wedding and event photography services across Tunisia. Specializing in traditional and modern wedding styles with over 8 years of experience.",
        contactEmail: "fatima.mansouri@example.com",
        phoneNumber: "+216 26 456 789",
        address: "Rue Mongi Slim, Tunis 1002, Tunisia",
        website: "https://fatimaphoto.tn",
        businessLicense: "BL-TN-2023-001",
        taxId: "TN-1234567890",
        isVerified: true,
        rating: 4.8,
        reviewCount: 32,
        location: { lat: 36.8065, lng: 10.1815 },
        coverageAreas: ["Tunis", "Ariana", "Ben Arous", "Manouba"],
        services: ["Wedding Photography", "Event Photography", "Portrait Photography", "Commercial Photography"],
      },
      {
        id: "provider-karim-catering",
        userId: "provider-user-karim",
        name: "Karim's Gourmet Catering",
        description: "Premium catering services featuring authentic Tunisian cuisine and international dishes. Perfect for weddings, corporate events, and private celebrations.",
        contactEmail: "karim.bouazizi@example.com",
        phoneNumber: "+216 27 567 890",
        address: "Avenue de la Liberté, Sfax 3027, Tunisia",
        website: "https://karimcatering.tn",
        businessLicense: "BL-TN-2023-002",
        taxId: "TN-2345678901",
        isVerified: true,
        rating: 4.6,
        reviewCount: 28,
        location: { lat: 34.7406, lng: 10.7603 },
        coverageAreas: ["Sfax", "Mahdia", "Kairouan", "Monastir"],
        services: ["Wedding Catering", "Corporate Catering", "Private Event Catering", "Traditional Cuisine"],
      },
      {
        id: "provider-amina-decoration",
        userId: "provider-user-amina",
        name: "Amina's Event Decoration",
        description: "Creative event decoration and floral arrangements. Transforming venues into magical spaces for weddings, birthdays, and special occasions.",
        contactEmail: "amina.gharbi@example.com",
        phoneNumber: "+216 28 678 901",
        address: "Rue Ibn Khaldoun, Sousse 4051, Tunisia",
        businessLicense: "BL-TN-2023-003",
        isVerified: true,
        rating: 4.9,
        reviewCount: 19,
        location: { lat: 35.8256, lng: 10.6369 },
        coverageAreas: ["Sousse", "Monastir", "Mahdia", "Kairouan"],
        services: ["Wedding Decoration", "Event Decoration", "Floral Arrangements", "Venue Styling"],
      },
    ];

    for (const provider of providers) {
      await prisma.provider.upsert({
        where: { id: provider.id },
        update: {},
        create: provider,
      });
    }

    console.log(`✅ Created ${providers.length} sample providers`);

    // Create sample services
    console.log("🎪 Creating sample services...");
    const services = [
      // Fatima's Photography Services
      {
        id: "service-wedding-photo-premium",
        providerId: "provider-fatima-photo",
        name: "Premium Wedding Photography Package",
        description: "Complete wedding photography coverage including pre-wedding session, ceremony, reception, and 200+ edited photos delivered digitally.",
        category: "Photography",
        images: [
          "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800",
          "https://images.unsplash.com/photo-1519741497674-611481863552?w=800"
        ],
        pricingType: "FIXED",
        basePrice: 1500.0,
        priceUnit: "per_event",
        location: "Tunis, Tunisia",
        coverageArea: ["Tunis", "Ariana", "Ben Arous"],
        isActive: true,
      },
      {
        id: "service-event-photo-basic",
        providerId: "provider-fatima-photo",
        name: "Event Photography - Basic Package",
        description: "Professional photography for corporate events, birthdays, and celebrations. 4-hour coverage with 50+ edited photos.",
        category: "Photography",
        images: [
          "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800"
        ],
        pricingType: "FIXED",
        basePrice: 600.0,
        priceUnit: "per_event",
        location: "Tunis, Tunisia",
        coverageArea: ["Tunis", "Ariana"],
        isActive: true,
      },
      // Karim's Catering Services
      {
        id: "service-wedding-catering-deluxe",
        providerId: "provider-karim-catering",
        name: "Deluxe Wedding Catering",
        description: "Premium wedding catering featuring traditional Tunisian dishes, international cuisine, and professional service staff. Includes appetizers, main course, desserts, and beverages.",
        category: "Catering",
        images: [
          "https://images.unsplash.com/photo-1555244162-803834f70033?w=800",
          "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800"
        ],
        pricingType: "FIXED",
        basePrice: 55.0,
        priceUnit: "per_person",
        location: "Sfax, Tunisia",
        coverageArea: ["Sfax", "Mahdia", "Monastir"],
        isActive: true,
      },
      {
        id: "service-corporate-catering",
        providerId: "provider-karim-catering",
        name: "Corporate Event Catering",
        description: "Professional catering for business meetings, conferences, and corporate events. Flexible menu options and professional presentation.",
        category: "Catering",
        images: [
          "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800"
        ],
        pricingType: "QUOTE",
        location: "Sfax, Tunisia",
        coverageArea: ["Sfax", "Kairouan"],
        isActive: true,
      },
      // Amina's Decoration Services
      {
        id: "service-wedding-decoration-romantic",
        providerId: "provider-amina-decoration",
        name: "Romantic Wedding Decoration",
        description: "Elegant and romantic wedding decoration with fresh flowers, candles, and beautiful centerpieces. Complete venue transformation included.",
        category: "Decoration",
        images: [
          "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800",
          "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800"
        ],
        pricingType: "FIXED",
        basePrice: 2200.0,
        priceUnit: "per_venue",
        location: "Sousse, Tunisia",
        coverageArea: ["Sousse", "Monastir", "Mahdia"],
        isActive: true,
      },
      {
        id: "service-birthday-decoration",
        providerId: "provider-amina-decoration",
        name: "Birthday Party Decoration",
        description: "Fun and colorful birthday party decorations with themed setups, balloons, and party accessories.",
        category: "Decoration",
        images: [
          "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800"
        ],
        pricingType: "FIXED",
        basePrice: 350.0,
        priceUnit: "per_event",
        location: "Sousse, Tunisia",
        coverageArea: ["Sousse", "Monastir"],
        isActive: true,
      },
    ];

    for (const service of services) {
      await prisma.service.upsert({
        where: { id: service.id },
        update: {},
        create: {
          id: service.id,
          providerId: service.providerId,
          name: service.name,
          description: service.description,
          category: service.category,
          images: service.images,
          pricingType: service.pricingType as any,
          basePrice: service.basePrice,
          priceUnit: service.priceUnit,
          location: service.location,
          coverageArea: service.coverageArea,
          isActive: service.isActive,
        },
      });
    }

    console.log(`✅ Created ${services.length} sample services`);

    // Create sample events
    console.log("🎉 Creating sample events...");
    const events = [
      {
        id: "event-ahmed-leila-wedding",
        name: "Ahmed & Leila's Wedding",
        description: "Traditional Tunisian wedding celebration with family and friends",
        type: "Wedding",
        status: "ACTIVE" as const,
        startDate: new Date("2025-09-15T16:00:00Z"),
        endDate: new Date("2025-09-15T23:00:00Z"),
        templateId: "template-wedding",
      },
      {
        id: "event-tech-conference-2025",
        name: "Tunisia Tech Conference 2025",
        description: "Annual technology conference bringing together industry leaders",
        type: "Corporate",
        status: "DRAFT" as const,
        startDate: new Date("2025-11-20T09:00:00Z"),
        endDate: new Date("2025-11-20T17:00:00Z"),
        templateId: "template-corporate",
      },
      {
        id: "event-mohamed-birthday",
        name: "Mohamed's 30th Birthday",
        description: "Milestone birthday celebration with friends and family",
        type: "Birthday",
        status: "ACTIVE" as const,
        startDate: new Date("2025-08-25T19:00:00Z"),
        endDate: new Date("2025-08-25T23:00:00Z"),
        templateId: "template-birthday",
      },
    ];

    for (const event of events) {
      await prisma.event.upsert({
        where: { id: event.id },
        update: {},
        create: event,
      });
    }

    console.log(`✅ Created ${events.length} sample events`);

    // Create sample bookings
    console.log("📅 Creating sample bookings...");
    const bookings = [
      {
        id: "booking-ahmed-photography",
        eventId: "event-ahmed-leila-wedding",
        userId: "customer-ahmed",
        providerId: "provider-fatima-photo",
        serviceId: "service-wedding-photo-premium",
        startTime: new Date("2025-09-15T14:00:00Z"),
        endTime: new Date("2025-09-15T23:00:00Z"),
        status: "CONFIRMED" as const,
        paymentStatus: "PAID" as const,
        totalAmount: 1500.0,
        customerInfo: {
          guestCount: 120,
          specialRequests: "Please focus on traditional ceremony moments"
        },
        specialRequests: "Include family group photos during cocktail hour",
      },
      {
        id: "booking-ahmed-catering",
        eventId: "event-ahmed-leila-wedding",
        userId: "customer-ahmed",
        providerId: "provider-karim-catering",
        serviceId: "service-wedding-catering-deluxe",
        startTime: new Date("2025-09-15T18:00:00Z"),
        endTime: new Date("2025-09-15T22:00:00Z"),
        status: "CONFIRMED" as const,
        paymentStatus: "UNPAID" as const,
        totalAmount: 6600.0, // 120 guests * 55 TND per person
        customerInfo: {
          guestCount: 120,
          dietaryRestrictions: ["vegetarian options needed", "no pork"],
          specialRequests: "Traditional Tunisian menu preferred"
        },
      },
      {
        id: "booking-mohamed-decoration",
        eventId: "event-mohamed-birthday",
        userId: "customer-mohamed",
        providerId: "provider-amina-decoration",
        serviceId: "service-birthday-decoration",
        startTime: new Date("2025-08-25T17:00:00Z"),
        endTime: new Date("2025-08-25T19:00:00Z"),
        status: "PENDING" as const,
        paymentStatus: "UNPAID" as const,
        totalAmount: 350.0,
        customerInfo: {
          guestCount: 25,
          theme: "Modern minimalist with blue and gold colors"
        },
      },
    ];

    for (const booking of bookings) {
      await prisma.booking.upsert({
        where: { id: booking.id },
        update: {},
        create: booking,
      });
    }

    console.log(`✅ Created ${bookings.length} sample bookings`);

    // Create sample reviews
    console.log("⭐ Creating sample reviews...");
    const reviews = [
      {
        userId: "customer-ahmed",
        providerId: "provider-fatima-photo",
        serviceId: "service-wedding-photo-premium",
        rating: 5,
        comment: "Fatima exceeded our expectations! The photos are absolutely stunning and she captured every precious moment of our wedding day. Her professionalism and artistic eye are remarkable. Highly recommended!",
        isVerified: true,
        createdAt: new Date("2024-09-20T10:30:00Z"),
      },
      {
        userId: "customer-leila",
        providerId: "provider-karim-catering",
        serviceId: "service-wedding-catering-deluxe",
        rating: 4,
        comment: "The food was delicious and the presentation was beautiful. Karim's team was professional and the traditional dishes were authentic. Only minor issue was timing, but overall excellent service.",
        isVerified: true,
        createdAt: new Date("2024-10-05T14:15:00Z"),
      },
      {
        userId: "customer-mohamed",
        providerId: "provider-amina-decoration",
        serviceId: "service-wedding-decoration-romantic",
        rating: 5,
        comment: "Amina transformed our venue into a fairy tale! The attention to detail was incredible and the floral arrangements were breathtaking. She understood our vision perfectly.",
        isVerified: true,
        createdAt: new Date("2024-07-12T16:45:00Z"),
      },
      {
        userId: "customer-ahmed",
        providerId: "provider-amina-decoration",
        serviceId: "service-birthday-decoration",
        rating: 4,
        comment: "Great decoration service for my daughter's birthday. Creative setup and good quality materials. The kids loved the themed decorations!",
        isVerified: true,
        createdAt: new Date("2024-06-18T11:20:00Z"),
      },
    ];

    for (const review of reviews) {
      await prisma.review.create({
        data: {
          id: `review-${review.userId}-${review.providerId}-${Date.now()}`,
          ...review,
        },
      });
    }

    console.log(`✅ Created ${reviews.length} sample reviews`);

    // Create sample conversations
    console.log("💬 Creating sample conversations...");
    const conversations = [
      {
        id: "conv-ahmed-fatima",
        userId: "customer-ahmed",
        providerId: "provider-fatima-photo",
        serviceId: "service-wedding-photo-premium",
        status: "ACTIVE" as const,
        createdAt: new Date("2025-07-15T09:30:00Z"),
      },
      {
        id: "conv-mohamed-amina",
        userId: "customer-mohamed",
        providerId: "provider-amina-decoration",
        serviceId: "service-birthday-decoration",
        status: "ACTIVE" as const,
        createdAt: new Date("2025-08-10T14:20:00Z"),
      },
    ];

    for (const conversation of conversations) {
      await prisma.conversation.upsert({
        where: { id: conversation.id },
        update: {},
        create: conversation,
      });
    }

    // Create sample messages
    const messages = [
      {
        conversationId: "conv-ahmed-fatima",
        senderId: "customer-ahmed",
        content: "Hello Fatima, I'm interested in your premium wedding photography package for my wedding in September. Could you tell me more about what's included?",
        messageType: "TEXT" as const,
        createdAt: new Date("2025-07-15T09:35:00Z"),
      },
      {
        conversationId: "conv-ahmed-fatima",
        senderId: "provider-user-fatima",
        content: "Hello Ahmed! Congratulations on your upcoming wedding! The premium package includes 8 hours of coverage, pre-wedding session, ceremony and reception photography, plus 200+ professionally edited photos delivered digitally. Would you like to schedule a consultation?",
        messageType: "TEXT" as const,
        createdAt: new Date("2025-07-15T10:15:00Z"),
      },
      {
        conversationId: "conv-mohamed-amina",
        senderId: "customer-mohamed",
        content: "Hi Amina, I'm planning a 30th birthday party and would love to discuss decoration options. The theme is modern minimalist with blue and gold colors.",
        messageType: "TEXT" as const,
        createdAt: new Date("2025-08-10T14:25:00Z"),
      },
      {
        conversationId: "conv-mohamed-amina",
        senderId: "provider-user-amina",
        content: "Hello Mohamed! I'd love to help create a beautiful setup for your birthday celebration. Blue and gold is a stunning combination! Let me prepare some ideas and send you a quote. How many guests are you expecting?",
        messageType: "TEXT" as const,
        createdAt: new Date("2025-08-10T15:10:00Z"),
      },
    ];

    for (const message of messages) {
      await prisma.message.create({
        data: {
          id: `msg-${message.conversationId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ...message,
        },
      });
    }

    console.log(`✅ Created ${conversations.length} conversations with ${messages.length} messages`);

    // Create sample favorites
    console.log("❤️ Creating sample favorites...");
    const favorites = [
      {
        userId: "customer-ahmed",
        providerId: "provider-fatima-photo",
      },
      {
        userId: "customer-leila",
        providerId: "provider-karim-catering",
      },
      {
        userId: "customer-mohamed",
        providerId: "provider-amina-decoration",
      },
      {
        userId: "customer-ahmed",
        productId: "product-invitation-basic",
      },
    ];

    for (const favorite of favorites) {
      await prisma.favorite.create({
        data: {
          id: `fav-${favorite.userId}-${favorite.providerId || favorite.productId}-${Date.now()}`,
          ...favorite,
        },
      });
    }

    console.log(`✅ Created ${favorites.length} sample favorites`);

    // Create sample notifications
    console.log("🔔 Creating sample notifications...");
    const notifications = [
      {
        userId: "customer-ahmed",
        type: "EMAIL" as const,
        title: "Booking Confirmed",
        message: "Your wedding photography booking has been confirmed for September 15, 2025!",
        isRead: false,
        data: {
          bookingId: "booking-ahmed-photography",
          eventDate: "2025-09-15",
          providerName: "Fatima's Wedding Photography"
        },
        createdAt: new Date("2025-07-20T11:30:00Z"),
      },
      {
        userId: "provider-user-fatima",
        type: "IN_APP" as const,
        title: "New Booking Request",
        message: "You have received a new booking request for wedding photography.",
        isRead: true,
        data: {
          bookingId: "booking-ahmed-photography",
          customerName: "Ahmed Ben Ali"
        },
        createdAt: new Date("2025-07-18T16:45:00Z"),
      },
      {
        userId: "customer-mohamed",
        type: "PUSH" as const,
        title: "Quote Received",
        message: "Amina's Event Decoration has sent you a quote for birthday decoration.",
        isRead: false,
        data: {
          conversationId: "conv-mohamed-amina",
          providerName: "Amina's Event Decoration"
        },
        createdAt: new Date("2025-08-12T09:20:00Z"),
      },
    ];

    for (const notification of notifications) {
      await prisma.notification.create({
        data: {
          id: `notif-${notification.userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ...notification,
        },
      });
    }

    console.log(`✅ Created ${notifications.length} sample notifications`);

    console.log("✅ Demo database seeding completed successfully!");

    // Summary
    const summary = {
      users: await prisma.user.count(),
      providers: await prisma.provider.count(),
      services: await prisma.service.count(),
      events: await prisma.event.count(),
      bookings: await prisma.booking.count(),
      reviews: await prisma.review.count(),
      conversations: await prisma.conversation.count(),
      messages: await prisma.message.count(),
      favorites: await prisma.favorite.count(),
      notifications: await prisma.notification.count(),
    };

    console.log(`
📊 Demo seed summary:
- Users: ${summary.users}
- Providers: ${summary.providers}
- Services: ${summary.services}
- Events: ${summary.events}
- Bookings: ${summary.bookings}
- Reviews: ${summary.reviews}
- Conversations: ${summary.conversations}
- Messages: ${summary.messages}
- Favorites: ${summary.favorites}
- Notifications: ${summary.notifications}
    `);

  } catch (error) {
    console.error("❌ Error during demo seeding:", error);
    throw error;
  }
}

export default seedDemo;

// Run the seed function if called directly
if (require.main === module) {
  seedDemo()
    .catch((e) => {
      console.error("❌ Demo seeding failed:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
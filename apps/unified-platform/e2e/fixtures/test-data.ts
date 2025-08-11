export const testUsers = {
  customer: {
    email: 'customer@test.com',
    password: 'TestPassword123!',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890',
  },
  provider: {
    email: 'provider@test.com',
    password: 'TestPassword123!',
    businessName: 'Test Photography',
    firstName: 'Jane',
    lastName: 'Smith',
    phone: '+1234567891',
  },
  admin: {
    email: 'admin@test.com',
    password: 'AdminPassword123!',
    firstName: 'Admin',
    lastName: 'User',
  },
};

export const testServices = {
  photography: {
    name: 'Wedding Photography Package',
    description: 'Professional wedding photography with 8 hours coverage',
    category: 'Photography',
    basePrice: 1500,
    priceUnit: 'per_event',
    features: ['8 hours coverage', 'Digital gallery', 'Print release'],
  },
  venue: {
    name: 'Grand Ballroom',
    description: 'Elegant ballroom for weddings and events',
    category: 'Venues',
    basePrice: 2500,
    priceUnit: 'per_day',
    features: ['Capacity for 200 guests', 'Built-in sound system', 'Catering kitchen'],
  },
  catering: {
    name: 'Premium Catering Service',
    description: 'Full-service catering with custom menus',
    category: 'Catering',
    basePrice: 75,
    priceUnit: 'per_person',
    features: ['Custom menu design', 'Professional service staff', 'Setup and cleanup'],
  },
};

export const testBooking = {
  eventType: 'Wedding',
  date: '2024-12-15',
  startTime: '14:00',
  endTime: '22:00',
  guestCount: 100,
  location: 'Grand Hotel Ballroom',
  specialRequests: 'Outdoor ceremony weather backup needed',
};

export const testPayment = {
  cardNumber: '4242424242424242',
  expiryDate: '12/25',
  cvc: '123',
  cardholderName: 'John Doe',
  billingAddress: {
    line1: '123 Test Street',
    city: 'Test City',
    state: 'TS',
    postalCode: '12345',
    country: 'US',
  },
};

export const searchQueries = {
  wedding: 'wedding photography',
  venue: 'wedding venue',
  catering: 'catering service',
  location: 'New York',
  priceRange: [500, 2000],
};
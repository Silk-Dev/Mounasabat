// Form validation utilities using Zod
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Security-focused validation helpers
const sanitizeString = (str: string) => {
  // Remove potentially dangerous characters and HTML
  return DOMPurify.sanitize(str, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();
};

const secureStringSchema = (minLength: number = 1, maxLength: number = 100) =>
  z.string()
    .min(minLength)
    .max(maxLength)
    .regex(/^[a-zA-Z0-9\s\-_.,!?()]+$/, 'Contains invalid characters')
    .transform(sanitizeString);

const secureTextSchema = (minLength: number = 1, maxLength: number = 1000) =>
  z.string()
    .min(minLength)
    .max(maxLength)
    .regex(/^[a-zA-Z0-9\s\-_.,!?()\n\r]+$/, 'Contains invalid characters')
    .transform(sanitizeString);

// Search validation schemas
export const searchFiltersSchema = z.object({
  query: secureStringSchema(1, 100).optional(),
  location: secureStringSchema(2, 100).optional(),
  category: z.string().regex(/^[a-zA-Z0-9\-_]+$/).optional(),
  priceRange: z.tuple([z.number().min(0), z.number().max(100000)]).optional(),
  rating: z.number().min(1).max(5).optional(),
  availability: z.object({
    startDate: z.date().min(new Date()),
    endDate: z.date().min(new Date()),
  }).refine(data => data.endDate >= data.startDate, {
    message: "End date must be after start date"
  }).optional(),
  serviceType: z.array(z.string().regex(/^[a-zA-Z0-9\-_]+$/)).max(10).optional(),
});

// Booking validation schemas
export const bookingSchema = z.object({
  serviceId: z.string().uuid('Invalid service ID format'),
  providerId: z.string().uuid('Invalid provider ID format'),
  eventDate: z.date().min(new Date(), 'Event date must be in the future').max(
    new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000), 
    'Event date cannot be more than 2 years in the future'
  ),
  eventDetails: z.object({
    type: secureStringSchema(1, 50),
    guestCount: z.number().int().min(1).max(10000).optional(),
    location: secureStringSchema(5, 200).optional(),
    specialRequests: secureTextSchema(0, 1000).optional(),
  }),
  customerInfo: z.object({
    name: secureStringSchema(2, 100),
    email: z.string().email('Invalid email format').max(255),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional(),
  }),
});

// Provider validation schemas
export const providerProfileSchema = z.object({
  businessName: secureStringSchema(2, 100),
  description: secureTextSchema(10, 2000),
  location: z.object({
    address: secureStringSchema(5, 200),
    city: secureStringSchema(2, 50),
    region: secureStringSchema(2, 50).optional(),
    postalCode: z.string().regex(/^[A-Z0-9\s\-]{3,10}$/i, 'Invalid postal code').optional(),
    coordinates: z.tuple([
      z.number().min(-180).max(180), 
      z.number().min(-90).max(90)
    ]),
  }),
  contact: z.object({
    email: z.string().email().max(255),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
    website: z.string().url().max(255).optional(),
  }),
});

// Service validation schemas
export const serviceSchema = z.object({
  name: secureStringSchema(2, 100),
  description: secureTextSchema(10, 1000),
  category: z.string().regex(/^[a-zA-Z0-9\-_]+$/, 'Invalid category format'),
  subcategory: z.string().regex(/^[a-zA-Z0-9\-_]+$/, 'Invalid subcategory format').optional(),
  basePrice: z.number().positive().max(100000),
  priceUnit: z.enum(['hour', 'day', 'event', 'person', 'item']),
  features: z.array(secureStringSchema(1, 50)).max(20).optional(),
  images: z.array(z.string().url()).max(10).optional(),
  availability: z.object({
    daysOfWeek: z.array(z.number().min(0).max(6)).max(7),
    timeSlots: z.array(z.object({
      start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    })).max(10),
  }).optional(),
});

// User validation schemas
export const userRegistrationSchema = z.object({
  email: z.string().email('Invalid email format').max(255).toLowerCase(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain uppercase, lowercase, number and special character'),
  name: secureStringSchema(2, 50),
  role: z.enum(['customer', 'provider']),
});

export const userLoginSchema = z.object({
  email: z.string().email('Invalid email format').max(255).toLowerCase(),
  password: z.string().min(1, 'Password is required').max(100),
});

export const passwordResetSchema = z.object({
  email: z.string().email('Invalid email format').max(255).toLowerCase(),
});

export const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain uppercase, lowercase, number and special character'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Admin validation schemas
export const adminActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'suspend', 'activate', 'delete', 'update']),
  targetId: z.string().uuid('Invalid target ID'),
  targetType: z.enum(['user', 'provider', 'service', 'booking', 'review']),
  reason: secureTextSchema(5, 500).optional(),
  metadata: z.record(z.any()).optional(),
});

// Review validation schemas
export const reviewSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID'),
  rating: z.number().int().min(1).max(5),
  title: secureStringSchema(5, 100).optional(),
  comment: secureTextSchema(10, 1000),
  images: z.array(z.string().url()).max(5).optional(),
});

// Payment validation schemas
export const paymentIntentSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID'),
  amount: z.number().positive().max(1000000), // Max $10,000
  currency: z.enum(['usd', 'eur', 'gbp']).default('usd'),
  paymentMethodId: z.string().min(1).optional(),
});

export type SearchFiltersInput = z.infer<typeof searchFiltersSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
export type ProviderProfileInput = z.infer<typeof providerProfileSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
export type UserRegistrationInput = z.infer<typeof userRegistrationSchema>;

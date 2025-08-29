import { z } from 'zod';
import { createSafeStringSchema, createSafeTextSchema, CommonSchemas, SecurityValidator } from './input-validation';

/**
 * Enhanced validation schemas for all API endpoints
 */

// Base schemas with security validation
const secureString = (min = 1, max = 100) => 
  createSafeStringSchema(min, max).refine(
    val => SecurityValidator.validateInput(val, 'general'),
    { message: 'Contains potentially dangerous characters' }
  );

const secureText = (min = 1, max = 1000) => 
  createSafeTextSchema(min, max).refine(
    val => SecurityValidator.validateInput(val, 'general'),
    { message: 'Contains potentially dangerous characters' }
  );

const secureEmail = z.string()
  .email('Invalid email format')
  .max(255)
  .toLowerCase()
  .refine(SecurityValidator.validateEmail, { message: 'Invalid or unsafe email format' });

const secureUrl = z.string()
  .url('Invalid URL format')
  .max(2048)
  .refine(SecurityValidator.validateUrl, { message: 'Invalid or unsafe URL' });

const secureUuid = z.string()
  .uuid('Invalid UUID format')
  .refine(SecurityValidator.validateUuid, { message: 'Invalid UUID format' });

const securePhoneNumber = z.string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
  .refine(SecurityValidator.validatePhoneNumber, { message: 'Invalid phone number' });

// User authentication schemas
export const userRegistrationSchema = z.object({
  email: secureEmail,
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number and special character'
    ),
  name: secureString(2, 50),
  role: z.enum(['customer', 'provider']),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'Must accept terms and conditions'
  }),
}).strict();

export const userLoginSchema = z.object({
  email: secureEmail,
  password: z.string().min(1, 'Password is required').max(100),
  rememberMe: z.boolean().optional(),
}).strict();

export const passwordResetSchema = z.object({
  email: secureEmail,
}).strict();

export const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required').max(100),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number and special character'
    ),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).strict();

// Profile schemas
export const userProfileUpdateSchema = z.object({
  name: secureString(2, 50),
  email: secureEmail,
  phone: securePhoneNumber.optional(),
  bio: secureText(0, 500).optional(),
  avatar: secureUrl.optional(),
  preferences: z.object({
    notifications: z.object({
      email: z.boolean().default(true),
      sms: z.boolean().default(false),
      push: z.boolean().default(true),
    }).optional(),
    privacy: z.object({
      profileVisible: z.boolean().default(true),
      showEmail: z.boolean().default(false),
      showPhone: z.boolean().default(false),
    }).optional(),
  }).optional(),
}).strict();

export const providerProfileSchema = z.object({
  businessName: secureString(2, 100),
  description: secureText(10, 2000),
  website: secureUrl.optional(),
  phone: securePhoneNumber,
  email: secureEmail,
  address: z.object({
    street: secureString(5, 200),
    city: secureString(2, 50),
    state: secureString(2, 50),
    postalCode: z.string().regex(/^[A-Z0-9\s\-]{3,10}$/i, 'Invalid postal code'),
    country: secureString(2, 50),
    coordinates: z.tuple([
      z.number().min(-180).max(180),
      z.number().min(-90).max(90)
    ]).optional(),
  }),
  coverageAreas: z.array(secureString(2, 50)).max(20),
  businessHours: z.object({
    monday: z.object({ open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/) }).optional(),
    tuesday: z.object({ open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/) }).optional(),
    wednesday: z.object({ open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/) }).optional(),
    thursday: z.object({ open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/) }).optional(),
    friday: z.object({ open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/) }).optional(),
    saturday: z.object({ open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/) }).optional(),
    sunday: z.object({ open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/) }).optional(),
  }).optional(),
  socialMedia: z.object({
    facebook: secureUrl.optional(),
    instagram: secureUrl.optional(),
    twitter: secureUrl.optional(),
    linkedin: secureUrl.optional(),
  }).optional(),
}).strict();

// Service schemas
export const serviceCreateSchema = z.object({
  name: secureString(2, 100),
  description: secureText(10, 1000),
  category: z.string().regex(/^[a-zA-Z0-9\-_]+$/, 'Invalid category format').max(50),
  subcategory: z.string().regex(/^[a-zA-Z0-9\-_]+$/, 'Invalid subcategory format').max(50).optional(),
  basePrice: z.number().positive().max(100000),
  priceUnit: z.enum(['hour', 'day', 'event', 'person', 'item']),
  pricingType: z.enum(['fixed', 'tiered', 'dynamic', 'hybrid']).default('fixed'),
  features: z.array(secureString(1, 50)).max(20).optional(),
  images: z.array(secureUrl).max(10).optional(),
  tags: z.array(secureString(1, 30)).max(15).optional(),
  availability: z.object({
    daysOfWeek: z.array(z.number().min(0).max(6)).max(7),
    timeSlots: z.array(z.object({
      start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    })).max(10),
    blackoutDates: z.array(z.string().datetime()).max(100).optional(),
  }).optional(),
  requirements: z.object({
    minimumNotice: z.number().int().min(0).max(365).optional(), // days
    maximumAdvanceBooking: z.number().int().min(1).max(730).optional(), // days
    cancellationPolicy: secureText(0, 500).optional(),
  }).optional(),
}).strict();

export const serviceUpdateSchema = serviceCreateSchema.partial().strict();

// Booking schemas
export const bookingCreateSchema = z.object({
  serviceId: secureUuid,
  providerId: secureUuid,
  eventDate: z.string().datetime().refine(dateStr => {
    const date = new Date(dateStr);
    const now = new Date();
    return date > now;
  }, { message: 'Event date must be in the future' }),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  guestCount: z.number().int().min(1).max(10000).optional(),
  eventDetails: z.object({
    type: secureString(1, 50),
    location: secureString(5, 200).optional(),
    specialRequests: secureText(0, 1000).optional(),
    budget: z.number().positive().max(1000000).optional(),
  }),
  customerInfo: z.object({
    firstName: secureString(1, 50),
    lastName: secureString(1, 50),
    email: secureEmail,
    phone: securePhoneNumber,
    address: z.object({
      street: secureString(5, 200),
      city: secureString(2, 50),
      state: secureString(2, 50),
      postalCode: z.string().regex(/^[A-Z0-9\s\-]{3,10}$/i, 'Invalid postal code'),
      country: secureString(2, 50),
    }).optional(),
  }),
}).refine(data => {
  // Validate that start time is before end time
  const [startHours, startMinutes] = data.startTime.split(':').map(Number);
  const [endHours, endMinutes] = data.endTime.split(':').map(Number);
  const startMinutesTotal = startHours * 60 + startMinutes;
  const endMinutesTotal = endHours * 60 + endMinutes;
  return startMinutesTotal < endMinutesTotal;
}, {
  message: 'Start time must be before end time',
  path: ['startTime']
}).strict();

export const bookingUpdateSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
  eventDate: z.string().datetime().optional(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  specialRequests: secureText(0, 1000).optional(),
  cancellationReason: secureText(5, 500).optional(),
}).strict();

// Review schemas
export const reviewCreateSchema = z.object({
  bookingId: secureUuid,
  rating: z.number().int().min(1).max(5),
  title: secureString(5, 100).optional(),
  comment: secureText(10, 1000),
  images: z.array(secureUrl).max(5).optional(),
  wouldRecommend: z.boolean().optional(),
}).strict();

export const reviewUpdateSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: secureString(5, 100).optional(),
  comment: secureText(10, 1000).optional(),
  images: z.array(secureUrl).max(5).optional(),
  wouldRecommend: z.boolean().optional(),
}).strict();

// Search schemas
export const searchQuerySchema = z.object({
  q: secureString(1, 200).optional(),
  location: secureString(2, 100).optional(),
  category: z.string().regex(/^[a-zA-Z0-9\-_]+$/).max(50).optional(),
  subcategory: z.string().regex(/^[a-zA-Z0-9\-_]+$/).max(50).optional(),
  minPrice: z.string().transform(val => {
    const price = parseFloat(val);
    return isNaN(price) ? undefined : Math.max(0, price);
  }).optional(),
  maxPrice: z.string().transform(val => {
    const price = parseFloat(val);
    return isNaN(price) ? undefined : Math.max(0, price);
  }).optional(),
  rating: z.string().transform(val => {
    const rating = parseFloat(val);
    return isNaN(rating) ? undefined : Math.max(0, Math.min(5, rating));
  }).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  serviceTypes: z.string().transform(val => 
    val.split(',').map(type => type.trim()).filter(Boolean).slice(0, 10)
  ).optional(),
  verified: z.enum(['true', 'false', 'all']).optional(),
  sortBy: z.enum(['relevance', 'price', 'rating', 'distance', 'newest']).default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.string().transform(val => Math.max(1, parseInt(val) || 1)),
  limit: z.string().transform(val => Math.min(50, Math.max(1, parseInt(val) || 12))),
}).refine(data => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: 'Start date must be before or equal to end date',
}).strict();

// Payment schemas
export const paymentIntentSchema = z.object({
  bookingId: secureUuid,
  amount: z.number().positive().max(1000000), // Max $10,000
  currency: z.enum(['usd', 'eur', 'gbp']).default('usd'),
  paymentMethodId: z.string().min(1).max(255).optional(),
  savePaymentMethod: z.boolean().default(false),
}).strict();

export const paymentConfirmSchema = z.object({
  paymentIntentId: z.string().min(1).max(255),
  paymentMethodId: z.string().min(1).max(255).optional(),
}).strict();

// Admin schemas
export const adminActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'suspend', 'activate', 'delete', 'update', 'verify']),
  targetId: secureUuid,
  targetType: z.enum(['user', 'provider', 'service', 'booking', 'review', 'payment']),
  reason: secureText(5, 500).optional(),
  metadata: z.record(z.any()).optional(),
  notifyUser: z.boolean().default(true),
}).strict();

export const adminUserUpdateSchema = z.object({
  name: secureString(2, 50).optional(),
  email: secureEmail.optional(),
  role: z.enum(['customer', 'provider', 'admin']).optional(),
  isActive: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  permissions: z.array(z.string().regex(/^[a-zA-Z0-9_.-]+$/)).max(50).optional(),
}).strict();

// File upload schemas
export const fileUploadSchema = z.object({
  file: z.instanceof(File).refine(file => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    return allowedTypes.includes(file.type);
  }, { message: 'Invalid file type' }).refine(file => {
    return file.size <= 10 * 1024 * 1024; // 10MB
  }, { message: 'File too large' }),
  category: z.enum(['avatar', 'service_image', 'document', 'gallery']),
  description: secureString(0, 200).optional(),
}).strict();

// Notification schemas
export const notificationPreferencesSchema = z.object({
  email: z.object({
    bookingUpdates: z.boolean().default(true),
    promotions: z.boolean().default(false),
    reminders: z.boolean().default(true),
    reviews: z.boolean().default(true),
  }),
  sms: z.object({
    bookingUpdates: z.boolean().default(false),
    reminders: z.boolean().default(false),
    urgent: z.boolean().default(true),
  }),
  push: z.object({
    bookingUpdates: z.boolean().default(true),
    messages: z.boolean().default(true),
    promotions: z.boolean().default(false),
  }),
}).strict();

// Contact/Support schemas
export const contactFormSchema = z.object({
  name: secureString(2, 50),
  email: secureEmail,
  subject: secureString(5, 100),
  message: secureText(10, 2000),
  category: z.enum(['general', 'technical', 'billing', 'complaint', 'suggestion']),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
}).strict();

export const supportTicketSchema = z.object({
  subject: secureString(5, 100),
  description: secureText(10, 2000),
  category: z.enum(['account', 'booking', 'payment', 'technical', 'other']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  attachments: z.array(secureUrl).max(5).optional(),
}).strict();

// Export all schemas
export const ValidationSchemas = {
  // Authentication
  userRegistration: userRegistrationSchema,
  userLogin: userLoginSchema,
  passwordReset: passwordResetSchema,
  passwordUpdate: passwordUpdateSchema,

  // Profiles
  userProfileUpdate: userProfileUpdateSchema,
  providerProfile: providerProfileSchema,

  // Services
  serviceCreate: serviceCreateSchema,
  serviceUpdate: serviceUpdateSchema,

  // Bookings
  bookingCreate: bookingCreateSchema,
  bookingUpdate: bookingUpdateSchema,

  // Reviews
  reviewCreate: reviewCreateSchema,
  reviewUpdate: reviewUpdateSchema,

  // Search
  searchQuery: searchQuerySchema,

  // Payments
  paymentIntent: paymentIntentSchema,
  paymentConfirm: paymentConfirmSchema,

  // Admin
  adminAction: adminActionSchema,
  adminUserUpdate: adminUserUpdateSchema,

  // Files
  fileUpload: fileUploadSchema,

  // Notifications
  notificationPreferences: notificationPreferencesSchema,

  // Support
  contactForm: contactFormSchema,
  supportTicket: supportTicketSchema,

  // Common
  pagination: CommonSchemas.pagination,
  sorting: CommonSchemas.sorting,
  id: CommonSchemas.id,
  dateRange: CommonSchemas.dateRange,
};

export default ValidationSchemas;

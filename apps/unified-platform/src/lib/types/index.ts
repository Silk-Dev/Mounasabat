// Re-export all types from the main types file
export * from '../../../types';

// Additional types specific to the unified platform
export type User = {
  id: string;
  email: string;
  name?: string;
  role?: 'customer' | 'provider' | 'admin';
  createdAt: Date;
  updatedAt: Date;
};

export type Event = {
  id: string;
  name: string;
  date: Date;
  location: string;
  description?: string;
  status: 'draft' | 'published' | 'cancelled';
};

export type Pricing = {
  id: string;
  name: string;
  price: number;
  currency: string;
  type: 'fixed' | 'hourly' | 'package';
};

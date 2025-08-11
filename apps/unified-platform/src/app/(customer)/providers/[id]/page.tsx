import React from 'react';
import { notFound } from 'next/navigation';
import { ProviderProfile } from '@/components/provider';
import { Provider, Service, Package, Review } from '@/types';

// Mock data - in real app, this would come from database
const mockProvider: Provider = {
  id: 'provider-1',
  userId: 'user-1',
  businessName: 'Elegant Events Tunisia',
  description: 'We are a premier event planning company specializing in weddings, corporate events, and special celebrations. With over 10 years of experience, we bring your vision to life with attention to detail and exceptional service.',
  images: [
    '/api/placeholder/800/600',
    '/api/placeholder/800/600',
    '/api/placeholder/800/600',
    '/api/placeholder/800/600'
  ],
  rating: 4.8,
  reviewCount: 127,
  isVerified: true,
  location: {
    address: '123 Avenue Habib Bourguiba',
    city: 'Tunis',
    coordinates: [36.8065, 10.1815]
  },
  contactEmail: 'contact@elegantevents.tn',
  phoneNumber: '+216 71 123 456',
  website: 'https://elegantevents.tn',
  coverageAreas: ['Tunis', 'Ariana', 'Ben Arous', 'Manouba'],
  services: [
    {
      id: 'service-1',
      providerId: 'provider-1',
      name: 'Wedding Planning & Coordination',
      description: 'Complete wedding planning service from concept to execution. We handle all aspects of your special day including venue selection, vendor coordination, timeline management, and day-of coordination.',
      category: 'Wedding Planning',
      subcategory: 'Full Service',
      basePrice: 2500,
      priceUnit: 'per event',
      images: ['/api/placeholder/400/300'],
      features: ['Venue Selection', 'Vendor Coordination', 'Timeline Management', 'Day-of Coordination'],
      isActive: true,
      location: 'Tunis',
      coverageArea: ['Tunis', 'Ariana', 'Ben Arous'],
      pricingType: 'FIXED' as const,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-12-01')
    },
    {
      id: 'service-2',
      providerId: 'provider-1',
      name: 'Corporate Event Management',
      description: 'Professional corporate event planning for conferences, seminars, product launches, and team building activities. We ensure your business events reflect your brand and achieve your objectives.',
      category: 'Corporate Events',
      basePrice: 1800,
      priceUnit: 'per event',
      images: ['/api/placeholder/400/300'],
      features: ['Venue Booking', 'AV Equipment', 'Catering Coordination', 'Registration Management'],
      isActive: true,
      location: 'Tunis',
      coverageArea: ['Tunis', 'Ariana', 'Sousse'],
      pricingType: 'QUOTE' as const,
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-11-15')
    }
  ],
  packages: [
    {
      id: 'package-1',
      providerId: 'provider-1',
      name: 'Complete Wedding Package',
      description: 'Everything you need for your perfect wedding day, including planning, coordination, and essential services.',
      totalPrice: 4500,
      discount: 15,
      isActive: true,
      items: [
        {
          id: 'item-1',
          packageId: 'package-1',
          serviceId: 'service-1',
          service: {
            id: 'service-1',
            providerId: 'provider-1',
            name: 'Wedding Planning & Coordination',
            description: '',
            category: 'Wedding Planning',
            basePrice: 2500,
            priceUnit: 'per event',
            images: [],
            features: [],
            isActive: true,
            pricingType: 'FIXED' as const,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          quantity: 1,
          price: 2500
        }
      ],
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-12-01')
    }
  ],
  reviews: [
    {
      id: 'review-1',
      userId: 'user-2',
      user: {
        id: 'user-2',
        name: 'Sarah Ben Ali',
        image: '/api/placeholder/40/40'
      },
      providerId: 'provider-1',
      rating: 5,
      comment: 'Absolutely amazing service! They made our wedding day perfect. Every detail was handled with care and professionalism. Highly recommend!',
      isVerified: true,
      createdAt: new Date('2024-11-15'),
      updatedAt: new Date('2024-11-15')
    },
    {
      id: 'review-2',
      userId: 'user-3',
      user: {
        id: 'user-3',
        name: 'Ahmed Trabelsi'
      },
      providerId: 'provider-1',
      rating: 4,
      comment: 'Great experience with our corporate event. The team was professional and delivered exactly what we needed. Good value for money.',
      isVerified: true,
      createdAt: new Date('2024-10-28'),
      updatedAt: new Date('2024-10-28')
    },
    {
      id: 'review-3',
      userId: 'user-4',
      user: {
        id: 'user-4',
        name: 'Leila Mansouri',
        image: '/api/placeholder/40/40'
      },
      providerId: 'provider-1',
      rating: 5,
      comment: 'Exceptional service from start to finish. They understood our vision and brought it to life beautifully. Thank you for making our anniversary celebration so special!',
      isVerified: true,
      createdAt: new Date('2024-09-12'),
      updatedAt: new Date('2024-09-12')
    }
  ],
  createdAt: new Date('2023-06-01'),
  updatedAt: new Date('2024-12-01')
};

interface ProviderPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProviderPage({ params }: ProviderPageProps) {
  // In a real app, you would fetch the provider data from your database
  // const provider = await getProviderById(params.id);
  
  const { id } = await params;
  
  // For now, we'll use mock data
  if (id !== 'provider-1') {
    notFound();
  }

  const provider = mockProvider;

  return (
    <div className="min-h-screen bg-gray-50">
      <ProviderProfile provider={provider} />
    </div>
  );
}

export async function generateMetadata({ params }: ProviderPageProps) {
  const { id } = await params;
  
  // In a real app, you would fetch the provider data
  const provider = mockProvider;
  
  return {
    title: `${provider.businessName} - Mounasabet`,
    description: provider.description,
    openGraph: {
      title: provider.businessName,
      description: provider.description,
      images: provider.images.slice(0, 1),
    },
  };
}
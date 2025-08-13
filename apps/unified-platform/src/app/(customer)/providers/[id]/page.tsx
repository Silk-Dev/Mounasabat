import React from 'react';
import { notFound } from 'next/navigation';
import { ProviderProfile } from '@/components/provider';
import { Provider } from '@/types';

// Fetch provider data from database
async function getProviderById(providerId: string): Promise<Provider | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/providers/${providerId}`, {
      cache: 'no-store' // Ensure fresh data
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch provider');
    }

    const data = await response.json();
    return data.provider;
  } catch (error) {
    console.error('Error fetching provider:', error);
    return null;
  }
}

interface ProviderPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProviderPage({ params }: ProviderPageProps) {
  const { id } = await params;

  // Fetch provider data from database
  const provider = await getProviderById(id);

  if (!provider) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProviderProfile provider={provider} />
    </div>
  );
}

export async function generateMetadata({ params }: ProviderPageProps) {
  const { id } = await params;

  // Fetch provider data for metadata
  const provider = await getProviderById(id);

  if (!provider) {
    return {
      title: 'Provider Not Found - Mounasabet',
      description: 'The requested provider could not be found.',
    };
  }

  return {
    title: `${provider.businessName} - Mounasabet`,
    description: provider.description,
    openGraph: {
      title: provider.businessName,
      description: provider.description,
      images: provider.images?.slice(0, 1) || [],
    },
  };
}

'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Provider {
  id: string;
  name: string;
  description: string;
  contactEmail?: string;
  phoneNumber?: string;
  address?: string;
  website?: string;
  services: string[];
}

export default function ProviderDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const fetchProvider = async () => {
        try {
          const response = await fetch(`/api/provider/${id}`);
          if (!response.ok) {
            throw new Error('Failed to fetch provider');
          }
          const data = await response.json();
          setProvider(data);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      fetchProvider();
    }
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!provider) {
    return <div>Provider not found.</div>;
  }

  return (
    <div>
      <Link href="/provider" className="text-indigo-600 hover:underline mb-4 block">
        &larr; Back to Providers
      </Link>
      <h1 className="text-3xl font-bold mb-4">{provider.name}</h1>
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">About {provider.name}</h2>
          <p>{provider.description}</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Services Offered</h2>
          <ul className="list-disc list-inside">
            {provider.services.map((service, index) => (
              <li key={index}>{service}</li>
            ))}
          </ul>
        </div>
        {provider.contactEmail && (
          <div>
            <h2 className="text-xl font-semibold">Contact Information</h2>
            <p>Email: {provider.contactEmail}</p>
            {provider.phoneNumber && <p>Phone: {provider.phoneNumber}</p>}
            {provider.address && <p>Address: {provider.address}</p>}
            {provider.website && <p>Website: <a href={provider.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">{provider.website}</a></p>}
          </div>
        )}
      </div>
    </div>
  );
}


'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Provider {
  id: string;
  name: string;
  description?: string;
  contactEmail?: string;
  phoneNumber?: string;
  address?: string;
  website?: string;
  services: string[];
  user: { name: string; email: string };
}

export default function ProviderManagementPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await fetch('/api/provider');
        if (!response.ok) {
          throw new Error('Failed to fetch providers');
        }
        const data = await response.json();
        setProviders(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  if (loading) {
    return <div>Loading providers...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Provider Management</h1>
      {providers.length === 0 ? (
        <p>No providers found.</p>
      ) : (
        <ul className="space-y-4">
          {providers.map((provider) => (
            <li key={provider.id} className="p-4 border border-gray-200 rounded-md">
              <h2 className="text-xl font-semibold">{provider.name}</h2>
              <p>User: {provider.user.name} ({provider.user.email})</p>
              <p>Services: {provider.services.join(', ')}</p>
              <Link href={`/provider-management/${provider.id}`} className="text-indigo-600 hover:underline">
                View Details
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

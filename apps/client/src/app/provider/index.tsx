
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Provider {
  id: string;
  name: string;
  description: string;
  services: string[];
}

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');

  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (searchQuery) {
          params.append('search', searchQuery);
        }
        if (serviceFilter) {
          params.append('service', serviceFilter);
        }
        const queryString = params.toString();
        const response = await fetch(`/api/provider${queryString ? `?${queryString}` : ''}`);
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
  }, [searchQuery, serviceFilter]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleServiceFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setServiceFilter(e.target.value);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Our Providers</h1>
      <div className="mb-4 flex space-x-4">
        <input
          type="text"
          placeholder="Search providers..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="flex-grow p-2 border border-gray-300 rounded-md"
        />
        <select
          value={serviceFilter}
          onChange={handleServiceFilterChange}
          className="p-2 border border-gray-300 rounded-md"
        >
          <option value="">All Services</option>
          <option value="Wedding Planning">Wedding Planning</option>
          <option value="Catering">Catering</option>
          <option value="Photography">Photography</option>
          <option value="Venue">Venue</option>
          {/* Add more service options as needed */}
        </select>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div>Error: {error}</div>
      ) : providers.length === 0 ? (
        <p>No providers found.</p>
      ) : (
        <ul className="space-y-4">
          {providers.map((provider) => (
            <li key={provider.id} className="p-4 border border-gray-200 rounded-md">
              <h2 className="text-xl font-semibold">{provider.name}</h2>
              <p>{provider.description}</p>
              <p>Services: {provider.services.join(', ')}</p>
              <Link href={`/provider/${provider.id}`} className="text-indigo-600 hover:underline">
                View Profile
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

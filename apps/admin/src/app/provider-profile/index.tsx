
'use client';
import { useState, useEffect } from 'react';

interface Provider {
  id: string;
  userId: string;
  name: string;
  description: string;
  contactEmail: string;
  phoneNumber: string;
  address: string;
  website: string;
  services: string[];
}

export default function ProviderProfileEditor() {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Placeholder for the actual provider ID (e.g., from authentication context)
  const providerId = 'clerk_provider_id'; 

  useEffect(() => {
    const fetchProviderProfile = async () => {
      try {
        const response = await fetch(`/api/provider/${providerId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch provider profile');
        }
        const data = await response.json();
        setProvider(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (providerId) {
      fetchProviderProfile();
    }
  }, [providerId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProvider(prev => (prev ? { ...prev, [name]: value } : null));
  };

  const handleServicesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setProvider(prev => (prev ? { ...prev, services: value.split(',').map(s => s.trim()) } : null));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!provider) return;

    try {
      const response = await fetch(`/api/provider/${provider.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(provider),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div>Loading profile...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!provider) {
    return <div>Provider profile not found.</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Edit Your Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
          <input type="text" id="name" name="name" value={provider.name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea id="description" name="description" value={provider.description} onChange={handleChange} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
        </div>
        <div>
          <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">Contact Email</label>
          <input type="email" id="contactEmail" name="contactEmail" value={provider.contactEmail} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Phone Number</label>
          <input type="text" id="phoneNumber" name="phoneNumber" value={provider.phoneNumber} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
          <input type="text" id="address" name="address" value={provider.address} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="website" className="block text-sm font-medium text-gray-700">Website</label>
          <input type="url" id="website" name="website" value={provider.website} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="services" className="block text-sm font-medium text-gray-700">Services (comma-separated)</label>
          <input type="text" id="services" name="services" value={provider.services.join(', ')} onChange={handleServicesChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-500 text-sm">{success}</p>}

        <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Save Profile
        </button>
      </form>
    </div>
  );
}

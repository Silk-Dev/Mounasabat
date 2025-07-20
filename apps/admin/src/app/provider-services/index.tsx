
'use client';
import { useState, useEffect } from 'react';

export default function ProviderServicesPage() {
  const [services, setServices] = useState<string[]>([]);
  const [newService, setNewService] = useState('');
  const [editingService, setEditingService] = useState<string | null>(null);
  const [editedService, setEditedService] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Placeholder for the actual provider ID (e.g., from authentication context)
  const providerId = 'clerk_provider_id'; 

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch(`/api/provider-services?providerId=${providerId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch services');
        }
        const data = await response.json();
        setServices(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (providerId) {
      fetchServices();
    }
  }, [providerId]);

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.trim()) return;

    try {
      const response = await fetch('/api/provider-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, service: newService }),
      });
      if (!response.ok) {
        throw new Error('Failed to add service');
      }
      const updatedServices = await response.json();
      setServices(updatedServices);
      setNewService('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEditService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedService.trim() || !editingService) return;

    try {
      const response = await fetch('/api/provider-services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, oldService: editingService, newService: editedService }),
      });
      if (!response.ok) {
        throw new Error('Failed to update service');
      }
      const updatedServices = await response.json();
      setServices(updatedServices);
      setEditingService(null);
      setEditedService('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteService = async (serviceToDelete: string) => {
    try {
      const response = await fetch('/api/provider-services', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, service: serviceToDelete }),
      });
      if (!response.ok) {
        throw new Error('Failed to delete service');
      }
      const updatedServices = await response.json();
      setServices(updatedServices);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div>Loading services...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Manage Your Services</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Add New Service</h2>
        <form onSubmit={handleAddService} className="flex space-x-2">
          <input
            type="text"
            value={newService}
            onChange={(e) => setNewService(e.target.value)}
            placeholder="Enter new service name"
            className="flex-grow p-2 border border-gray-300 rounded-md"
          />
          <button type="submit" className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Add Service
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Your Services</h2>
        {services.length === 0 ? (
          <p>No services added yet.</p>
        ) : (
          <ul className="space-y-3">
            {services.map((service, index) => (
              <li key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                {editingService === service ? (
                  <form onSubmit={handleEditService} className="flex-grow flex space-x-2">
                    <input
                      type="text"
                      value={editedService}
                      onChange={(e) => setEditedService(e.target.value)}
                      className="flex-grow p-1 border border-gray-300 rounded-md"
                    />
                    <button type="submit" className="py-1 px-3 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm">
                      Save
                    </button>
                    <button type="button" onClick={() => setEditingService(null)} className="py-1 px-3 bg-gray-400 text-white rounded-md hover:bg-gray-500 text-sm">
                      Cancel
                    </button>
                  </form>
                ) : (
                  <span className="text-lg">{service}</span>
                )}
                <div className="space-x-2">
                  {editingService !== service && (
                    <button onClick={() => { setEditingService(service); setEditedService(service); }} className="py-1 px-3 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-sm">
                      Edit
                    </button>
                  )}
                  <button onClick={() => handleDeleteService(service)} className="py-1 px-3 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm">
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

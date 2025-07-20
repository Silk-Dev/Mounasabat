
'use client';
import { useState } from 'react';

export default function CalendarPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAvailability = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/calendar?providerId=1&start=${startDate}&end=${endDate}`);
      if (!response.ok) {
        throw new Error('Failed to fetch availability');
      }
      const data = await response.json();
      setAvailability(data.availability);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Check Availability</h1>
      <div className="flex space-x-4 mb-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
          <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-xs py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
          <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-xs py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
      </div>
      <button onClick={checkAvailability} disabled={loading} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-xs text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        {loading ? 'Checking...' : 'Check Availability'}
      </button>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Available Slots</h2>
        {availability.length === 0 ? (
          <p>No available slots in the selected range.</p>
        ) : (
          <ul>
            {availability.map((slot: any, index) => (
              <li key={index}>{new Date(slot.start).toLocaleString()} - {new Date(slot.end).toLocaleString()}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

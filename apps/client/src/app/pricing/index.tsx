import { useEffect, useState } from "react";
import Head from "next/head";

interface PricingPlan {
  id: string;
  name: string;
  price: number;
}

export default function PricingPlans() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPricingPlans() {
      try {
        const response = await fetch("/api/pricing");
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        setPlans(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchPricingPlans();
  }, []);

  if (loading) return <p>Loading pricing plans...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <Head>
        <title>Pricing Plans - Mounasabet</title>
      </Head>
      <h1 className="text-2xl font-bold mb-4">Our Pricing Plans</h1>
      {plans.length === 0 ? (
        <p>No pricing plans available.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-white p-6 rounded shadow-md">
              <h2 className="text-xl font-semibold mb-2">{plan.name}</h2>
              <p className="text-3xl font-bold text-indigo-600">
                ${plan.price}
              </p>
              <button className="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Choose Plan
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

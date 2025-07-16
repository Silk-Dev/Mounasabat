import { useState, useEffect } from "react";
import Head from "next/head";
import { useSession } from "better-auth/react";

export default function UserProfile() {
  const { data: session, status } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setName(session.user.name || "");
      setEmail(session.user.email || "");
    }
  }, [session, status]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!session?.user?.id) {
      setError("User not authenticated.");
      return;
    }

    try {
      const response = await fetch("/api/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: session.user.id, name, email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      setSuccess("Profile updated successfully!");
      // Optionally, refetch session to update local state
      // refetch();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    }
  };

  if (status === "loading") {
    return <p>Loading profile...</p>;
  }

  if (status === "unauthenticated") {
    return <p>Please sign in to view your profile.</p>;
  }

  return (
    <div>
      <Head>
        <title>User Profile - Weddni</title>
      </Head>
      <h1 className="text-2xl font-bold mb-4">User Profile</h1>
      <form onSubmit={handleUpdateProfile} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-xs py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-xs py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-500 text-sm">{success}</p>}

        <button
          type="submit"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-xs text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Update Profile
        </button>
      </form>
    </div>
  );
}

import { useState } from "react";
import { useAuth } from "better-auth/react";
import { useRouter } from "next/navigation";
import Head from "next/head";
import { Button } from "@weddni/ui";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signUp({ email, password });
      alert("Sign-up successful! Please sign in.");
      router.push("/signin"); // Redirect to sign-in page after successful sign-up
    } catch (error) {
      console.error("Sign-up failed:", error);
      alert("Sign-up failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-2">
      <Head>
        <title>Sign Up</title>
      </Head>

      <main className="flex flex-col items-center justify-center flex-1 px-20 text-center">
        <h1 className="text-4xl font-bold mb-8">Sign Up</h1>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col space-y-4 w-full max-w-md"
        >
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-2 border border-gray-300 rounded-md"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-2 border border-gray-300 rounded-md"
            required
          />
          <Button type="submit" className="mt-4">
            Sign Up
          </Button>
        </form>
      </main>
    </div>
  );
}

import { useState } from "react";
import { useAuth } from "better-auth/react";
import { useRouter } from "next/navigation";
import Head from "next/head";
import { Button } from "@mounasabet/ui";
import { toast } from "sonner";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn({ email, password });
      router.push("/"); // Redirect to home on successful sign-in
    } catch (error) {
      console.error("Sign-in failed:", error);
      toast.error("Sign-in failed. Please check your credentials.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-2">
      <Head>
        <title>Sign In</title>
      </Head>

      <main className="flex flex-col items-center justify-center flex-1 px-20 text-center">
        <h1 className="text-4xl font-bold mb-8">Sign In</h1>
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
            Sign In
          </Button>
        </form>
      </main>
    </div>
  );
}

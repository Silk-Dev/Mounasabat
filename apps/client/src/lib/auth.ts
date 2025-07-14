import { betterAuth } from "better-auth";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { DrizzleAdapter } from "@better-auth/drizzle-adapter";

const client = createClient({ 
  url: process.env.TURSO_DATABASE_URL!, 
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const db = drizzle(client);

export const auth = betterAuth({
  adapter: DrizzleAdapter(db),
});
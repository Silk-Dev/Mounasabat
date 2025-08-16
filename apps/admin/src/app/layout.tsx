import "@mounasabet/ui/styles.css";
import React from "react";
import Head from "next/head";
import Link from "next/link";
import { Toaster } from "@mounasabet/ui";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          <Head>
            <title>Mounasabet Admin</title>
            <meta name="description" content="Mounasabet Admin Dashboard" />
            <link rel="icon" href="/favicon.ico" />
          </Head>
          <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
            <h1 className="text-xl font-bold">Mounasabet Admin</h1>
            <nav>{/* Admin navigation items */}</nav>
          </header>
          <div className="flex flex-1">
            <aside className="w-64 bg-gray-900 text-white p-4">
              <nav>
                <ul>
                  <li className="mb-2">
                    <Link href="/" className="hover:text-gray-300">
                      Dashboard
                    </Link>
                  </li>
                  <li className="mb-2">
                    <Link href="/users" className="hover:text-gray-300">
                      Users
                    </Link>
                  </li>
                  <li className="mb-2">
                    <Link href="/events" className="hover:text-gray-300">
                      Events
                    </Link>
                  </li>
                  <li className="mb-2">
                    <Link href="/pricing" className="hover:text-gray-300">
                      Pricing
                    </Link>
                  </li>
                  <li className="mb-2">
                    <Link href="#" className="hover:text-gray-300">
                      Settings
                    </Link>
                  </li>
                </ul>
              </nav>
            </aside>
            <main className="flex-1 p-4 bg-gray-100">{children}</main>
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}

import React from "react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Weddni Admin</h1>
        <nav>{/* Admin navigation items */}</nav>
      </header>
      <div className="flex flex-1">
        <aside className="w-64 bg-gray-900 text-white p-4">
          <nav>
            <ul>
              <li className="mb-2">
                <a href="/" className="hover:text-gray-300">
                  Dashboard
                </a>
              </li>
              <li className="mb-2">
                <a href="/users" className="hover:text-gray-300">
                  Users
                </a>
              </li>
              <li className="mb-2">
                <a href="/events" className="hover:text-gray-300">
                  Events
                </a>
              </li>
              <li className="mb-2">
                <a href="/pricing" className="hover:text-gray-300">
                  Pricing
                </a>
              </li>
              <li className="mb-2">
                <a href="#" className="hover:text-gray-300">
                  Settings
                </a>
              </li>
            </ul>
          </nav>
        </aside>
        <main className="flex-1 p-4 bg-gray-100">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;

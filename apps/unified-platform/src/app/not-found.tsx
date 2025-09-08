import React from 'react';
import { FileQuestion, Home, Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <FileQuestion className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-semibold text-gray-900">
            Page Not Found
          </CardTitle>
          <CardDescription className="text-base">
            The page you're looking for doesn't exist or may have been moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">What you can do:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Check the URL for typos</li>
              <li>• Search for what you're looking for</li>
              <li>• Go back to the previous page</li>
              <li>• Return to the homepage</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/" className="w-full">
              <Button className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Go to Homepage
              </Button>
            </Link>
            <div className="grid grid-cols-2 gap-3">
            <Link href="/" className="w-full">
              <Button 
                variant="outline" 
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              </Link>
              <Link href="/search" className="w-full">
                <Button variant="outline" className="w-full">
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </Link>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-medium text-gray-900 mb-3">Popular Pages</h4>
            <div className="space-y-2">
              <Link 
                href="/search" 
                className="block text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                Search Services
              </Link>
              <Link 
                href="/providers" 
                className="block text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                Browse Providers
              </Link>
              <Link 
                href="/categories" 
                className="block text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                Service Categories
              </Link>
              <Link 
                href="/support" 
                className="block text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                Help & Support
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
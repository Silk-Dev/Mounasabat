'use client';

import React from 'react';
import { ReviewModeration } from '@/components/reviews';

export default function AdminReviewsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Review Management</h1>
        <p className="text-gray-600 mt-2">
          Moderate customer reviews and maintain platform quality standards.
        </p>
      </div>
      
      <ReviewModeration />
    </div>
  );
}
'use client';

import React, { useState } from 'react';
import { Review, ReviewForm, ReviewInvitation } from '@/components/reviews';
import { ReviewSection } from '@/components/provider';
import { Card, CardContent, CardHeader, CardTitle, Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { Star, Users, Award, TrendingUp } from 'lucide-react';

// Demo data fetched from database
import { useDataLoader } from '@/hooks/useDataLoader';

const fetchDemoReviews = async () => {
  try {
    const response = await fetch('/api/reviews?demo=true&limit=3');
    if (!response.ok) return [];
    const data = await response.json();
    return data.reviews || [];
  } catch (error) {
    console.error('Failed to fetch demo reviews:', error);
    return [];
  }
};

const fetchDemoBooking = async () => {
  try {
    const response = await fetch('/api/bookings?demo=true&limit=1');
    if (!response.ok) return null;
    const data = await response.json();
    return data.bookings?.[0] || null;
  } catch (error) {
    console.error('Failed to fetch demo booking:', error);
    return null;
  }
};

export default function ReviewsDemoPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showReviewForm, setShowReviewForm] = useState(false);

  const { data: reviews, loading: reviewsLoading } = useDataLoader(fetchDemoReviews, []);
  const { data: booking, loading: bookingLoading } = useDataLoader(fetchDemoBooking, []);

  const averageRating = reviews?.length > 0 
    ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length 
    : 0;
  const totalReviews = reviews?.length || 0;

  const handleReviewSubmit = async (reviewData: any) => {
    console.log('Review submitted:', reviewData);
    // In a real app, this would call the API
    alert('Review submitted successfully!');
    setShowReviewForm(false);
  };

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Review & Rating System Demo
        </h1>
        <p className="text-gray-600 text-lg">
          Comprehensive review system with customer feedback, provider ratings, and admin moderation.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{averageRating.toFixed(1)}</p>
                <p className="text-gray-600">Average Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{totalReviews}</p>
                <p className="text-gray-600">Total Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Award className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold">
                  {reviews?.filter((r: any) => r.isVerified).length || 0}
                </p>
                <p className="text-gray-600">Verified Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold">98%</p>
                <p className="text-gray-600">Satisfaction Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Demo Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="write-review">Write Review</TabsTrigger>
          <TabsTrigger value="invitation">Review Invitation</TabsTrigger>
          <TabsTrigger value="provider-view">Provider View</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Review System Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Customer Features</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Write and edit reviews after booking completion</li>
                    <li>• Rate services from 1-5 stars with optional comments</li>
                    <li>• View all reviews for providers and services</li>
                    <li>• Receive review invitations via email</li>
                    <li>• Report inappropriate reviews</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Admin Features</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Moderate and verify customer reviews</li>
                    <li>• Bulk actions for review management</li>
                    <li>• Flag and remove inappropriate content</li>
                    <li>• View detailed review analytics</li>
                    <li>• Manage review invitation system</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {reviewsLoading ? (
              <div className="col-span-2 text-center py-8">Loading reviews...</div>
            ) : reviews?.length > 0 ? (
              reviews.map((review: any) => (
                <Review
                  key={review.id}
                  review={review}
                  currentUserId="user-1"
                  onEdit={(review) => console.log('Edit review:', review)}
                  onDelete={(reviewId) => console.log('Delete review:', reviewId)}
                  onFlag={(reviewId, reason) => console.log('Flag review:', reviewId, reason)}
                />
              ))
            ) : (
              <div className="col-span-2 text-center py-8 text-gray-500">
                No reviews available for demo. Please seed the database with demo data.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="write-review" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Review Form Demo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                This form allows customers to write reviews after completing a booking.
              </p>
              <ReviewForm
                providerId="provider-1"
                serviceId="service-1"
                bookingId="booking-1"
                providerName="Elite Photography"
                serviceName="Wedding Photography Package"
                onSubmit={handleReviewSubmit}
                onCancel={() => setShowReviewForm(false)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invitation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Review Invitation Demo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                This invitation is sent to customers after their booking is completed.
              </p>
              {bookingLoading ? (
                <div className="text-center py-4">Loading booking...</div>
              ) : booking ? (
                <ReviewInvitation
                  booking={booking}
                  onReviewSubmitted={() => console.log('Review submitted from invitation')}
                />
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No booking available for demo. Please seed the database with demo data.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="provider-view" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Provider Review Section</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                This is how reviews appear on provider profile pages.
              </p>
              <ReviewSection
                reviews={reviews || []}
                averageRating={averageRating}
                totalReviews={totalReviews}
                currentUserId="user-1"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Implementation Notes */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Implementation Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <h4 className="font-semibold text-gray-900">API Endpoints Created:</h4>
              <ul className="mt-2 space-y-1">
                <li>• <code>GET/POST /api/reviews</code> - Fetch and create reviews</li>
                <li>• <code>GET/PUT/DELETE /api/reviews/[id]</code> - Individual review management</li>
                <li>• <code>POST /api/reviews/invite</code> - Send review invitations</li>
                <li>• <code>GET/POST /api/admin/reviews</code> - Admin review moderation</li>
                <li>• <code>PUT/DELETE /api/admin/reviews/[id]</code> - Admin review actions</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900">Components Created:</h4>
              <ul className="mt-2 space-y-1">
                <li>• <code>ReviewForm</code> - Form for submitting reviews</li>
                <li>• <code>Review</code> - Individual review display with actions</li>
                <li>• <code>ReviewInvitation</code> - Email invitation component</li>
                <li>• <code>ReviewModeration</code> - Admin moderation interface</li>
                <li>• <code>ReviewSection</code> - Enhanced provider review section</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900">Features Implemented:</h4>
              <ul className="mt-2 space-y-1">
                <li>• ✅ Review submission with rating and comments</li>
                <li>• ✅ Review display with user information and verification badges</li>
                <li>• ✅ Rating aggregation and provider rating updates</li>
                <li>• ✅ Admin moderation tools with bulk actions</li>
                <li>• ✅ Review invitation system with email notifications</li>
                <li>• ✅ Review editing and deletion with proper authorization</li>
                <li>• ✅ Review flagging and reporting system</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
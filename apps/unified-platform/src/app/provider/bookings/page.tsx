'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Input } from '@/components/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { 
  Calendar,
  Clock,
  User,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { logger } from '@/lib/production-logger';
import { BookingStatus } from '@/types';

interface BookingWithRelations {
  id: string;
  status: BookingStatus;
  startTime: Date;
  endTime: Date;
  createdAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  service?: {
    id: string;
    name: string;
    category: string;
    basePrice: number;
  };
}

const STATUS_COLORS: Record<BookingStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  PAID: 'bg-blue-100 text-blue-800',
  DELIVERED: 'bg-purple-100 text-purple-800',
};

const STATUS_ICONS: Record<BookingStatus, any> = {
  PENDING: AlertCircle,
  CONFIRMED: CheckCircle,
  CANCELLED: XCircle,
  PAID: CheckCircle,
  DELIVERED: CheckCircle,
};

export default function ProviderBookingsPage() {
  const { session } = useAuth();
  const [bookings, setBookings] = useState<BookingWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  useEffect(() => {
    if (session?.user) {
      fetchBookings();
    }
  }, [session, statusFilter, dateFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      if (dateFilter !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (dateFilter) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          default:
            startDate = new Date(0);
        }
        
        params.append('startDate', startDate.toISOString());
      }

      const response = await fetch(`/api/provider/bookings?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      }
    } catch (error) {
      logger.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: BookingStatus) => {
    try {
      const response = await fetch(`/api/provider/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchBookings(); // Refresh the list
      }
    } catch (error) {
      logger.error('Error updating booking status:', error);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        booking.user?.name?.toLowerCase().includes(searchLower) ||
        booking.service?.name?.toLowerCase().includes(searchLower) ||
        booking.id.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const getStatusIcon = (status: BookingStatus) => {
    const Icon = STATUS_ICONS[status] || AlertCircle;
    return <Icon className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Bookings Management</h1>
        <div className="flex items-center gap-4">
          <Badge variant="secondary">
            {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={fetchBookings}>
              <Filter className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No bookings found</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your filters to see more results.'
                : 'Your bookings will appear here once customers start booking your services.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${STATUS_COLORS[booking.status]}`}>
                      {getStatusIcon(booking.status)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {booking.service?.name || 'Service'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Booking ID: {booking.id.slice(-8)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge className={STATUS_COLORS[booking.status]}>
                      {booking.status}
                    </Badge>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/provider/bookings/${booking.id}`}>
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Customer Info */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Customer
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">{booking.user?.name}</p>
                      <p className="text-muted-foreground flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {booking.user?.email}
                      </p>
                    </div>
                  </div>

                  {/* Event Details */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Event Details
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(booking.startTime).toLocaleDateString()} at{' '}
                        {new Date(booking.startTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <p className="text-muted-foreground">
                        Duration: {Math.round((new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()) / (1000 * 60 * 60))} hours
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    <h4 className="font-medium mb-2">Quick Actions</h4>
                    <div className="flex flex-wrap gap-2">
                      {booking.status === 'PENDING' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateBookingStatus(booking.id, 'CONFIRMED')}
                          >
                            Accept
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateBookingStatus(booking.id, 'CANCELLED')}
                          >
                            Decline
                          </Button>
                        </>
                      )}
                      
                      {booking.status === 'CONFIRMED' && (
                        <Button
                          size="sm"
                          onClick={() => updateBookingStatus(booking.id, 'DELIVERED')}
                        >
                          Mark Complete
                        </Button>
                      )}
                      
                      {booking.status === 'DELIVERED' && (
                        <Badge variant="outline" className="text-green-600">
                          Completed
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
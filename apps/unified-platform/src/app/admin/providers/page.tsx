'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@mounasabet/ui';
import { 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Shield, 
  ShieldCheck,
  Ban,
  UnlockKeyhole,
  Star,
  MapPin,
  Calendar,
  Phone,
  Mail,
  Globe,
} from 'lucide-react';

interface Provider {
  id: string;
  name: string;
  description: string;
  contactEmail: string;
  phoneNumber: string;
  website: string;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  location: any;
  coverageAreas: string[];
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
  };
  serviceOfferings: Array<{
    id: string;
    name: string;
    category: string;
    isActive: boolean;
  }>;
  _count: {
    serviceOfferings: number;
    reviews: number;
  };
}

interface ProviderDetail extends Provider {
  user: Provider['user'] & {
    phoneNumber: string;
    address: string;
    banned: boolean;
    banReason: string;
    banExpires: string;
  };
  reviews: Array<{
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    user: {
      name: string;
    };
  }>;
  packages: Array<{
    id: string;
    name: string;
    totalPrice: number;
    isActive: boolean;
  }>;
}

export default function ProvidersPage() {
  const { session } = useAuth();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ProviderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showProviderDetail, setShowProviderDetail] = useState(false);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        status: statusFilter,
        search: searchTerm,
      });

      const response = await fetch(`/api/admin/providers?${params}`);
      const data = await response.json();

      if (response.ok) {
        setProviders(data.providers);
        setTotalPages(data.pagination.pages);
      } else {
        console.error('Error fetching providers:', data.error);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProviderDetail = async (providerId: string) => {
    try {
      const response = await fetch(`/api/admin/providers/${providerId}`);
      const data = await response.json();

      if (response.ok) {
        setSelectedProvider(data.provider);
        setShowProviderDetail(true);
      } else {
        console.error('Error fetching provider detail:', data.error);
      }
    } catch (error) {
      console.error('Error fetching provider detail:', error);
    }
  };

  const updateProviderStatus = async (providerId: string, isVerified: boolean) => {
    try {
      const response = await fetch(`/api/admin/providers/${providerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isVerified }),
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh the providers list
        fetchProviders();
        // Update the selected provider if it's currently shown
        if (selectedProvider?.id === providerId) {
          fetchProviderDetail(providerId);
        }
      } else {
        console.error('Error updating provider:', data.error);
      }
    } catch (error) {
      console.error('Error updating provider:', error);
    }
  };

  const banProvider = async (providerId: string, banReason: string) => {
    try {
      const response = await fetch(`/api/admin/providers/${providerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          banUser: true, 
          banReason,
          banExpires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        }),
      });

      const data = await response.json();

      if (response.ok) {
        fetchProviders();
        if (selectedProvider?.id === providerId) {
          fetchProviderDetail(providerId);
        }
      } else {
        console.error('Error banning provider:', data.error);
      }
    } catch (error) {
      console.error('Error banning provider:', error);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [currentPage, statusFilter, searchTerm]);

  const getStatusBadge = (provider: Provider) => {
    if (provider.isVerified) {
      return <Badge variant="default" className="bg-green-100 text-green-800"><ShieldCheck className="w-3 h-3 mr-1" />Verified</Badge>;
    }
    return <Badge variant="secondary"><Shield className="w-3 h-3 mr-1" />Unverified</Badge>;
  };

  const getRatingDisplay = (rating: number, reviewCount: number) => {
    if (reviewCount === 0) {
      return <span className="text-gray-500">No reviews</span>;
    }
    return (
      <div className="flex items-center">
        <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
        <span>{rating?.toFixed(1) || '0.0'} ({reviewCount})</span>
      </div>
    );
  };

  if (loading && providers.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Provider Management</h1>
        <p className="text-gray-600 mt-2">
          Manage service providers, verify accounts, and monitor platform quality.
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search providers by name, email, or business name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Providers</SelectItem>
                <SelectItem value="verified">Verified Only</SelectItem>
                <SelectItem value="unverified">Unverified Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Providers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Providers ({providers.length})</CardTitle>
          <CardDescription>
            Manage and verify service providers on the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Services</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{provider.name}</div>
                      <div className="text-sm text-gray-500">{provider.user.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center">
                        <Mail className="w-3 h-3 mr-1" />
                        {provider.contactEmail || provider.user.email}
                      </div>
                      {provider.phoneNumber && (
                        <div className="flex items-center mt-1">
                          <Phone className="w-3 h-3 mr-1" />
                          {provider.phoneNumber}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{provider._count.serviceOfferings} services</div>
                      <div className="text-gray-500">
                        {provider.serviceOfferings.slice(0, 2).map(s => s.category).join(', ')}
                        {provider.serviceOfferings.length > 2 && '...'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getRatingDisplay(provider.rating, provider._count.reviews)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(provider)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500">
                      {new Date(provider.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchProviderDetail(provider.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {!provider.isVerified ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateProviderStatus(provider.id, true)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateProviderStatus(provider.id, false)}
                          className="text-orange-600 hover:text-orange-700"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6 space-x-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Provider Detail Dialog */}
      <Dialog open={showProviderDetail} onOpenChange={setShowProviderDetail}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Provider Details</DialogTitle>
            <DialogDescription>
              Detailed information about the provider and their services
            </DialogDescription>
          </DialogHeader>
          
          {selectedProvider && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Business Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Business Name</label>
                      <p className="text-sm">{selectedProvider.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Description</label>
                      <p className="text-sm">{selectedProvider.description || 'No description provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Coverage Areas</label>
                      <p className="text-sm">{selectedProvider.coverageAreas.join(', ') || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Website</label>
                      <p className="text-sm">
                        {selectedProvider.website ? (
                          <a href={selectedProvider.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {selectedProvider.website}
                          </a>
                        ) : 'Not provided'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contact & Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Owner</label>
                      <p className="text-sm">{selectedProvider.user.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-sm">{selectedProvider.contactEmail || selectedProvider.user.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-sm">{selectedProvider.phoneNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Verification Status</label>
                      <div className="mt-1">{getStatusBadge(selectedProvider)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Rating</label>
                      <div className="mt-1">{getRatingDisplay(selectedProvider.rating, selectedProvider._count.reviews)}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Services */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Services ({selectedProvider.serviceOfferings.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedProvider.serviceOfferings.map((service) => (
                      <div key={service.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{service.name}</h4>
                            <p className="text-sm text-gray-500">{service.category}</p>
                          </div>
                          <Badge variant={service.isActive ? "default" : "secondary"}>
                            {service.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Reviews */}
              {selectedProvider.reviews.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Reviews</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedProvider.reviews.slice(0, 5).map((review) => (
                        <div key={review.id} className="border-b pb-3 last:border-b-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="ml-2 text-sm font-medium">{review.user.name}</span>
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {review.comment && (
                            <p className="text-sm text-gray-700">{review.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                {!selectedProvider.isVerified ? (
                  <Button
                    onClick={() => updateProviderStatus(selectedProvider.id, true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Verify Provider
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => updateProviderStatus(selectedProvider.id, false)}
                    className="text-orange-600 hover:text-orange-700"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Remove Verification
                  </Button>
                )}
                
                {!selectedProvider.user.banned ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Ban className="w-4 h-4 mr-2" />
                        Ban Provider
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Ban Provider</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will ban the provider from the platform for 30 days. They will not be able to access their account or receive new bookings.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => banProvider(selectedProvider.id, 'Banned by admin for policy violation')}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Ban Provider
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => banProvider(selectedProvider.id, '')}
                    className="text-green-600 hover:text-green-700"
                  >
                    <UnlockKeyhole className="w-4 h-4 mr-2" />
                    Unban Provider
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
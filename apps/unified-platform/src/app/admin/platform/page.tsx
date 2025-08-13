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
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Switch,
} from '@/components/ui';
import { 
  Star,
  TrendingUp,
  Eye,
  Settings,
  Tag,
  Award,
  BarChart3,
  Users,
  ShoppingBag,
} from 'lucide-react';

interface Category {
  name: string;
  totalServices: number;
  activeServices: number;
  inactiveServices: number;
}

interface FeaturedProvider {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  user: {
    name: string;
    email: string;
  };
  _count: {
    serviceOfferings: number;
    reviews: number;
  };
}

interface FeaturedService {
  id: string;
  name: string;
  category: string;
  description: string;
  basePrice: number;
  isActive: boolean;
  provider: {
    name: string;
    rating: number;
    reviewCount: number;
  };
  _count: {
    reviews: number;
    bookings: number;
  };
}

export default function PlatformPage() {
  const { session } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProviders, setFeaturedProviders] = useState<FeaturedProvider[]>([]);
  const [featuredServices, setFeaturedServices] = useState<FeaturedService[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/platform/categories');
      const data = await response.json();

      if (response.ok) {
        setCategories(data.categories);
      } else {
        console.error('Error fetching categories:', data.error);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchFeaturedContent = async () => {
    try {
      const response = await fetch('/api/admin/platform/featured');
      const data = await response.json();

      if (response.ok) {
        setFeaturedProviders(data.featuredProviders);
        setFeaturedServices(data.featuredServices);
      } else {
        console.error('Error fetching featured content:', data.error);
      }
    } catch (error) {
      console.error('Error fetching featured content:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        fetchCategories(),
        fetchFeaturedContent(),
      ]);
      setLoading(false);
    };

    fetchData();
  }, []);

  const getRatingDisplay = (rating: number, reviewCount: number) => {
    return (
      <div className="flex items-center">
        <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
        <span>{rating?.toFixed(1) || '0.0'} ({reviewCount})</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Platform Management</h1>
        <p className="text-gray-600 mt-2">
          Manage categories, featured content, and platform settings.
        </p>
      </div>

      {/* Platform Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">
              Service categories available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured Providers</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{featuredProviders.length}</div>
            <p className="text-xs text-muted-foreground">
              Top-rated verified providers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured Services</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{featuredServices.length}</div>
            <p className="text-xs text-muted-foreground">
              Popular services displayed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Management Tabs */}
      <Tabs defaultValue="categories" className="space-y-6">
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="featured-providers">Featured Providers</TabsTrigger>
          <TabsTrigger value="featured-services">Featured Services</TabsTrigger>
          <TabsTrigger value="settings">Platform Settings</TabsTrigger>
        </TabsList>

        {/* Categories Tab */}
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Service Categories</CardTitle>
              <CardDescription>
                Manage service categories and their performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Total Services</TableHead>
                    <TableHead>Active Services</TableHead>
                    <TableHead>Inactive Services</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.name}>
                      <TableCell>
                        <div className="font-medium">{category.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <ShoppingBag className="w-4 h-4 mr-2 text-gray-400" />
                          {category.totalServices}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          {category.activeServices} Active
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {category.inactiveServices > 0 ? (
                          <Badge variant="secondary">
                            {category.inactiveServices} Inactive
                          </Badge>
                        ) : (
                          <span className="text-gray-500">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ 
                                width: `${(category.activeServices / category.totalServices) * 100}%` 
                              }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">
                            {((category.activeServices / category.totalServices) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Featured Providers Tab */}
        <TabsContent value="featured-providers">
          <Card>
            <CardHeader>
              <CardTitle>Featured Providers</CardTitle>
              <CardDescription>
                Top-rated and verified providers displayed prominently on the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Services</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Featured</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {featuredProviders.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{provider.name}</div>
                          <div className="text-sm text-gray-500">
                            {provider._count.serviceOfferings} services offered
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{provider.user.name}</div>
                          <div className="text-gray-500">{provider.user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRatingDisplay(provider.rating, provider._count.reviews)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{provider._count.serviceOfferings} services</div>
                          <div className="text-gray-500">{provider._count.reviews} reviews</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {provider.isVerified ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Unverified</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch defaultChecked={true} />
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Featured Services Tab */}
        <TabsContent value="featured-services">
          <Card>
            <CardHeader>
              <CardTitle>Featured Services</CardTitle>
              <CardDescription>
                Popular and high-quality services highlighted on the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Featured</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {featuredServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{service.name}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {service.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{service.provider.name}</div>
                          <div className="flex items-center text-gray-500">
                            <Star className="w-3 h-3 text-yellow-400 fill-current mr-1" />
                            {service.provider.rating?.toFixed(1)} ({service.provider.reviewCount})
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{service.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {service.basePrice ? `$${service.basePrice}` : 'Quote'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{service._count.bookings} bookings</div>
                          <div className="text-gray-500">{service._count.reviews} reviews</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch defaultChecked={true} />
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Platform Settings Tab */}
        <TabsContent value="settings">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Configure general platform settings and policies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Auto-approve new providers</label>
                    <p className="text-xs text-gray-500">Automatically verify new provider accounts</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Allow guest bookings</label>
                    <p className="text-xs text-gray-500">Allow users to book without creating an account</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Enable review moderation</label>
                    <p className="text-xs text-gray-500">Require admin approval for all reviews</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Maintenance mode</label>
                    <p className="text-xs text-gray-500">Put the platform in maintenance mode</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feature Flags</CardTitle>
                <CardDescription>
                  Enable or disable platform features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Advanced search filters</label>
                    <p className="text-xs text-gray-500">Enable location and price range filters</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Real-time notifications</label>
                    <p className="text-xs text-gray-500">Enable push notifications for users</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Chat system</label>
                    <p className="text-xs text-gray-500">Enable messaging between customers and providers</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Analytics tracking</label>
                    <p className="text-xs text-gray-500">Enable user behavior analytics</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Settings</CardTitle>
                <CardDescription>
                  Configure payment processing and fees
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Platform commission</label>
                    <p className="text-xs text-gray-500">Percentage fee charged to providers</p>
                  </div>
                  <div className="text-sm font-medium">5%</div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Payment processing fee</label>
                    <p className="text-xs text-gray-500">Additional fee for payment processing</p>
                  </div>
                  <div className="text-sm font-medium">2.9% + $0.30</div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Instant payouts</label>
                    <p className="text-xs text-gray-500">Enable instant payouts to providers</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Configure security and moderation settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Two-factor authentication</label>
                    <p className="text-xs text-gray-500">Require 2FA for admin accounts</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">IP-based restrictions</label>
                    <p className="text-xs text-gray-500">Restrict access based on IP address</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Automated fraud detection</label>
                    <p className="text-xs text-gray-500">Enable AI-powered fraud detection</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
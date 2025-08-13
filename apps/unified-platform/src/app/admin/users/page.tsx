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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui';
import { 
  Search, 
  Filter, 
  Eye, 
  Ban, 
  UnlockKeyhole,
  UserCheck,
  UserX,
  Shield,
  ShieldCheck,
  Crown,
  Mail,
  Phone,
  MapPin,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'provider' | 'admin';
  phoneNumber: string;
  address: string;
  banned: boolean;
  banReason: string;
  banExpires: string;
  createdAt: string;
  updatedAt: string;
  provider?: {
    id: string;
    name: string;
    isVerified: boolean;
  };
  _count: {
    bookings: number;
    orders: number;
    reviews: number;
  };
}

interface UserDetail extends User {
  bookings: Array<{
    id: string;
    status: string;
    startTime: string;
    createdAt: string;
    event: {
      name: string;
    };
    service: {
      name: string;
    };
  }>;
  orders: Array<{
    id: string;
    orderType: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    items: Array<{
      name: string;
      quantity: number;
    }>;
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    provider?: {
      name: string;
    };
    service?: {
      name: string;
    };
  }>;
  reportedIssues: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    createdAt: string;
  }>;
}

export default function UsersPage() {
  const { session } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showUserDetail, setShowUserDetail] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        role: roleFilter,
        status: statusFilter,
        search: searchTerm,
      });

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users);
        setTotalPages(data.pagination.pages);
      } else {
        console.error('Error fetching users:', data.error);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetail = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      const data = await response.json();

      if (response.ok) {
        setSelectedUser(data.user);
        setShowUserDetail(true);
      } else {
        console.error('Error fetching user detail:', data.error);
      }
    } catch (error) {
      console.error('Error fetching user detail:', error);
    }
  };

  const updateUserRole = async (userId: string, role: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });

      const data = await response.json();

      if (response.ok) {
        fetchUsers();
        if (selectedUser?.id === userId) {
          fetchUserDetail(userId);
        }
      } else {
        console.error('Error updating user role:', data.error);
      }
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const banUser = async (userId: string, banReason: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          banned: true, 
          banReason,
          banExpires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        }),
      });

      const data = await response.json();

      if (response.ok) {
        fetchUsers();
        if (selectedUser?.id === userId) {
          fetchUserDetail(userId);
        }
      } else {
        console.error('Error banning user:', data.error);
      }
    } catch (error) {
      console.error('Error banning user:', error);
    }
  };

  const unbanUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ banned: false }),
      });

      const data = await response.json();

      if (response.ok) {
        fetchUsers();
        if (selectedUser?.id === userId) {
          fetchUserDetail(userId);
        }
      } else {
        console.error('Error unbanning user:', data.error);
      }
    } catch (error) {
      console.error('Error unbanning user:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, roleFilter, statusFilter, searchTerm]);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive"><Crown className="w-3 h-3 mr-1" />Admin</Badge>;
      case 'provider':
        return <Badge variant="default"><Shield className="w-3 h-3 mr-1" />Provider</Badge>;
      case 'customer':
        return <Badge variant="secondary"><UserCheck className="w-3 h-3 mr-1" />Customer</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusBadge = (user: User) => {
    if (user.banned) {
      const isExpired = user.banExpires && new Date(user.banExpires) < new Date();
      return (
        <Badge variant="destructive">
          <Ban className="w-3 h-3 mr-1" />
          {isExpired ? 'Ban Expired' : 'Banned'}
        </Badge>
      );
    }
    return <Badge variant="default" className="bg-green-100 text-green-800"><UserCheck className="w-3 h-3 mr-1" />Active</Badge>;
  };

  if (loading && users.length === 0) {
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
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-2">
          Manage platform users, assign roles, and moderate accounts.
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
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="customer">Customers</SelectItem>
                <SelectItem value="provider">Providers</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
          <CardDescription>
            Manage platform users and their account settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {user.phoneNumber && (
                        <div className="flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {user.phoneNumber}
                        </div>
                      )}
                      {user.address && (
                        <div className="flex items-center mt-1">
                          <MapPin className="w-3 h-3 mr-1" />
                          {user.address}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {getRoleBadge(user.role)}
                      {user.provider && (
                        <div className="text-xs text-gray-500">
                          {user.provider.isVerified ? (
                            <span className="text-green-600">Verified Provider</span>
                          ) : (
                            <span className="text-orange-600">Unverified Provider</span>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{user._count.bookings} bookings</div>
                      <div>{user._count.orders} orders</div>
                      <div>{user._count.reviews} reviews</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(user)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchUserDetail(user.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {!user.banned ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Ban User</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will ban {user.name} from the platform for 30 days. They will not be able to access their account.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => banUser(user.id, 'Banned by admin for policy violation')}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Ban User
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => unbanUser(user.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <UnlockKeyhole className="w-4 h-4" />
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

      {/* User Detail Dialog */}
      <Dialog open={showUserDetail} onOpenChange={setShowUserDetail}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Detailed information about the user and their activity
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name</label>
                      <p className="text-sm">{selectedUser.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-sm">{selectedUser.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-sm">{selectedUser.phoneNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Address</label>
                      <p className="text-sm">{selectedUser.address || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Member Since</label>
                      <p className="text-sm">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Account Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Role</label>
                      <div className="mt-1">{getRoleBadge(selectedUser.role)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <div className="mt-1">{getStatusBadge(selectedUser)}</div>
                    </div>
                    {selectedUser.banned && (
                      <>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Ban Reason</label>
                          <p className="text-sm">{selectedUser.banReason || 'No reason provided'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Ban Expires</label>
                          <p className="text-sm">
                            {selectedUser.banExpires 
                              ? new Date(selectedUser.banExpires).toLocaleDateString()
                              : 'Permanent'
                            }
                          </p>
                        </div>
                      </>
                    )}
                    {selectedUser.provider && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Provider Status</label>
                        <p className="text-sm">
                          {selectedUser.provider.isVerified ? (
                            <span className="text-green-600">Verified Provider</span>
                          ) : (
                            <span className="text-orange-600">Unverified Provider</span>
                          )}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Activity Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{selectedUser._count.bookings}</div>
                      <div className="text-sm text-gray-500">Total Bookings</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{selectedUser._count.orders}</div>
                      <div className="text-sm text-gray-500">Total Orders</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{selectedUser._count.reviews}</div>
                      <div className="text-sm text-gray-500">Reviews Written</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recent Bookings */}
                {selectedUser.bookings.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Recent Bookings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedUser.bookings.slice(0, 5).map((booking) => (
                          <div key={booking.id} className="border-b pb-2 last:border-b-0">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-sm">{booking.service?.name || 'Service'}</p>
                                <p className="text-xs text-gray-500">{booking.event?.name}</p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {booking.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(booking.startTime).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recent Issues */}
                {selectedUser.reportedIssues.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Reported Issues</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedUser.reportedIssues.map((issue) => (
                          <div key={issue.id} className="border-b pb-2 last:border-b-0">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-sm">{issue.title}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(issue.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex space-x-1">
                                <Badge variant="outline" className="text-xs">
                                  {issue.status}
                                </Badge>
                                <Badge 
                                  variant={issue.priority === 'HIGH' || issue.priority === 'CRITICAL' ? 'destructive' : 'secondary'} 
                                  className="text-xs"
                                >
                                  {issue.priority}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Select
                  value={selectedUser.role}
                  onValueChange={(role) => updateUserRole(selectedUser.id, role)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Change role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="provider">Provider</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>

                {!selectedUser.banned ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Ban className="w-4 h-4 mr-2" />
                        Ban User
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Ban User</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will ban {selectedUser.name} from the platform for 30 days. They will not be able to access their account.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => banUser(selectedUser.id, 'Banned by admin for policy violation')}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Ban User
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => unbanUser(selectedUser.id)}
                    className="text-green-600 hover:text-green-700"
                  >
                    <UnlockKeyhole className="w-4 h-4 mr-2" />
                    Unban User
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
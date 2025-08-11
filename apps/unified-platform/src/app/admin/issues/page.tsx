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
  Textarea,
} from '@mounasabet/ui';
import { 
  Search, 
  Filter, 
  Eye, 
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  User,
  DollarSign,
  Calendar,
  MessageSquare,
} from 'lucide-react';

interface Issue {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  reportedByUser: {
    id: string;
    name: string;
    email: string;
  } | null;
  assignedToUser: {
    id: string;
    name: string;
    email: string;
  } | null;
  order: {
    id: string;
    orderType: string;
    totalAmount: number;
  } | null;
}

interface IssueDetail extends Issue {
  reportedByUser: Issue['reportedByUser'] & {
    phoneNumber: string;
  };
  order: Issue['order'] & {
    user: {
      id: string;
      name: string;
      email: string;
    };
    items: Array<{
      name: string;
      quantity: number;
      unitPrice: number;
    }>;
  } | null;
}

export default function IssuesPage() {
  const { session } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<IssueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showIssueDetail, setShowIssueDetail] = useState(false);
  const [showCreateIssue, setShowCreateIssue] = useState(false);
  const [newIssue, setNewIssue] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
  });

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        status: statusFilter,
        priority: priorityFilter,
        search: searchTerm,
      });

      const response = await fetch(`/api/admin/issues?${params}`);
      const data = await response.json();

      if (response.ok) {
        setIssues(data.issues);
        setTotalPages(data.pagination.pages);
      } else {
        console.error('Error fetching issues:', data.error);
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIssueDetail = async (issueId: string) => {
    try {
      const response = await fetch(`/api/admin/issues/${issueId}`);
      const data = await response.json();

      if (response.ok) {
        setSelectedIssue(data.issue);
        setShowIssueDetail(true);
      } else {
        console.error('Error fetching issue detail:', data.error);
      }
    } catch (error) {
      console.error('Error fetching issue detail:', error);
    }
  };

  const updateIssueStatus = async (issueId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/issues/${issueId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (response.ok) {
        fetchIssues();
        if (selectedIssue?.id === issueId) {
          fetchIssueDetail(issueId);
        }
      } else {
        console.error('Error updating issue:', data.error);
      }
    } catch (error) {
      console.error('Error updating issue:', error);
    }
  };

  const updateIssuePriority = async (issueId: string, priority: string) => {
    try {
      const response = await fetch(`/api/admin/issues/${issueId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priority }),
      });

      const data = await response.json();

      if (response.ok) {
        fetchIssues();
        if (selectedIssue?.id === issueId) {
          fetchIssueDetail(issueId);
        }
      } else {
        console.error('Error updating issue priority:', data.error);
      }
    } catch (error) {
      console.error('Error updating issue priority:', error);
    }
  };

  const createIssue = async () => {
    try {
      const response = await fetch('/api/admin/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newIssue),
      });

      const data = await response.json();

      if (response.ok) {
        setShowCreateIssue(false);
        setNewIssue({ title: '', description: '', priority: 'MEDIUM' });
        fetchIssues();
      } else {
        console.error('Error creating issue:', data.error);
      }
    } catch (error) {
      console.error('Error creating issue:', error);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [currentPage, statusFilter, priorityFilter, searchTerm]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Open</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="default" className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      case 'RESOLVED':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Resolved</Badge>;
      case 'CLOSED':
        return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return <Badge variant="destructive">Critical</Badge>;
      case 'HIGH':
        return <Badge variant="destructive" className="bg-orange-100 text-orange-800">High</Badge>;
      case 'MEDIUM':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'LOW':
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  if (loading && issues.length === 0) {
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Issue Management</h1>
            <p className="text-gray-600 mt-2">
              Track and resolve customer issues and disputes.
            </p>
          </div>
          <Dialog open={showCreateIssue} onOpenChange={setShowCreateIssue}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Issue
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Issue</DialogTitle>
                <DialogDescription>
                  Create a new issue to track and resolve platform problems.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={newIssue.title}
                    onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
                    placeholder="Brief description of the issue"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={newIssue.description}
                    onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                    placeholder="Detailed description of the issue"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select
                    value={newIssue.priority}
                    onValueChange={(priority) => setNewIssue({ ...newIssue, priority })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateIssue(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createIssue} disabled={!newIssue.title || !newIssue.description}>
                    Create Issue
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search issues by title or description..."
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
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Issues Table */}
      <Card>
        <CardHeader>
          <CardTitle>Issues ({issues.length})</CardTitle>
          <CardDescription>
            Track and resolve customer issues and platform disputes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Issue</TableHead>
                <TableHead>Reporter</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {issues.map((issue) => (
                <TableRow key={issue.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{issue.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {issue.description}
                      </div>
                      {issue.order && (
                        <div className="text-xs text-blue-600 mt-1">
                          Order #{issue.order.id.slice(-8)} - ${issue.order.totalAmount}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {issue.reportedByUser ? (
                      <div className="text-sm">
                        <div className="font-medium">{issue.reportedByUser.name}</div>
                        <div className="text-gray-500">{issue.reportedByUser.email}</div>
                      </div>
                    ) : (
                      <span className="text-gray-500">System</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {getPriorityBadge(issue.priority)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(issue.status)}
                  </TableCell>
                  <TableCell>
                    {issue.assignedToUser ? (
                      <div className="text-sm">
                        <div className="font-medium">{issue.assignedToUser.name}</div>
                      </div>
                    ) : (
                      <span className="text-gray-500">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500">
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchIssueDetail(issue.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {issue.status === 'OPEN' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateIssueStatus(issue.id, 'IN_PROGRESS')}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Clock className="w-4 h-4" />
                        </Button>
                      )}
                      {(issue.status === 'OPEN' || issue.status === 'IN_PROGRESS') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateIssueStatus(issue.id, 'RESOLVED')}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="w-4 h-4" />
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

      {/* Issue Detail Dialog */}
      <Dialog open={showIssueDetail} onOpenChange={setShowIssueDetail}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Issue Details</DialogTitle>
            <DialogDescription>
              Detailed information about the issue and resolution progress
            </DialogDescription>
          </DialogHeader>
          
          {selectedIssue && (
            <div className="space-y-6">
              {/* Issue Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Issue Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Title</label>
                      <p className="text-sm font-medium">{selectedIssue.title}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Description</label>
                      <p className="text-sm">{selectedIssue.description}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Priority</label>
                      <div className="mt-1">{getPriorityBadge(selectedIssue.priority)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <div className="mt-1">{getStatusBadge(selectedIssue.status)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Created</label>
                      <p className="text-sm">{new Date(selectedIssue.createdAt).toLocaleString()}</p>
                    </div>
                    {selectedIssue.resolvedAt && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Resolved</label>
                        <p className="text-sm">{new Date(selectedIssue.resolvedAt).toLocaleString()}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">People Involved</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Reported By</label>
                      {selectedIssue.reportedByUser ? (
                        <div className="text-sm">
                          <p className="font-medium">{selectedIssue.reportedByUser.name}</p>
                          <p className="text-gray-500">{selectedIssue.reportedByUser.email}</p>
                          {selectedIssue.reportedByUser.phoneNumber && (
                            <p className="text-gray-500">{selectedIssue.reportedByUser.phoneNumber}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">System Generated</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Assigned To</label>
                      {selectedIssue.assignedToUser ? (
                        <div className="text-sm">
                          <p className="font-medium">{selectedIssue.assignedToUser.name}</p>
                          <p className="text-gray-500">{selectedIssue.assignedToUser.email}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Unassigned</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Related Order */}
              {selectedIssue.order && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Related Order</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Order ID</label>
                        <p className="text-sm font-mono">{selectedIssue.order.id}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Order Type</label>
                        <p className="text-sm">{selectedIssue.order.orderType}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Total Amount</label>
                        <p className="text-sm font-medium">${selectedIssue.order.totalAmount}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Customer</label>
                        <p className="text-sm">{selectedIssue.order.user.name}</p>
                      </div>
                    </div>
                    {selectedIssue.order.items.length > 0 && (
                      <div className="mt-4">
                        <label className="text-sm font-medium text-gray-500">Order Items</label>
                        <div className="mt-2 space-y-2">
                          {selectedIssue.order.items.map((item, index) => (
                            <div key={index} className="flex justify-between items-center text-sm border-b pb-1">
                              <span>{item.name} (x{item.quantity})</span>
                              <span>${item.unitPrice * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Select
                  value={selectedIssue.priority}
                  onValueChange={(priority) => updateIssuePriority(selectedIssue.id, priority)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={selectedIssue.status}
                  onValueChange={(status) => updateIssueStatus(selectedIssue.id, status)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
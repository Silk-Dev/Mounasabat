'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui';
import { Button } from '../ui';
import { Badge } from '../ui';
import { Alert, AlertDescription } from '../ui';
import { Separator } from '../ui';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  CreditCard,
  FileText,
  Truck,
  Calendar
} from 'lucide-react';

interface OrderTrackingProps {
  orderId: string;
  onRefund?: (orderId: string) => void;
  onCancel?: (orderId: string) => void;
}

interface OrderDetails {
  id: string;
  status: string;
  orderType: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    description?: string;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    status: string;
    paymentMethod?: string;
    createdAt: string;
    stripePaymentId?: string;
  }>;
  tracking: Array<{
    id: string;
    status: string;
    description?: string;
    timestamp: string;
    updatedBy?: string;
  }>;
  event?: {
    id: string;
    name: string;
    type: string;
    startDate?: string;
  };
  package?: {
    id: string;
    name: string;
    provider: {
      id: string;
      name: string;
    };
  };
  issues: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
  }>;
  summary: {
    totalAmount: number;
    totalPaid: number;
    totalRefunded: number;
    balance: number;
    itemCount: number;
    hasActiveIssues: boolean;
    latestStatus: string;
    latestUpdate: string;
  };
}

export function OrderTracking({ orderId, onRefund, onCancel }: OrderTrackingProps) {
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/orders/${orderId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch order details');
      }

      setOrder(data.order);
    } catch (error) {
      console.error('Error fetching order details:', error);
      setError(error instanceof Error ? error.message : 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrderDetails();
    setRefreshing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'confirmed':
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Truck className="w-4 h-4 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'cancelled':
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'refunded':
        return <RefreshCw className="w-4 h-4 text-orange-600" />;
      default:
        return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'refunded':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!order) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Order not found
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Order Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order #{order.id.slice(-8).toUpperCase()}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Created on {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(order.status)}>
                {getStatusIcon(order.status)}
                <span className="ml-1">{order.status.replace('_', ' ').toUpperCase()}</span>
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium text-gray-900">Customer</h4>
              <p className="text-sm text-gray-600">{order.user.name}</p>
              <p className="text-sm text-gray-600">{order.user.email}</p>
            </div>
            {order.event && (
              <div>
                <h4 className="font-medium text-gray-900">Event</h4>
                <p className="text-sm text-gray-600">{order.event.name}</p>
                <p className="text-sm text-gray-600">{order.event.type}</p>
                {order.event.startDate && (
                  <p className="text-sm text-gray-600">
                    {new Date(order.event.startDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
            {order.package && (
              <div>
                <h4 className="font-medium text-gray-900">Provider</h4>
                <p className="text-sm text-gray-600">{order.package.provider.name}</p>
                <p className="text-sm text-gray-600">{order.package.name}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Financial Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Total Amount</span>
              <span className="font-medium">${order.summary.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Paid</span>
              <span className="font-medium text-green-600">${order.summary.totalPaid.toFixed(2)}</span>
            </div>
            {order.summary.totalRefunded > 0 && (
              <div className="flex justify-between">
                <span>Total Refunded</span>
                <span className="font-medium text-orange-600">${order.summary.totalRefunded.toFixed(2)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Balance</span>
              <span className={order.summary.balance > 0 ? 'text-red-600' : 'text-green-600'}>
                ${Math.abs(order.summary.balance).toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Order Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium">{item.name}</h4>
                  {item.description && (
                    <p className="text-sm text-gray-600">{item.description}</p>
                  )}
                  <p className="text-sm text-gray-600">
                    Quantity: {item.quantity} × ${item.unitPrice.toFixed(2)}
                  </p>
                </div>
                <span className="font-medium">${item.totalPrice.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Order Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Order Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.tracking.map((entry, index) => (
              <div key={entry.id} className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {getStatusIcon(entry.status)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{entry.status.replace('_', ' ').toUpperCase()}</h4>
                    <span className="text-sm text-gray-500">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {entry.description && (
                    <p className="text-sm text-gray-600 mt-1">{entry.description}</p>
                  )}
                  {entry.updatedBy && (
                    <p className="text-xs text-gray-500 mt-1">Updated by: {entry.updatedBy}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      {order.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.payments.map((payment) => (
                <div key={payment.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(payment.status)}>
                        {payment.status.toUpperCase()}
                      </Badge>
                      {payment.paymentMethod && (
                        <span className="text-sm text-gray-600">
                          via {payment.paymentMethod}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(payment.createdAt).toLocaleString()}
                    </p>
                    {payment.stripePaymentId && (
                      <p className="text-xs text-gray-500 mt-1">
                        ID: {payment.stripePaymentId}
                      </p>
                    )}
                  </div>
                  <span className="font-medium">${payment.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Issues */}
      {order.issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Active Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.issues.map((issue) => (
                <div key={issue.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <h4 className="font-medium text-red-900">{issue.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {issue.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {issue.priority} Priority
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && onCancel && (
              <Button
                variant="outline"
                onClick={() => onCancel(order.id)}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel Order
              </Button>
            )}
            {order.summary.totalPaid > 0 && order.status !== 'REFUNDED' && onRefund && (
              <Button
                variant="outline"
                onClick={() => onRefund(order.id)}
                className="text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Request Refund
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => window.open(`/api/orders/${order.id}/invoice`, '_blank')}
            >
              <FileText className="w-4 h-4 mr-2" />
              View Invoice
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
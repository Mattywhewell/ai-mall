'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import Link from 'next/link';
import { 
  Package, Truck, CheckCircle, MapPin, Calendar, Clock,
  ChevronRight, Download, MessageCircle, RotateCcw
} from 'lucide-react';

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

type OrderItem = {
  id: string;
  product_name: string;
  product_image: string;
  quantity: number;
  price: number;
};

type Order = {
  id: string;
  order_number: string;
  status: OrderStatus;
  created_at: string;
  total_amount: number;
  shipping_address: any;
  tracking_number?: string;
  estimated_delivery?: string;
  items: OrderItem[];
};

const statusSteps: { status: OrderStatus; label: string; icon: any }[] = [
  { status: 'pending', label: 'Order Placed', icon: Package },
  { status: 'processing', label: 'Processing', icon: Clock },
  { status: 'shipped', label: 'Shipped', icon: Truck },
  { status: 'delivered', label: 'Delivered', icon: CheckCircle },
];

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = (params?.id as string) || '';
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      // Fetch order
      const { data: orderData, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;

      // Mock complete order data
      const mockOrder: Order = {
        id: orderData.id,
        order_number: `AIV-${orderData.id.slice(0, 8).toUpperCase()}`,
        status: orderData.status || 'processing',
        created_at: orderData.created_at,
        total_amount: orderData.total_amount,
        shipping_address: orderData.shipping_address,
        tracking_number: 'TRK123456789',
        estimated_delivery: '2026-01-10',
        items: [
          {
            id: '1',
            product_name: 'Wireless Headphones',
            product_image: '/placeholder.png',
            quantity: 1,
            price: 79.99,
          },
          {
            id: '2',
            product_name: 'USB-C Cable',
            product_image: '/placeholder.png',
            quantity: 2,
            price: 12.99,
          },
        ],
      };

      setOrder(mockOrder);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    return statusSteps.findIndex(step => step.status === order.status);
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'shipped':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'cancelled':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-purple-600 bg-purple-50 border-purple-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
          <Link href="/profile?tab=orders" className="text-purple-600 hover:text-purple-700">
            View All Orders
          </Link>
        </div>
      </div>
    );
  }

  const currentStep = getCurrentStepIndex();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/profile?tab=orders"
            className="text-purple-600 hover:text-purple-700 flex items-center space-x-1 mb-4"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            <span>Back to Orders</span>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Details</h1>
              <p className="text-gray-600">Order #{order.order_number}</p>
            </div>
            <span className={`px-4 py-2 rounded-full border-2 font-medium capitalize ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
          </div>
        </div>

        {/* Order Timeline */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Order Status</h2>
          
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-8 left-0 right-0 h-1 bg-gray-200">
              <div
                className="h-full bg-purple-600 transition-all duration-500"
                style={{ width: `${(currentStep / (statusSteps.length - 1)) * 100}%` }}
              />
            </div>

            {/* Steps */}
            <div className="relative flex justify-between">
              {statusSteps.map((step, index) => {
                const IconComponent = step.icon;
                const isCompleted = index <= currentStep;
                const isCurrent = index === currentStep;

                return (
                  <div key={step.status} className="flex flex-col items-center">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 transition-colors ${
                        isCompleted
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-200 text-gray-400'
                      } ${isCurrent ? 'ring-4 ring-purple-200' : ''}`}
                    >
                      <IconComponent className="w-8 h-8" />
                    </div>
                    <span
                      className={`text-sm font-medium text-center ${
                        isCompleted ? 'text-gray-900' : 'text-gray-500'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tracking Info */}
          {order.tracking_number && order.status === 'shipped' && (
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tracking Number</p>
                  <p className="font-bold text-gray-900">{order.tracking_number}</p>
                </div>
                <a
                  href={`https://tracking.example.com/${order.tracking_number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Track Package
                </a>
              </div>
            </div>
          )}

          {/* Estimated Delivery */}
          {order.estimated_delivery && order.status !== 'delivered' && (
            <div className="mt-4 flex items-center space-x-2 text-gray-600">
              <Calendar className="w-5 h-5" />
              <span>Estimated delivery: {new Date(order.estimated_delivery).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Items in Order</h2>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center space-x-4 pb-4 border-b last:border-0">
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{item.product_name}</h3>
                  <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                </div>
                <span className="font-bold text-gray-900">${item.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <div className="flex justify-between items-center text-lg">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-bold text-purple-600">${order.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Shipping Address
          </h2>
          {order.shipping_address && (
            <div className="text-gray-700">
              <p>{order.shipping_address.address}</p>
              <p>{order.shipping_address.city}, {order.shipping_address.postalCode}</p>
              <p>{order.shipping_address.country}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center space-x-2 px-6 py-3 bg-white border border-gray-300 rounded-lg hover:border-purple-500 hover:text-purple-600 transition-colors">
            <Download className="w-5 h-5" />
            <span>Download Invoice</span>
          </button>
          <button className="flex items-center justify-center space-x-2 px-6 py-3 bg-white border border-gray-300 rounded-lg hover:border-purple-500 hover:text-purple-600 transition-colors">
            <MessageCircle className="w-5 h-5" />
            <span>Contact Support</span>
          </button>
          {order.status === 'delivered' && (
            <button className="flex items-center justify-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              <RotateCcw className="w-5 h-5" />
              <span>Reorder</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

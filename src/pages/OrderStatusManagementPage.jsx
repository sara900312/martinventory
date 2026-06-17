import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  ChevronDown,
  CheckCircle2,
  ArrowLeft,
  Search,
  Filter,
  Loader,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSupabase } from '@/contexts/SupabaseContext';
import { toast } from '@/components/ui/use-toast';
import {
  ORDER_STATUS_TYPES,
  STATUS_PROGRESSION,
  getOrderStatusLabel,
  getOrderStatusColors,
  getOrderStatusDescription,
} from '@/lib/orderStatusConstants';
import { updateOrderStatus as updateOrderStatusViaEdgeFunction } from '@/lib/updateOrderStatusService';

const OrderStatusManagementPage = () => {
  const navigate = useNavigate();
  const { supabase } = useSupabase();

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  // Fetch all orders
  useEffect(() => {
    fetchAllOrders();
  }, []);

  const fetchAllOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_code,
          order_status,
          customer_name,
          customer_phone,
          total_amount,
          created_at,
          updated_at,
          main_store_name,
          order_items(id, product_name, quantity, price)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل الطلبات',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    try {
      // Call the Edge Function which handles:
      // 1. Order status update
      // 2. Automatic inventory stock management
      const updatedOrder = await updateOrderStatusViaEdgeFunction(
        orderId,
        newStatus
      );

      // Update local state with response from Edge Function
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId
            ? { ...order, order_status: updatedOrder.order_status, updated_at: updatedOrder.updated_at }
            : order
        )
      );

      toast({
        title: 'نجح',
        description: `تم تحديث حالة الطلب إلى ${getOrderStatusLabel(newStatus)}. تم تحديث المخزون تلقائياً.`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في تحديث حالة الطلب',
        variant: 'destructive',
      });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.order_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_phone.includes(searchQuery);

    const matchesStatus = !filterStatus || order.order_status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Group orders by status
  const ordersByStatus = STATUS_PROGRESSION.reduce((acc, status) => {
    acc[status] = filteredOrders.filter(o => o.order_status === status);
    return acc;
  }, {});

  const cancelledOrders = filteredOrders.filter(
    o => o.order_status === ORDER_STATUS_TYPES.CANCELLED
  );
  ordersByStatus[ORDER_STATUS_TYPES.CANCELLED] = cancelledOrders;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1 py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <Button
                onClick={() => navigate('/inventory')}
                variant="outline"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                العودة للمخزن
              </Button>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                  <CheckCircle2 className="w-10 h-10 text-pink-600" />
                  إدارة حالات الطلبات
                </h1>
                <p className="text-lg text-gray-600">
                  تتبع وإدارة حالات جميع الطلبات في النظام
                </p>
              </div>

              <div className="text-right">
                <p className="text-3xl font-bold text-pink-600">
                  {filteredOrders.length}
                </p>
                <p className="text-sm text-gray-600">إجمالي الطلبات</p>
              </div>
            </div>
          </motion.div>

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow p-6 mb-8"
          >
            <div className="grid md:grid-cols-2 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="ابحث برقم الطلب أو اسم العميل أو الهاتف..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 appearance-none bg-white"
                >
                  <option value="">جميع الحالات</option>
                  {STATUS_PROGRESSION.map(status => (
                    <option key={status} value={status}>
                      {getOrderStatusLabel(status)}
                    </option>
                  ))}
                  <option value={ORDER_STATUS_TYPES.CANCELLED}>
                    {getOrderStatusLabel(ORDER_STATUS_TYPES.CANCELLED)}
                  </option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Loading State */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center items-center py-20"
            >
              <div className="text-center">
                <Loader className="w-12 h-12 animate-spin text-pink-500 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">جاري تحميل الطلبات...</p>
              </div>
            </motion.div>
          )}

          {/* Orders List */}
          {!isLoading && filteredOrders.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {filteredOrders.map((order, index) => {
                const statusColors = getOrderStatusColors(order.order_status);
                const canProgress =
                  order.order_status !== ORDER_STATUS_TYPES.DELIVERED &&
                  order.order_status !== ORDER_STATUS_TYPES.CANCELLED;

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
                  >
                    {/* Order Header */}
                    <button
                      onClick={() =>
                        setExpandedOrderId(
                          expandedOrderId === order.id ? null : order.id
                        )
                      }
                      className="w-full text-left p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <Package className="w-5 h-5 text-pink-600" />
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                الطلب: {order.order_code}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {order.customer_name} • {order.customer_phone}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mr-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              statusColors.badgeColor
                            }`}
                          >
                            {getOrderStatusLabel(order.order_status)}
                          </span>

                          <ChevronDown
                            className={`w-5 h-5 text-gray-400 transition-transform ${
                              expandedOrderId === order.id ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </div>
                    </button>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {expandedOrderId === order.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-gray-200 px-6 py-6 bg-gray-50"
                        >
                          {/* Order Items */}
                          {order.order_items && order.order_items.length > 0 && (
                            <div className="mb-6">
                              <h4 className="font-semibold text-gray-900 mb-3">
                                المنتجات ({order.order_items.length})
                              </h4>
                              <div className="space-y-2">
                                {order.order_items.map(item => (
                                  <div
                                    key={item.id}
                                    className="flex justify-between items-center p-2 bg-white rounded border border-gray-200"
                                  >
                                    <div>
                                      <p className="font-medium text-gray-900">
                                        {item.product_name}
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        الكمية: {item.quantity}
                                      </p>
                                    </div>
                                    <p className="font-semibold text-gray-900">
                                      {(item.price * item.quantity).toLocaleString(
                                        'ar-IQ'
                                      )}{' '}
                                      د.ع
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Order Info */}
                          <div className="grid md:grid-cols-2 gap-4 mb-6">
                            <div>
                              <p className="text-sm text-gray-600 mb-1">
                                المتجر الرئيسي
                              </p>
                              <p className="font-semibold text-gray-900">
                                {order.main_store_name || 'غير محدد'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">
                                المبلغ الإجمالي
                              </p>
                              <p className="font-semibold text-gray-900 text-lg text-pink-600">
                                {order.total_amount.toLocaleString('ar-IQ')} د.ع
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">
                                تاريخ الإنشاء
                              </p>
                              <p className="font-semibold text-gray-900">
                                {new Date(order.created_at).toLocaleDateString(
                                  'ar-IQ'
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">
                                آخر تحديث
                              </p>
                              <p className="font-semibold text-gray-900">
                                {new Date(order.updated_at).toLocaleDateString(
                                  'ar-IQ'
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Status Update Section */}
                          <div className="border-t border-gray-200 pt-6">
                            <h4 className="font-semibold text-gray-900 mb-4">
                              تحديث حالة الطلب
                            </h4>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {STATUS_PROGRESSION.map(status => (
                                <button
                                  key={status}
                                  onClick={() => updateOrderStatus(order.id, status)}
                                  disabled={
                                    updatingOrderId === order.id ||
                                    order.order_status === status
                                  }
                                  className={`p-3 rounded-lg border-2 transition-all text-sm font-semibold ${
                                    order.order_status === status
                                      ? `${statusColors.bgColor} ${
                                          statusColors.borderColor
                                        } border-2`
                                      : 'border-gray-300 hover:border-pink-300 bg-white'
                                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                  {updatingOrderId === order.id ? (
                                    <Loader className="w-4 h-4 animate-spin mx-auto" />
                                  ) : (
                                    getOrderStatusLabel(status)
                                  )}
                                </button>
                              ))}

                              {/* Cancel Status */}
                              <button
                                onClick={() =>
                                  updateOrderStatus(
                                    order.id,
                                    ORDER_STATUS_TYPES.CANCELLED
                                  )
                                }
                                disabled={
                                  updatingOrderId === order.id ||
                                  order.order_status === ORDER_STATUS_TYPES.CANCELLED
                                }
                                className={`p-3 rounded-lg border-2 transition-all text-sm font-semibold ${
                                  order.order_status === ORDER_STATUS_TYPES.CANCELLED
                                    ? 'bg-red-50 border-red-300 border-2'
                                    : 'border-gray-300 hover:border-red-300 bg-white'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                              >
                                {updatingOrderId === order.id ? (
                                  <Loader className="w-4 h-4 animate-spin mx-auto" />
                                ) : (
                                  getOrderStatusLabel(
                                    ORDER_STATUS_TYPES.CANCELLED
                                  )
                                )}
                              </button>
                            </div>

                            {/* Status Description */}
                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-sm text-blue-800">
                                <span className="font-semibold">
                                  {getOrderStatusLabel(order.order_status)}:
                                </span>{' '}
                                {getOrderStatusDescription(order.order_status)}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* Empty State */}
          {!isLoading && filteredOrders.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <Package className="w-24 h-24 mx-auto mb-6 text-gray-300" />
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                لا توجد طلبات
              </h2>
              <p className="text-gray-600">
                {searchQuery || filterStatus
                  ? 'لم يتم العثور على طلبات تطابق معايير البحث'
                  : 'لا توجد طلبات في النظام حالياً'}
              </p>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default OrderStatusManagementPage;

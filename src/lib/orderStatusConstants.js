/**
 * Unified Order Status System
 * Central definition for all order statuses used throughout the application
 */

// Type definition for OrderStatus
export const ORDER_STATUS_TYPES = {
  PENDING: 'pending',         // تم الاستلام
  REVIEWING: 'reviewing',     // قيد المراجعة
  ACCEPTED: 'accepted',       // مقبول من المتجر
  PREPARING: 'preparing',     // جاري التجهيز
  SHIPPED: 'shipped',         // تم الشحن
  DELIVERED: 'delivered',     // تم التسليم
  CANCELLED: 'cancelled',     // ملغي
};

// List of all valid statuses
export const VALID_ORDER_STATUSES = Object.values(ORDER_STATUS_TYPES);

// Status progression order for stepper display
export const STATUS_PROGRESSION = [
  ORDER_STATUS_TYPES.PENDING,
  ORDER_STATUS_TYPES.REVIEWING,
  ORDER_STATUS_TYPES.ACCEPTED,
  ORDER_STATUS_TYPES.PREPARING,
  ORDER_STATUS_TYPES.SHIPPED,
  ORDER_STATUS_TYPES.DELIVERED,
];

// Status labels in Arabic
export const STATUS_LABELS_AR = {
  [ORDER_STATUS_TYPES.PENDING]: 'تم استقبال الطلب',
  [ORDER_STATUS_TYPES.REVIEWING]: 'قيد المراجعة',
  [ORDER_STATUS_TYPES.ACCEPTED]: 'تم القبول',
  [ORDER_STATUS_TYPES.PREPARING]: 'قيد التحضير',
  [ORDER_STATUS_TYPES.SHIPPED]: 'تم الشحن',
  [ORDER_STATUS_TYPES.DELIVERED]: 'تم التسليم',
  [ORDER_STATUS_TYPES.CANCELLED]: 'تم الإلغاء',
};

// Status descriptions in Arabic
export const STATUS_DESCRIPTIONS_AR = {
  [ORDER_STATUS_TYPES.PENDING]: 'تم استقبال طلبك بنجاح',
  [ORDER_STATUS_TYPES.REVIEWING]: 'نحن نراجع طلبك',
  [ORDER_STATUS_TYPES.ACCEPTED]: 'تم قبول طلبك من قبل المتجر',
  [ORDER_STATUS_TYPES.PREPARING]: 'جاري تحضير طلبك',
  [ORDER_STATUS_TYPES.SHIPPED]: 'تم شحن طلبك',
  [ORDER_STATUS_TYPES.DELIVERED]: 'تم تسليم طلبك بنجاح',
  [ORDER_STATUS_TYPES.CANCELLED]: 'تم إلغاء طلبك',
};

// Status colors for UI display
export const STATUS_COLORS = {
  [ORDER_STATUS_TYPES.PENDING]: {
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-800',
    badgeColor: 'bg-yellow-100 text-yellow-800',
    borderColor: 'border-yellow-300',
    dotColor: 'text-yellow-500',
  },
  [ORDER_STATUS_TYPES.REVIEWING]: {
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-800',
    badgeColor: 'bg-blue-100 text-blue-800',
    borderColor: 'border-blue-300',
    dotColor: 'text-blue-500',
  },
  [ORDER_STATUS_TYPES.ACCEPTED]: {
    bgColor: 'bg-green-50',
    textColor: 'text-green-800',
    badgeColor: 'bg-green-100 text-green-800',
    borderColor: 'border-green-300',
    dotColor: 'text-green-500',
  },
  [ORDER_STATUS_TYPES.PREPARING]: {
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-800',
    badgeColor: 'bg-orange-100 text-orange-800',
    borderColor: 'border-orange-300',
    dotColor: 'text-orange-500',
  },
  [ORDER_STATUS_TYPES.SHIPPED]: {
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-800',
    badgeColor: 'bg-purple-100 text-purple-800',
    borderColor: 'border-purple-300',
    dotColor: 'text-purple-500',
  },
  [ORDER_STATUS_TYPES.DELIVERED]: {
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-800',
    badgeColor: 'bg-emerald-100 text-emerald-800',
    borderColor: 'border-emerald-300',
    dotColor: 'text-emerald-500',
  },
  [ORDER_STATUS_TYPES.CANCELLED]: {
    bgColor: 'bg-red-50',
    textColor: 'text-red-800',
    badgeColor: 'bg-red-100 text-red-800',
    borderColor: 'border-red-300',
    dotColor: 'text-red-500',
  },
};

/**
 * Get Arabic label for order status
 * @param {string} status - Order status
 * @returns {string} - Arabic label
 */
export const getOrderStatusLabel = (status) => {
  return STATUS_LABELS_AR[status] || status;
};

/**
 * Get description for order status
 * @param {string} status - Order status
 * @returns {string} - Description in Arabic
 */
export const getOrderStatusDescription = (status) => {
  return STATUS_DESCRIPTIONS_AR[status] || '';
};

/**
 * Get colors for order status
 * @param {string} status - Order status
 * @returns {object} - Color configuration object
 */
export const getOrderStatusColors = (status) => {
  return STATUS_COLORS[status] || STATUS_COLORS[ORDER_STATUS_TYPES.PENDING];
};

/**
 * Check if a status is valid
 * @param {string} status - Status to validate
 * @returns {boolean} - True if status is valid
 */
export const isValidOrderStatus = (status) => {
  return VALID_ORDER_STATUSES.includes(status);
};

/**
 * Check if an order can be cancelled based on its current status
 * @param {string} status - Order status
 * @returns {boolean} - True if order can be cancelled
 */
export const canCancelOrderByStatus = (status) => {
  return status === ORDER_STATUS_TYPES.PENDING;
};

/**
 * Get the next status in the progression
 * @param {string} currentStatus - Current order status
 * @returns {string|null} - Next status or null if at the end
 */
export const getNextStatus = (currentStatus) => {
  const currentIndex = STATUS_PROGRESSION.indexOf(currentStatus);
  if (currentIndex === -1 || currentIndex === STATUS_PROGRESSION.length - 1) {
    return null;
  }
  return STATUS_PROGRESSION[currentIndex + 1];
};

export default {
  ORDER_STATUS_TYPES,
  VALID_ORDER_STATUSES,
  STATUS_PROGRESSION,
  STATUS_LABELS_AR,
  STATUS_DESCRIPTIONS_AR,
  STATUS_COLORS,
  getOrderStatusLabel,
  getOrderStatusDescription,
  getOrderStatusColors,
  isValidOrderStatus,
  canCancelOrderByStatus,
  getNextStatus,
};

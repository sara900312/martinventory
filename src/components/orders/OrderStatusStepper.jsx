import React from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  CheckCircle,
  Truck,
  Home,
  Clock,
  XCircle,
  FileText,
} from 'lucide-react';
import {
  ORDER_STATUS_TYPES,
  STATUS_PROGRESSION,
  STATUS_LABELS_AR,
  STATUS_DESCRIPTIONS_AR,
} from '@/lib/orderStatusConstants';

const STATUS_ICONS = {
  [ORDER_STATUS_TYPES.PENDING]: Package,
  [ORDER_STATUS_TYPES.REVIEWING]: FileText,
  [ORDER_STATUS_TYPES.ACCEPTED]: CheckCircle,
  [ORDER_STATUS_TYPES.PREPARING]: Clock,
  [ORDER_STATUS_TYPES.SHIPPED]: Truck,
  [ORDER_STATUS_TYPES.DELIVERED]: Home,
  [ORDER_STATUS_TYPES.CANCELLED]: XCircle,
};

const STATUS_COLORS = {
  [ORDER_STATUS_TYPES.PENDING]: {
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-300',
  },
  [ORDER_STATUS_TYPES.REVIEWING]: {
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
  },
  [ORDER_STATUS_TYPES.ACCEPTED]: {
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
  },
  [ORDER_STATUS_TYPES.PREPARING]: {
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
  },
  [ORDER_STATUS_TYPES.SHIPPED]: {
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
  },
  [ORDER_STATUS_TYPES.DELIVERED]: {
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-300',
  },
  [ORDER_STATUS_TYPES.CANCELLED]: {
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
  },
};

const getStatusInfo = (status) => {
  const color = STATUS_COLORS[status] || STATUS_COLORS[ORDER_STATUS_TYPES.PENDING];
  return {
    icon: STATUS_ICONS[status],
    label: STATUS_LABELS_AR[status] || status,
    description: STATUS_DESCRIPTIONS_AR[status] || '',
    ...color,
  };
};

export const OrderStatusStepper = ({ currentStatus = 'pending', showDescription = true }) => {
  const getStatusIndex = (status) => {
    if (status === ORDER_STATUS_TYPES.CANCELLED) return -1;
    return STATUS_PROGRESSION.indexOf(status);
  };

  const currentIndex = getStatusIndex(currentStatus);
  const isCancelled = currentStatus === ORDER_STATUS_TYPES.CANCELLED;
  const statusInfo = getStatusInfo(currentStatus);

  if (!statusInfo) {
    return <div className="text-red-500">حالة غير معروفة: {currentStatus}</div>;
  }

  return (
    <div className="w-full">
      {/* Mobile View - Vertical Timeline */}
      <div className="md:hidden">
        <div className="space-y-4">
          {isCancelled ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg border-2 ${statusInfo.bgColor} ${statusInfo.borderColor}`}
            >
              <div className="flex items-center gap-3">
                <statusInfo.icon className={`w-6 h-6 ${statusInfo.color}`} />
                <div>
                  <p className="font-bold text-gray-900">{statusInfo.label}</p>
                  <p className="text-sm text-gray-600">{statusInfo.description}</p>
                </div>
              </div>
            </motion.div>
          ) : (
            STATUS_PROGRESSION.map((status, idx) => {
              const info = getStatusInfo(status);
              const isCompleted = idx < currentIndex;
              const isActive = idx === currentIndex;
              const Icon = info.icon;

              return (
                <motion.div
                  key={status}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="relative"
                >
                  {/* Connector line */}
                  {idx < STATUS_PROGRESSION.length - 1 && (
                    <div
                      className={`absolute right-5 top-10 h-6 w-1 transition-colors duration-300 ${
                        isCompleted || isActive ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}

                  {/* Step item */}
                  <div
                    className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                      isActive
                        ? `${info.bgColor} ${info.borderColor} shadow-md`
                        : isCompleted
                        ? 'bg-green-50 border-green-300'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-6 h-6 flex-shrink-0 transition-colors ${
                          isActive || isCompleted
                            ? isCompleted
                              ? 'text-green-500'
                              : info.color
                            : 'text-gray-300'
                        }`}
                      />
                      <div className="flex-1">
                        <p
                          className={`font-semibold text-sm transition-colors ${
                            isActive || isCompleted
                              ? 'text-gray-900'
                              : 'text-gray-500'
                          }`}
                        >
                          {info.label}
                        </p>
                        {isActive && (
                          <p className="text-xs text-gray-600 mt-1">
                            {info.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Desktop View - Horizontal Timeline */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between">
          {isCancelled ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`w-full p-6 rounded-xl border-2 ${statusInfo.bgColor} ${statusInfo.borderColor}`}
            >
              <div className="flex items-center gap-4">
                <statusInfo.icon className={`w-8 h-8 flex-shrink-0 ${statusInfo.color}`} />
                <div>
                  <p className="font-bold text-lg text-gray-900">
                    {statusInfo.label}
                  </p>
                  {showDescription && (
                    <p className="text-sm text-gray-600 mt-1">
                      {statusInfo.description}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex items-center w-full gap-2">
              {STATUS_PROGRESSION.map((status, idx) => {
                const info = getStatusInfo(status);
                const isCompleted = idx < currentIndex;
                const isActive = idx === currentIndex;
                const Icon = info.icon;

                return (
                  <React.Fragment key={status}>
                    {/* Step Circle */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex flex-col items-center flex-1"
                    >
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                          isActive
                            ? `${info.bgColor} ${info.borderColor} shadow-lg`
                            : isCompleted
                            ? 'bg-green-50 border-green-300 shadow-sm'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <Icon
                          className={`w-6 h-6 transition-colors ${
                            isActive || isCompleted
                              ? isCompleted
                                ? 'text-green-500'
                                : info.color
                              : 'text-gray-300'
                          }`}
                        />
                      </div>
                      {isActive && (
                        <motion.p
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs font-semibold text-gray-700 mt-2 text-center"
                        >
                          {info.label}
                        </motion.p>
                      )}
                    </motion.div>

                    {/* Connector Line */}
                    {idx < STATUS_PROGRESSION.length - 1 && (
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: (idx + 0.5) * 0.1 }}
                        className="flex-1 h-1 bg-gray-200 mx-1 origin-left"
                        style={{
                          backgroundColor:
                            isCompleted || isActive ? '#10b981' : '#e5e7eb',
                        }}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        {/* Status Description Card */}
        {showDescription && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`mt-6 p-4 rounded-lg border ${statusInfo.borderColor} ${statusInfo.bgColor}`}
          >
            <p className="text-sm text-gray-700">
              <span className="font-semibold">{statusInfo.label}:</span> {statusInfo.description}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default OrderStatusStepper;

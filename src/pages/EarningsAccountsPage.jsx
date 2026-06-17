import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useAuth } from '@/contexts/AuthContext';
import { DollarSign, TrendingUp, ShoppingCart, ArrowLeft } from 'lucide-react';

const EarningsAccountsPage = () => {
  const navigate = useNavigate();
  const { supabase } = useSupabase();
  const { userRole, loading: authLoading } = useAuth();

  // State variables
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState('');
  const [profitType, setProfitType] = useState('percentage');
  const [profitValue, setProfitValue] = useState(20);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateFilter, setDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Authorization check
  useEffect(() => {
    if (authLoading) return;
    const canUseFeature = userRole === 'admin' || userRole === 'store_owner';
    if (!canUseFeature) {
      toast({
        title: 'الوصول مرفوض',
        description: 'ليس لديك إذن لعرض حسابات الأرباح',
        variant: 'destructive',
      });
      navigate('/login');
    }
  }, [authLoading, userRole, navigate]);

  // Fetch available stores
  const fetchStores = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('main_store_name')
        .eq('published', true);

      if (fetchError) throw fetchError;

      const uniqueStores = [...new Set(data
        .map(p => p.main_store_name)
        .filter(name => name && name.trim() !== '')
      )].sort();

      setStores(uniqueStores);
      if (uniqueStores.length > 0 && !selectedStore) {
        setSelectedStore(uniqueStores[0]);
      }
    } catch (err) {
      const isNetworkError = err?.message?.includes('Failed to fetch') ||
                             err?.message?.includes('NetworkError');

      if (isNetworkError) {
        console.debug('Network error - unable to fetch stores');
      } else {
        console.error('Error fetching stores:', err);
        setError('خطأ في تحميل المتاجر');
      }
    }
  }, [supabase, selectedStore]);

  useEffect(() => {
    if (authLoading || !supabase) return;
    fetchStores();
  }, [authLoading, fetchStores]);

  // Call Edge Function to calculate earnings
  const handleCalculate = async () => {
    if (!selectedStore) {
      setError('يرجى اختيار متجر');
      return;
    }

    setLoading(true);
    setError(null);
    setEarnings(null);

    try {
      // Prepare date range
      let dateFrom = null;
      let dateTo = null;

      if (dateFilter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dateFrom = today.toISOString();
        dateTo = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString();
      } else if (dateFilter === 'week') {
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateFrom = weekAgo.toISOString();
        dateTo = today.toISOString();
      } else if (dateFilter === 'month') {
        const today = new Date();
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        dateFrom = monthAgo.toISOString();
        dateTo = today.toISOString();
      } else if (dateFilter === 'custom' && customStartDate && customEndDate) {
        dateFrom = new Date(customStartDate).toISOString();
        dateTo = new Date(customEndDate).toISOString();
      }

      // Call Edge Function via fetch
      const response = await fetch(
        'https://ykyzviqwscrjjkucorlp.supabase.co/functions/v1/calculate-store-earnings',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            store_name: selectedStore,
            profit_type: profitType,
            profit_value: Number(profitValue),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API Error: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.orders || data.orders.length === 0) {
        setError('لا توجد طلبات مكتملة لهذا المتجر');
        setEarnings(null);
      } else {
        // Ensure numeric values are always Numbers
        const totalEarnings = Number(data.totalEarnings) || 0;
        const totalProfit = Number(data.totalProfit) || 0;
        setEarnings({
          ...data,
          totalEarnings,
          totalProfit,
        });
      }
    } catch (err) {
      console.error('Error calculating earnings:', err);
      const errorMsg = err.message || 'خطأ في حساب الأرباح';
      setError(errorMsg);
      toast({
        title: 'خطأ',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (value) => {
    return new Intl.NumberFormat('ar-IQ', {
      style: 'currency',
      currency: 'IQD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatIQD = (value) =>
    Number.isFinite(value)
      ? value.toLocaleString('ar-IQ') + ' د.ع'
      : '0 د.ع';

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-IQ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const StatCard = ({ title, icon: Icon, value, subtitle, className = '' }) => (
    <div className={`earnings-stat-card ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="earnings-stat-label">{title}</p>
          <p className="earnings-stat-value">{value}</p>
          {subtitle && <p className="earnings-stat-subtitle">{subtitle}</p>}
        </div>
        {Icon && <Icon className="earnings-stat-icon" />}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
          <h1 className="earnings-page-title flex items-center gap-3">
            <DollarSign className="w-8 h-8" style={{ color: 'rgba(255, 23, 131, 1)' }} />
            <div style={{ color: 'rgba(0, 0, 0, 1)' }}>حسابات الأرباح</div>
          </h1>
          <button
            onClick={() => navigate('/inventory')}
            className="earnings-back-button"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة
          </button>
        </div>

        {/* Configuration Section */}
        <div className="earnings-config-section">
          <h2 className="earnings-section-title">إعدادات الأرباح</h2>

          <div className="earnings-grid">
            {/* Store Selection */}
            <div className="earnings-form-group">
              <label className="earnings-label">اختر المتجر</label>
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="earnings-select"
              >
                <option value="">-- اختر متجر --</option>
                {stores.map((store) => (
                  <option key={store} value={store}>
                    {store}
                  </option>
                ))}
              </select>
            </div>

            {/* Profit Type Selection */}
            <div className="earnings-form-group">
              <label className="earnings-label">طريقة الربح</label>
              <select
                value={profitType}
                onChange={(e) => setProfitType(e.target.value)}
                className="earnings-select"
              >
                <option value="percentage">نسبة مئوية (%)</option>
                <option value="fixed">مبلغ ثابت (د.ع)</option>
              </select>
            </div>

            {/* Profit Value Input */}
            <div className="earnings-form-group">
              <label className="earnings-label">
                قيمة الربح
                {profitType === 'percentage' ? ' (%)' : ' (د.ع)'}
              </label>
              <input
                type="number"
                value={profitValue}
                onChange={(e) => setProfitValue(e.target.value)}
                min="0"
                step={profitType === 'percentage' ? '1' : '100'}
                className="earnings-input"
                placeholder="أدخل قيمة الربح"
              />
            </div>

            {/* Date Filter */}
            <div className="earnings-form-group">
              <label className="earnings-label">نطاق التاريخ</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="earnings-select"
              >
                <option value="all">الكل</option>
                <option value="today">اليوم</option>
                <option value="week">هذا الأسبوع</option>
                <option value="month">هذا الشهر</option>
                <option value="custom">نطاق مخصص</option>
              </select>
            </div>

            {/* Custom Date Range */}
            {dateFilter === 'custom' && (
              <>
                <div className="earnings-form-group">
                  <label className="earnings-label">من التاريخ</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="earnings-input"
                  />
                </div>
                <div className="earnings-form-group">
                  <label className="earnings-label">إلى التاريخ</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="earnings-input"
                  />
                </div>
              </>
            )}
          </div>

          {/* Calculate Button */}
          <button
            onClick={handleCalculate}
            disabled={!selectedStore || loading}
            className="earnings-calculate-btn"
          >
            {loading ? 'جاري الحساب...' : 'حساب الأرباح'}
          </button>

          {error && (
            <div className="earnings-error-message">{error}</div>
          )}
        </div>

        {/* Results Section */}
        {earnings && earnings.orders && earnings.orders.length > 0 && (
          <>
            {/* Summary Statistics */}
            <div className="earnings-stats-grid">
              <StatCard
                title="إجمالي المبيعات"
                icon={ShoppingCart}
                value={formatIQD(earnings.totalEarnings)}
                className="earnings-stat-primary"
              />
              <StatCard
                title="إجمالي الأرباح"
                icon={TrendingUp}
                value={formatIQD(earnings.totalProfit)}
                subtitle={`من ${earnings.orders.length} طلب`}
                className="earnings-stat-success"
              />
            </div>

            {/* Details Table */}
            <div className="earnings-details-section">
              <h2 className="earnings-section-title">قائمة الطلبات</h2>

              <div className="earnings-table-wrapper">
                <table className="earnings-table">
                  <thead>
                    <tr>
                      <th>رقم الطلب</th>
                      <th>اسم العميل</th>
                      <th>المبلغ</th>
                      <th>التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnings.orders.map((order, idx) => (
                      <tr key={idx} className="earnings-table-row">
                        <td className="earnings-table-cell">{order.order_code}</td>
                        <td className="earnings-table-cell">{order.customer_name}</td>
                        <td className="earnings-table-cell earnings-profit-cell">
                          {formatPrice(order.total_amount)}
                        </td>
                        <td className="earnings-table-cell">
                          {formatDate(order.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Empty State */}
        {!earnings && !error && !loading && (
          <div className="earnings-initial-state">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2>اختر المتجر وقيمة الربح لبدء الحساب</h2>
            <p>سيتم عرض جميع الأرباح من الطلبات المكتملة هنا</p>
          </div>
        )}
      </main>

      <style>{`
        .earnings-page-title {
          font-size: 2.25rem;
          font-weight: bold;
          color: #FFFFFF;
          margin: 0;
        }

        .earnings-back-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #FF2F92 0%, #FF6B9D 100%);
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .earnings-back-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 47, 146, 0.3);
        }

        .earnings-config-section {
          background: linear-gradient(135deg, #fff5f7 0%, #fffbf0 100%);
          dark: background-color: rgb(31 41 55);
          border-radius: 12px;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 12px rgba(255, 105, 180, 0.08);
        }

        .earnings-section-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #2D3748;
          margin-bottom: 1.5rem;
          margin-top: 0;
        }

        .earnings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .earnings-form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .earnings-label {
          font-weight: 600;
          color: #2D3748;
          font-size: 0.875rem;
        }

        .earnings-select,
        .earnings-input {
          padding: 0.75rem;
          border: 2px solid #ffe4f0;
          border-radius: 8px;
          font-size: 1rem;
          font-family: inherit;
          transition: all 0.3s ease;
          background-color: white;
          color: #333;
        }

        .earnings-select:focus,
        .earnings-input:focus {
          outline: none;
          border-color: #ff69b4;
          box-shadow: 0 0 0 3px rgba(255, 105, 180, 0.1);
        }

        .earnings-calculate-btn {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #ff69b4 0%, #ffa500 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(255, 105, 180, 0.3);
        }

        .earnings-calculate-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 105, 180, 0.4);
        }

        .earnings-calculate-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .earnings-error-message {
          margin-top: 1rem;
          padding: 1rem;
          background-color: #FED7D7;
          color: #742A2A;
          border-radius: 0.375rem;
          border-left: 4px solid #F56565;
        }

        .earnings-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .earnings-stat-card {
          background: white;
          border-radius: 0.75rem;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .earnings-stat-primary {
          border-top: 4px solid #FF2F92;
        }

        .earnings-stat-success {
          border-top: 4px solid #48BB78;
        }

        .earnings-stat-label {
          font-size: 0.875rem;
          color: #718096;
          font-weight: 500;
          margin: 0 0 0.5rem 0;
        }

        .earnings-stat-value {
          font-size: 1.875rem;
          font-weight: bold;
          color: #2D3748;
          margin: 0;
        }

        .earnings-stat-subtitle {
          font-size: 0.75rem;
          color: #A0AEC0;
          margin-top: 0.5rem;
          margin: 0.5rem 0 0 0;
        }

        .earnings-stat-icon {
          width: 2rem;
          height: 2rem;
          color: #FF2F92;
        }

        .earnings-details-section {
          background: white;
          border-radius: 0.75rem;
          padding: 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .earnings-table-wrapper {
          overflow-x: auto;
        }

        .earnings-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .earnings-table thead {
          background-color: #F7FAFC;
          border-bottom: 2px solid #E2E8F0;
        }

        .earnings-table th {
          padding: 1rem;
          text-align: right;
          font-weight: 600;
          color: #2D3748;
        }

        .earnings-table-row {
          border-bottom: 1px solid #E2E8F0;
          transition: background-color 0.2s;
        }

        .earnings-table-row:hover {
          background-color: #F7FAFC;
        }

        .earnings-table-cell {
          padding: 0.875rem 1rem;
          color: #4A5568;
        }

        .earnings-profit-cell {
          font-weight: 600;
          color: #48BB78;
        }

        .earnings-empty-state {
          text-align: center;
          padding: 2rem;
          color: #718096;
        }

        .earnings-initial-state {
          text-align: center;
          padding: 3rem 2rem;
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .earnings-initial-state h2 {
          font-size: 1.5rem;
          color: #2D3748;
          margin: 1rem 0 0.5rem 0;
        }

        .earnings-initial-state p {
          color: #6C757D;
          margin: 0;
        }

        @media (max-width: 768px) {
          .earnings-page-title {
            font-size: 1.5rem;
          }

          .earnings-grid {
            grid-template-columns: 1fr;
          }

          .earnings-stats-grid {
            grid-template-columns: 1fr;
          }

          .earnings-table {
            font-size: 0.75rem;
          }

          .earnings-table th,
          .earnings-table-cell {
            padding: 0.5rem;
          }

          .earnings-config-section,
          .earnings-details-section {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default EarningsAccountsPage;

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, Warehouse } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const AdminHeader = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: 'تم تسجيل الخروج',
        description: 'وداعاً!',
      });
      navigate('/login');
    } catch (error) {
      toast({
        title: 'خطأ في تسجيل الخروج',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const navItems = [
    { path: '/inventory', label: 'المخزن', icon: '📦' },
    { path: '/analytics', label: 'التحليلات', icon: '📊' },
    { path: '/coupons', label: 'الخصومات', icon: '🎟️' },
    { path: '/order-status-management', label: 'الطلبات', icon: '📋' },
    { path: '/earnings', label: 'الأرباح', icon: '💰' },
    { path: '/admin/popups', label: 'الإعلانات', icon: '📢' },
    { path: '/maintenance-management', label: 'الصيانة', icon: '🔧' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-gray-900 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/inventory" className="flex items-center gap-2 font-bold text-xl">
            <Warehouse className="w-6 h-6" />
            <span>لوحة التحكم</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span className="mr-1">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400 hidden sm:block">
              {user?.email}
            </div>
            <Button
              onClick={handleSignOut}
              variant="ghost"
              size="sm"
              className="text-gray-300 hover:text-white hover:bg-gray-800"
            >
              <LogOut className="w-4 h-4" />
              <span className="ml-2">خروج</span>
            </Button>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden text-gray-300 hover:text-white"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <nav className="md:hidden mt-4 pt-4 border-t border-gray-700 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span className="mr-1">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
};

export default AdminHeader;

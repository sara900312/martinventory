import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { user, userRole, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="text-white text-xl animate-pulse">جاري التحقق من صلاحية الدخول...</div>
            </div>
        );
    }

    // Only allow store_owner or admin roles to access dashboard
    const isAuthorized = user && (userRole === 'admin' || userRole === 'store_owner');

    if (!isAuthorized) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;

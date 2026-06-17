import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        const { user, role, error } = await signIn(email.trim(), password.trim());

        if (error) {
            toast({
                title: "خطأ في تسجيل الدخول",
                description: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
                variant: "destructive",
            });
            setLoading(false);
            return;
        }

        // Only allow store_owner or admin roles
        if (role === 'admin' || role === 'store_owner') {
            toast({
                title: "تم تسجيل الدخول بنجاح",
                description: "مرحباً بعودتك!",
            });
            navigate('/inventory');
        } else {
            toast({
                title: "وصول غير مصرح به",
                description: "ليس لديك الصلاحية للوصول إلى لوحة التحكم. يُسمح فقط لأصحاب المخازن والمسؤولين.",
                variant: "destructive",
            });
        }
        
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
            <div className="w-full max-w-md p-8 space-y-8 glass-effect rounded-xl shadow-lg">
                <div className="text-center">
                    <h1 className="text-4xl font-extrabold text-white mb-2">لوحة التحكم</h1>
                    <h2 className="text-2xl font-bold text-white">
                        تسجيل الدخول
                    </h2>
                    <p className="mt-4 text-sm text-gray-400">
                        الوصول متاح لأصحاب المخازن والمسؤولين فقط
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="rounded-md shadow-sm space-y-4">
                        <div>
                            <label htmlFor="email-address" className="sr-only">
                                البريد الإلكتروني
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="login-input appearance-none relative block w-full px-3 py-3 border border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                placeholder="البريد الإلكتروني"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                كلمة المرور
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="login-input appearance-none relative block w-full px-3 py-3 border border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                placeholder="كلمة المرور"
                            />
                        </div>
                    </div>

                    <div>
                        <Button
                            type="submit"
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 ease-in-out"
                            disabled={loading}
                        >
                            {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login, register, reset } from '../features/auth/authSlice';
import { translations } from '../utils/translations';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';

const Login = () => {
    const { language } = useSelector((state) => state.ui);
    const t = translations[language];
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const { user, token, isLoading, isError, isSuccess, message } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Clear state on mount to prevent loops
    useEffect(() => {
        dispatch(reset());
    }, [dispatch]);

    useEffect(() => {
        if (isError) {
            toast.error(message || 'Login muvaffaqiyatsiz tugadi');
        }
        if (isSuccess || token) {
            if (token) {
                toast.success('Xush kelibsiz!');
                if (user?.role === 'admin') navigate('/admin');
                else navigate('/teacher');
            }
        }
    }, [user, token, isSuccess, isError, message, navigate, dispatch]);

    const onSubmit = (e) => {
        e.preventDefault();
        if (!formData.email || !formData.password) {
            return toast.error('Email va parolni kiriting');
        }
        dispatch(login(formData));
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[var(--bg-main)] relative overflow-hidden transition-colors duration-500">
            {/* Floating Background Logos */}
            <img src="/logo.jpg" alt="" className="absolute top-20 right-10 w-40 opacity-20 pointer-events-none animate-float-around select-none rounded-[40px] shadow-2xl shadow-blue-500/10" />
            <img src="/logo.jpg" alt="" className="absolute bottom-20 left-10 w-32 opacity-15 pointer-events-none animate-float-around select-none rounded-[30px] shadow-2xl shadow-indigo-500/10" style={{ animationDelay: '-12s' }} />

            <div className="w-full max-w-sm p-10 space-y-8 bg-[var(--bg-card)] backdrop-blur-xl rounded-[32px] shadow-2xl shadow-blue-500/5 border border-[var(--border-main)] relative z-10">
                <div className="text-center">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/10 border-4 border-slate-50 relative transition-all hover:scale-105">
                        <img src="/logo.jpg" alt="Logo" className="w-16 h-16 object-contain" />
                    </div>
                    <h2 className="text-3xl font-black text-[var(--text-main)] uppercase tracking-tighter">{t.login_title}</h2>
                    <p className="text-[var(--text-muted)] text-sm font-medium mt-2">{t.login_subtitle}</p>
                </div>

                <form onSubmit={onSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1 cursor-pointer">{t.email}</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input
                                type="email"
                                id="email"
                                placeholder="name@markaz.uz"
                                required
                                className="w-full pl-12 pr-6 py-4 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-main)] focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/20 focus:bg-[var(--bg-card)] focus:border-blue-500 transition-all font-bold text-[var(--text-main)] placeholder:text-slate-300"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="password" className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1 cursor-pointer">{t.password}</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                placeholder="••••••••"
                                required
                                className="w-full pl-12 pr-12 py-4 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-main)] focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/20 focus:bg-[var(--bg-card)] focus:border-blue-500 transition-all font-bold text-[var(--text-main)] placeholder:text-slate-300"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-slate-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 text-white bg-slate-800 dark:bg-blue-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#0F172A] dark:hover:bg-blue-700 hover:shadow-2xl transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isLoading ? '...' : t.login}
                    </button>
                </form>

                <div className="text-center pt-4 space-y-4">
                    <button
                        onClick={() => navigate('/')}
                        className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-[var(--text-main)]"
                    >
                        {language === 'uz' ? 'Bosh sahifa' : 'Home'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;

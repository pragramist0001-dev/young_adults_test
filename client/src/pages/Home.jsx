import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { startTestSession, setQuestions } from '../features/test/testSlice';
import { translations } from '../utils/translations';
import toast from 'react-hot-toast';
import { API_URL } from '../utils/apiConfig';
import { User, Phone, BookOpen, ArrowRight, UserCircle, KeyRound } from 'lucide-react';

const Home = () => {
    const { language } = useSelector((state) => state.ui);
    const t = translations[language];
    const [loginId, setLoginId] = useState('');
    const [loading, setLoading] = useState(false);
    const [blocked, setBlocked] = useState(false);
    const [blockInfo, setBlockInfo] = useState(null);
    const [requestingAccess, setRequestingAccess] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleChange = (e) => setLoginId(e.target.value);

    const handleRequestEarlyAccess = async () => {
        setRequestingAccess(true);
        try {
            const res = await axios.post(`${API_URL}/students/request-early-access`, { loginId });
            toast.success(t.request_sent_success);
            // Refresh the block info to show updated approval status
            handleSubmit({ preventDefault: () => { } });
        } catch (err) {
            const msg = err.response?.data?.message || t.error_occurred;
            toast.error(msg);
        } finally {
            setRequestingAccess(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setBlocked(false);
        const loadToast = toast.loading(t.preparing_test);
        try {
            const res = await axios.post(`${API_URL}/students/start`, { loginId });
            const { studentId, chosenSubject, fullName, questions, testId } = res.data;

            let finalQuestions = questions;

            if (!finalQuestions || finalQuestions.length === 0) {
                toast.error(t.no_test_assigned_error, { id: loadToast });
                setLoading(false);
                return;
            }

            dispatch(startTestSession({ studentId, testId }));
            dispatch(setQuestions(finalQuestions));

            toast.success(`Xush kelibsiz, ${fullName} !`, { id: loadToast });
            navigate(`/test/${chosenSubject}`);
        } catch (err) {
            if (err.response?.status === 403 && err.response?.data?.canRequestEarlyAccess) {
                // Student is blocked by 7-day restriction
                setBlocked(true);
                setBlockInfo(err.response.data);
                toast.error(err.response.data.message, { id: loadToast, duration: 5000 });
            } else {
                const msg = (err.response && err.response.data && err.response.data.message) || err.message || 'Xatolik yuz berdi';
                toast.error(msg, { id: loadToast });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[var(--bg-main)] p-4 text-[var(--text-main)] relative overflow-hidden transition-colors duration-500">
            {/* Floating Background Logos */}
            <img data-aos="fade-right" data-aos-duration="2000" src="/logo.jpg" alt="" className="absolute top-10 left-10 w-40 opacity-20 pointer-events-none animate-float-around select-none rounded-[40px] shadow-2xl shadow-blue-500/20" />
            <img data-aos="fade-left" data-aos-duration="2000" src="/logo.jpg" alt="" className="absolute bottom-10 right-10 w-48 opacity-15 pointer-events-none animate-float-around select-none rounded-[60px] shadow-2xl shadow-indigo-500/10" style={{ animationDelay: '-5s' }} />

            <div className="w-full max-w-[440px] relative z-10" data-aos="zoom-in" data-aos-duration="800">
                <div className="relative bg-[var(--bg-card)] backdrop-blur-xl rounded-[40px] shadow-2xl shadow-blue-500/5 border border-[var(--border-main)] p-10 space-y-8">
                    <div className="flex justify-between items-start" data-aos="fade-up" data-aos-delay="200">
                        <div className="flex flex-col">
                            <div
                                onClick={() => navigate('/')}
                                className="w-32 h-32 bg-white rounded-[32px] flex items-center justify-center shadow-xl shadow-blue-500/10 border-4 border-slate-50 mb-4 transition-all hover:scale-110 active:scale-95 cursor-pointer group"
                            >
                                <img src="/logo.jpg" alt="Logo" className="w-24 h-24 object-contain transition-transform group-hover:rotate-3" />
                            </div>
                            <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-[0.3em] ml-0.5">{t.system_title}</p>
                        </div>
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-[var(--bg-main)] p-3 rounded-2xl text-[var(--text-muted)] hover:text-blue-500 hover:bg-blue-500/10 transition-all border border-[var(--border-main)] group"
                            title="Xodimlar kirishi"
                        >
                            <UserCircle size={24} />
                        </button>
                    </div>

                    <div className="space-y-6" data-aos="fade-up" data-aos-delay="400">
                        <div className="space-y-1">
                            <h2 className="text-xl font-bold text-[var(--text-main)]">{t.welcome}</h2>
                            <p className="text-[var(--text-muted)] text-sm font-medium">{t.start_test_now}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-4">
                                <label htmlFor="loginId" className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-2 cursor-pointer">Login ID (4 xonali kod)</label>
                                <div className="relative group">
                                    <KeyRound className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={24} />
                                    <input
                                        type="text"
                                        id="loginId"
                                        name="loginId"
                                        required
                                        maxLength="4"
                                        pattern="\d{4}"
                                        autoComplete="off"
                                        className="w-full pl-16 pr-6 py-6 rounded-[28px] border border-[var(--border-main)] bg-[var(--bg-main)] focus:outline-none focus:ring-8 focus:ring-blue-500/10 focus:bg-[var(--bg-card)] focus:border-blue-500 transition-all font-mono text-2xl font-black text-[var(--text-main)] placeholder:text-slate-300 tracking-[0.5em] text-center"
                                        placeholder="0000"
                                        value={loginId}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full group mt-4 flex items-center justify-center gap-3 py-5 bg-slate-800 dark:bg-blue-600 text-white rounded-[24px] font-black text-sm uppercase tracking-[0.2em] hover:bg-blue-700 hover:shadow-2xl transition-all disabled:opacity-50"
                            >
                                <span>{loading ? '...' : t.start_test}</span>
                                {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                            </button>
                        </form>

                        {/* Early Access Request UI */}
                        {blocked && blockInfo && (
                            <div className="mt-6 p-6 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-700 rounded-3xl space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-2">{t.access_restricted}</h3>
                                        <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                                            {blockInfo.earlyAccessRequest?.requested ? t.waiting_for_teacher : t.restriction_message}
                                        </p>

                                        {blockInfo.earlyAccessRequest?.requested ? (
                                            <div className="space-y-3">
                                                <p className="text-xs font-semibold text-amber-900 dark:text-amber-100">{t.approval_status}:</p>
                                                <div className="p-4 rounded-2xl border-2 bg-blue-50 dark:bg-blue-900/20 border-blue-500">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            {blockInfo.earlyAccessRequest.teacherApproved ? (
                                                                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                </svg>
                                                            ) : (
                                                                <svg className="w-6 h-6 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                                </svg>
                                                            )}
                                                            <span className={`text-sm font-bold ${blockInfo.earlyAccessRequest.teacherApproved ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'}`}>
                                                                {t.teacher}
                                                            </span>
                                                        </div>
                                                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${blockInfo.earlyAccessRequest.teacherApproved ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'}`}>
                                                            {blockInfo.earlyAccessRequest.teacherApproved ? t.approved : t.waiting}
                                                        </span>
                                                    </div>
                                                </div>
                                                {blockInfo.earlyAccessRequest.teacherApproved ? (
                                                    <p className="text-sm font-bold text-green-700 dark:text-green-300 flex items-center gap-2">
                                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                        {t.access_granted}
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-amber-700 dark:text-amber-300">{t.waiting_for_teacher}</p>
                                                )}
                                            </div>
                                        ) : (
                                            <button
                                                onClick={handleRequestEarlyAccess}
                                                disabled={requestingAccess}
                                                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold text-sm transition-all disabled:opacity-50"
                                            >
                                                {requestingAccess ? t.sending : t.ask_permission}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 text-center" data-aos="fade-up" data-aos-delay="600">
                        <p className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-[0.2em] opacity-50">© 2026 Young Adults Platform</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;

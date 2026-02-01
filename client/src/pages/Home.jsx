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
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleChange = (e) => setLoginId(e.target.value);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const loadToast = toast.loading('Test tayyorlanmoqda...');
        try {
            const res = await axios.post(`${API_URL} /students/start`, { loginId });
            const { studentId, chosenSubject, fullName, questions, testId } = res.data;

            let finalQuestions = questions;

            if (!finalQuestions || finalQuestions.length === 0) {
                toast.error('Guruhga hali test biriktirilmagan. Ustozingiz bilan bog\'laning.', { id: loadToast });
                setLoading(false);
                return;
            }

            dispatch(startTestSession({ studentId, testId }));
            dispatch(setQuestions(finalQuestions));

            toast.success(`Xush kelibsiz, ${fullName} !`, { id: loadToast });
            navigate(`/ test / ${chosenSubject} `);
        } catch (err) {
            const msg = (err.response && err.response.data && err.response.data.message) || err.message || 'Xatolik yuz berdi';
            toast.error(msg, { id: loadToast });
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
                            <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-[0.3em] ml-0.5">{language === 'uz' ? "O'QUV MARKAZI TIZIMI" : language === 'ru' ? "СИСТЕМА УЧЕБНОГО ЦЕНТРА" : "EDUCATION CENTER SYSTEM"}</p>
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

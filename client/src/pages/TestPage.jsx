import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { answerQuestion, nextQuestion, prevQuestion, finishTest, setScore } from '../features/test/testSlice';
import { translations } from '../utils/translations';
import { API_URL } from '../utils/apiConfig';

const TestPage = () => {
    const { questions, currentQuestionIndex, answers, studentId, testId, startTime, isFinished, score } = useSelector((state) => state.test);
    const { language } = useSelector((state) => state.ui);
    const t = translations[language];
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!studentId || questions.length === 0) {
            navigate('/');
        }
    }, [studentId, questions, navigate]);

    if (!questions || questions.length === 0) return null;

    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswer = answers.find(a => a.questionId === currentQuestion._id);
    const selectedIndex = currentAnswer !== undefined ? currentAnswer.selectedIndex : null;

    const handleOptionSelect = (option, idx) => {
        dispatch(answerQuestion({ questionId: currentQuestion._id, selectedOption: option, selectedIndex: idx }));
    };

    const formatTimeSpent = (start) => {
        const diff = Date.now() - start;
        const totalSeconds = Math.floor(diff / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const handleSubmit = async () => {
        if (!window.confirm(t.finish_confirm)) return;
        setSubmitting(true);
        try {
            const timeSpent = formatTimeSpent(startTime);
            const res = await axios.post(`${API_URL}/students/submit`, {
                studentId,
                testId,
                answers,
                timeSpent
            });
            dispatch(setScore(res.data.score));
            dispatch(finishTest());
        } catch (err) {
            toast.error(t.error_occurred);
        } finally {
            setSubmitting(false);
        }
    };

    if (isFinished) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--bg-main)] p-4 text-[var(--text-main)] transition-colors duration-500">
                <div className="p-12 text-center bg-[var(--bg-card)] rounded-[40px] shadow-2xl border border-[var(--border-main)] max-w-md w-full animate-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <h1 className="mb-4 text-3xl font-black text-[var(--text-main)] uppercase tracking-tighter">{t.test_finished}</h1>
                    <p className="text-lg text-[var(--text-muted)] font-medium mb-8">{t.results}:</p>
                    <div className="mb-10 inline-block px-10 py-6 bg-blue-500/10 text-blue-500 rounded-[32px] text-6xl font-black border border-blue-500/20">
                        {score} / {questions.length}
                    </div>
                    <button onClick={() => navigate('/')} className="w-full py-5 text-white bg-slate-800 dark:bg-blue-600 rounded-[24px] font-black text-sm uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-xl hover:shadow-blue-500/20">
                        {t.back}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center min-h-screen p-6 bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-500">
            <div className="w-full max-w-3xl relative mt-12 bg-[var(--bg-card)] rounded-[48px] shadow-2xl border border-[var(--border-main)] overflow-hidden animate-in slide-in-from-bottom-8 duration-700">
                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}></div>
                </div>

                <div className="p-12">
                    <div className="flex justify-between items-start mb-10">
                        <div className="flex flex-col gap-4">
                            <div className="w-16 h-16 bg-white rounded-[16px] flex items-center justify-center shadow-xl border-2 border-slate-50">
                                <img src="/logo.jpg" alt="Logo" className="w-12 h-12 object-contain" />
                            </div>
                            <span className="px-5 py-2 bg-blue-500/10 text-blue-500 rounded-2xl text-xs font-black uppercase tracking-widest border border-blue-500/20 w-fit">{t.questions} {currentQuestionIndex + 1} / {questions.length}</span>
                        </div>
                        <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">{currentQuestion.subject}</span>
                    </div>

                    <h2 className="mb-12 text-2xl font-black text-[var(--text-main)] leading-snug">{currentQuestion.questionText}</h2>

                    <div className="grid grid-cols-1 gap-5">
                        {currentQuestion.options.map((option, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleOptionSelect(option, idx)}
                                className={`group flex items-center gap-6 w-full p-6 text-left border-[2px] rounded-[28px] transition-all duration-300 ${selectedIndex === idx
                                    ? 'bg-blue-500/10 border-blue-500 text-blue-600 shadow-lg shadow-blue-500/5'
                                    : 'bg-[var(--bg-card)] border-[var(--border-main)] hover:border-blue-500/30'
                                    }`}
                            >
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs transition-colors ${selectedIndex === idx ? 'bg-blue-500 text-white' : 'bg-[var(--bg-main)] text-[var(--text-muted)] border border-[var(--border-main)]'}`}>
                                    {String.fromCharCode(65 + idx)}
                                </div>
                                <span className="text-sm font-bold uppercase tracking-tight">{option}</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex justify-between items-center mt-16 pt-10 border-t border-[var(--border-main)]">
                        <button
                            onClick={() => dispatch(prevQuestion())}
                            disabled={currentQuestionIndex === 0}
                            className="px-8 py-4 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl hover:text-blue-500 transition-all disabled:opacity-30 disabled:pointer-events-none"
                        >
                            {t.back}
                        </button>

                        <div className="flex gap-4">
                            {currentQuestionIndex === questions.length - 1 ? (
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting || selectedIndex === null}
                                    className="px-10 py-4 text-white bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
                                >
                                    {submitting ? '...' : t.finish_action}
                                </button>
                            ) : (
                                <button
                                    onClick={() => dispatch(nextQuestion())}
                                    disabled={selectedIndex === null}
                                    className="px-10 py-4 text-white bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
                                >
                                    {t.next || 'Next'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestPage;

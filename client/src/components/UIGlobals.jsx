import { useSelector, useDispatch } from 'react-redux';
import { toggleTheme, setLanguage } from '../features/ui/uiSlice';
import { Moon, Sun, Languages, Check } from 'lucide-react';
import { useState } from 'react';

const UIGlobals = () => {
    const { theme, language } = useSelector((state) => state.ui);
    const dispatch = useDispatch();
    const [showLang, setShowLang] = useState(false);

    const langs = [
        { code: 'uz', label: 'UZ', flag: '🇺🇿' },
        { code: 'ru', label: 'RU', flag: '🇷🇺' },
        { code: 'en', label: 'EN', flag: '🇺🇸' },
    ];

    return (
        <div className="fixed bottom-8 right-8 z-[9999] flex flex-col gap-4">
            {/* Language Selector */}
            <div className="relative">
                {showLang && (
                    <div className="absolute bottom-full mb-4 right-0 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-3 shadow-2xl animate-in slide-in-from-bottom-4 duration-300 w-40">
                        <div className="space-y-1">
                            {langs.map((l) => (
                                <button
                                    key={l.code}
                                    onClick={() => { dispatch(setLanguage(l.code)); setShowLang(false); }}
                                    className={`w-full flex items-center justify-between px-4 py-2 rounded-xl text-sm font-bold transition-all ${language === l.code ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                >
                                    <span className="flex items-center gap-2"><span>{l.flag}</span>{l.label}</span>
                                    {language === l.code && <Check size={14} />}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                <button
                    onClick={() => setShowLang(!showLang)}
                    className="w-14 h-14 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full shadow-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:scale-110 active:scale-95 transition-all"
                >
                    <Languages size={24} />
                </button>
            </div>

            {/* Theme Toggle */}
            <button
                onClick={() => dispatch(toggleTheme())}
                className="w-14 h-14 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full shadow-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:scale-110 active:scale-95 transition-all"
            >
                {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
            </button>
        </div>
    );
};

export default UIGlobals;

import React from 'react';

const Loader = () => {
    return (
        <div className="fixed inset-0 z-[9999] bg-[#F8FAFC] dark:bg-[#0F172A] flex flex-col items-center justify-center transition-colors duration-500">
            <div className="relative flex items-center justify-center">
                {/* Pulsing Glur Effect Behind */}
                <div className="absolute w-32 h-32 bg-blue-500/20 rounded-full blur-2xl animate-pulse"></div>
                <div className="absolute w-24 h-24 bg-indigo-500/20 rounded-full blur-xl animate-bounce delay-100"></div>

                {/* Logo Container */}
                <div className="relative w-24 h-24 bg-white rounded-[24px] shadow-2xl border-4 border-slate-50 dark:border-slate-800 flex items-center justify-center overflow-hidden animate-float-logo z-10">
                    <img src="/logo.jpg" alt="Logo" className="w-16 h-16 object-contain" />
                </div>
            </div>

            {/* Loading text/dots */}
            <div className="mt-8 flex gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
        </div>
    );
};

export default Loader;

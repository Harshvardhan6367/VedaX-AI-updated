import React, { useState, useEffect } from 'react';
import { Users, Building2, CalendarCheck, Star } from 'lucide-react';

const AnimatedNumber = ({ value, duration = 2000 }: { value: number, duration?: number }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTimestamp: number | null = null;
        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);

            const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

            setCount(Math.floor(ease * value));

            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };

        window.requestAnimationFrame(step);
    }, [value, duration]);

    return <span>{count.toLocaleString()}</span>;
};

const AnimatedStats = () => {
    const stats = [
        { label: 'Doctors Registered', value: 234, icon: Users, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
        { label: 'Departments Available', value: 58, icon: Building2, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
        { label: 'Total Appointments', value: 7306, icon: CalendarCheck, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
        { label: 'Patient Reviews', value: 105, icon: Star, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center group hover:scale-[1.02] transition-transform">
                    <div className={`p-3 rounded-xl mb-4 ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                        <stat.icon size={28} />
                    </div>
                    <h4 className="text-3xl font-black text-slate-900 dark:text-white mb-1"><AnimatedNumber value={stat.value} />+</h4>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{stat.label}</p>
                </div>
            ))}
        </div>
    );
};

export default AnimatedStats;

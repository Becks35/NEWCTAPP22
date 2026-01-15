
import React, { useState, useEffect } from 'react';

export const CountdownTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number, targetMonth: string } | null>(null);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      let targetYear = now.getFullYear();
      let targetMonth = now.getMonth(); // 0-indexed

      // Target is always the 12th
      // If today is past the 12th, target the 12th of the NEXT month
      if (now.getDate() > 12) {
        targetMonth += 1;
        if (targetMonth > 11) {
          targetMonth = 0;
          targetYear += 1;
        }
      }

      const targetDate = new Date(targetYear, targetMonth, 12, 23, 59, 59);
      const diff = targetDate.getTime() - now.getTime();

      if (diff <= 0) return setTimeLeft(null);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      const monthName = targetDate.toLocaleString('default', { month: 'long' });

      setTimeLeft({ days, hours, minutes, seconds, targetMonth: monthName });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!timeLeft) return null;

  return (
    <div className="bg-gradient-to-r from-rose-600 via-indigo-700 to-indigo-900 text-white rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-32 -mt-32"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left">
          <p className="text-indigo-200 text-xs font-black uppercase tracking-[0.2em] mb-1">Contribution Deadline</p>
          <h2 className="text-2xl font-black">{timeLeft.targetMonth} 12th, 11:59PM</h2>
          <p className="text-indigo-300 text-[10px] mt-1 font-bold">Reminder active from 13th of last month to 12th of current.</p>
        </div>

        <div className="flex gap-4">
          {[
            { label: 'Days', val: timeLeft.days },
            { label: 'Hrs', val: timeLeft.hours },
            { label: 'Min', val: timeLeft.minutes },
            { label: 'Sec', val: timeLeft.seconds }
          ].map(unit => (
            <div key={unit.label} className="flex flex-col items-center">
              <div className="bg-white bg-opacity-10 backdrop-blur-md w-16 h-16 rounded-2xl flex items-center justify-center border border-white border-opacity-10 shadow-lg mb-2">
                <span className="text-2xl font-black font-mono">{String(unit.val).padStart(2, '0')}</span>
              </div>
              <span className="text-[10px] font-black uppercase text-indigo-200 tracking-widest">{unit.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 h-1.5 w-full bg-indigo-950 rounded-full overflow-hidden">
         <div 
           className="h-full bg-rose-400 transition-all duration-1000" 
           style={{ width: `${Math.min(100, (30 - timeLeft.days) / 30 * 100)}%` }}
         ></div>
      </div>
    </div>
  );
};

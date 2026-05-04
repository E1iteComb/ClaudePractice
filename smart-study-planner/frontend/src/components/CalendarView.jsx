import { useState, useMemo } from 'react';
import {
  format,
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  isSameDay,
  isToday,
} from 'date-fns';

const PRIORITY_BG = {
  high: 'bg-red-100 border-red-300 text-red-800',
  medium: 'bg-amber-100 border-amber-300 text-amber-800',
  low: 'bg-emerald-100 border-emerald-300 text-emerald-800',
};

export default function CalendarView({ sessions, onToggleSession }) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const sessionsByDay = useMemo(() => {
    const map = {};
    sessions.forEach((s) => {
      const key = format(new Date(s.date), 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push(s);
    });
    return map;
  }, [sessions]);

  const totalHoursForDay = (day) => {
    const key = format(day, 'yyyy-MM-dd');
    return (sessionsByDay[key] || []).reduce((sum, s) => sum + s.duration, 0);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Week navigation */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <button
          onClick={() => setWeekStart((w) => subWeeks(w, 1))}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
        >
          &#8592;
        </button>
        <span className="text-sm font-semibold text-gray-700">
          {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
        </span>
        <button
          onClick={() => setWeekStart((w) => addWeeks(w, 1))}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
        >
          &#8594;
        </button>
      </div>

      {/* Day columns */}
      <div className="grid grid-cols-7 divide-x divide-gray-100">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const daySessions = sessionsByDay[key] || [];
          const totalHours = totalHoursForDay(day);

          return (
            <div key={key} className="min-h-36 flex flex-col">
              {/* Day header */}
              <div
                className={`px-2 py-2 text-center border-b border-gray-100 ${
                  isToday(day) ? 'bg-brand-50' : ''
                }`}
              >
                <p className="text-xs text-gray-400 uppercase">{format(day, 'EEE')}</p>
                <p
                  className={`text-sm font-bold mt-0.5 ${
                    isToday(day) ? 'text-brand-600' : 'text-gray-700'
                  }`}
                >
                  {format(day, 'd')}
                </p>
                {totalHours > 0 && (
                  <p className="text-xs text-gray-400">{totalHours}h</p>
                )}
              </div>

              {/* Sessions */}
              <div className="flex-1 p-1.5 space-y-1 overflow-y-auto max-h-60">
                {daySessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onToggleSession(s)}
                    title={`${s.task?.title} — ${s.duration}h. Click to toggle complete.`}
                    className={`w-full text-left px-2 py-1.5 rounded-lg border text-xs font-medium transition-opacity ${
                      PRIORITY_BG[s.task?.priority] || 'bg-gray-100 border-gray-200 text-gray-700'
                    } ${s.completed ? 'opacity-40 line-through' : ''}`}
                  >
                    <span className="block truncate">{s.task?.title}</span>
                    <span className="block text-xs opacity-70">{s.duration}h</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {sessions.length === 0 && (
        <div className="py-10 text-center text-sm text-gray-400">
          No sessions scheduled. Generate a schedule to populate the calendar.
        </div>
      )}
    </div>
  );
}

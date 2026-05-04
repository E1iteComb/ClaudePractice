import { useMemo } from 'react';
import { format, isToday, isTomorrow } from 'date-fns';

const PRIORITY_COLORS = { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-emerald-100 text-emerald-700' };

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard({ tasks, sessions, onTabChange }) {
  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const completedSessions = sessions.filter((s) => s.completed).length;
    const totalSessions = sessions.length;
    const todaySessions = sessions.filter((s) => isToday(new Date(s.date)));
    const todayHours = todaySessions.reduce((sum, s) => sum + s.duration, 0);

    const overallProgress =
      tasks.length === 0
        ? 0
        : Math.round(
            (tasks.reduce((sum, t) => sum + Math.min(t.completed_hours / t.estimated_hours, 1), 0) /
              tasks.length) *
              100
          );

    return { totalTasks, completedSessions, totalSessions, todayHours, overallProgress };
  }, [tasks, sessions]);

  // Upcoming sessions: today + tomorrow + next 5 days
  const upcoming = useMemo(
    () =>
      sessions
        .filter((s) => !s.completed && new Date(s.date) >= new Date(new Date().setHours(0, 0, 0, 0)))
        .slice(0, 8),
    [sessions]
  );

  const dateLabel = (dateStr) => {
    const d = new Date(dateStr);
    if (isToday(d)) return 'Today';
    if (isTomorrow(d)) return 'Tomorrow';
    return format(d, 'EEE, MMM d');
  };

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Tasks" value={stats.totalTasks} />
        <StatCard label="Sessions done" value={`${stats.completedSessions}/${stats.totalSessions}`} />
        <StatCard label="Study today" value={`${stats.todayHours}h`} />
        <StatCard label="Overall progress" value={`${stats.overallProgress}%`} />
      </div>

      {/* Progress bars per task */}
      {tasks.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Task progress</h2>
          <div className="space-y-3">
            {tasks.map((task) => {
              const pct = Math.min(100, Math.round((task.completed_hours / task.estimated_hours) * 100));
              return (
                <div key={task.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700 font-medium truncate max-w-xs">{task.title}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority]}`}>
                        {task.priority}
                      </span>
                      <span className="text-xs text-gray-400">{pct}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-brand-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming sessions */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">Upcoming sessions</h2>
          {sessions.length > 0 && (
            <button
              onClick={() => onTabChange('calendar')}
              className="text-xs text-brand-600 hover:underline"
            >
              View calendar
            </button>
          )}
        </div>

        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-400">
            {sessions.length === 0
              ? 'No schedule yet — add tasks and click Generate Schedule.'
              : 'All sessions complete!'}
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {upcoming.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium text-gray-800">{s.task?.title}</p>
                  <p className="text-xs text-gray-400">{dateLabel(s.date)}</p>
                </div>
                <span className="text-sm font-semibold text-brand-600">{s.duration}h</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

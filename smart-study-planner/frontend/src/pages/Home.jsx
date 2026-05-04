import { useState, useEffect, useCallback } from 'react';
import Dashboard from '../components/Dashboard';
import TaskForm from '../components/TaskForm';
import TaskList from '../components/TaskList';
import CalendarView from '../components/CalendarView';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/api';

export default function Home() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAll = useCallback(async () => {
    try {
      const [taskRes, sessionRes] = await Promise.all([api.getTasks(), api.getSchedule()]);
      setTasks(taskRes.data);
      setSessions(sessionRes.data);
    } catch {
      setError('Failed to load data. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleGenerateSchedule = async () => {
    setScheduleLoading(true);
    setError('');
    try {
      const { data } = await api.generateSchedule();
      setSessions(data.sessions);
    } catch {
      setError('Failed to generate schedule.');
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleTaskSaved = (task) => {
    setTasks((prev) =>
      editingTask ? prev.map((t) => (t.id === task.id ? task : t)) : [...prev, task]
    );
    setShowTaskForm(false);
    setEditingTask(null);
  };

  const handleDeleteTask = async (id) => {
    await api.deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setSessions((prev) => prev.filter((s) => s.taskId !== id));
  };

  const handleToggleSession = async (session) => {
    const { data } = await api.markSessionComplete(session.id, !session.completed);
    setSessions((prev) => prev.map((s) => (s.id === data.id ? { ...s, ...data } : s)));
    // Refresh tasks to get updated completed_hours
    const { data: updatedTasks } = await api.getTasks();
    setTasks(updatedTasks);
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'calendar', label: 'Calendar' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400 text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-bold text-brand-600 text-lg">StudyPlanner</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user?.email}</span>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
            {error}
          </div>
        )}

        {/* Tab bar + actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-brand-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleGenerateSchedule}
              disabled={scheduleLoading || tasks.length === 0}
              className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {scheduleLoading ? 'Generating…' : 'Generate Schedule'}
            </button>
            <button
              onClick={() => { setEditingTask(null); setShowTaskForm(true); }}
              className="bg-white border border-gray-300 hover:border-brand-500 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              + Add Task
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'dashboard' && (
          <Dashboard tasks={tasks} sessions={sessions} onTabChange={setActiveTab} />
        )}
        {activeTab === 'tasks' && (
          <TaskList
            tasks={tasks}
            onEdit={(t) => { setEditingTask(t); setShowTaskForm(true); }}
            onDelete={handleDeleteTask}
          />
        )}
        {activeTab === 'calendar' && (
          <CalendarView sessions={sessions} onToggleSession={handleToggleSession} />
        )}
      </div>

      {/* Task form modal */}
      {showTaskForm && (
        <TaskForm
          task={editingTask}
          onSaved={handleTaskSaved}
          onClose={() => { setShowTaskForm(false); setEditingTask(null); }}
        />
      )}
    </div>
  );
}

import { format } from 'date-fns';

const PRIORITY_STYLES = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const DIFFICULTY_LABELS = ['', 'Easy', 'Mild', 'Medium', 'Hard', 'Very hard'];

export default function TaskList({ tasks, onEdit, onDelete }) {
  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
        <p className="text-gray-400 text-sm">No tasks yet. Click + Add Task to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const pct = Math.min(100, Math.round((task.completed_hours / task.estimated_hours) * 100));
        const daysLeft = Math.ceil(
          (new Date(task.deadline) - new Date()) / 86400000
        );

        return (
          <div
            key={task.id}
            className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-brand-300 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-semibold text-gray-900 truncate">{task.title}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border font-medium ${PRIORITY_STYLES[task.priority]}`}
                  >
                    {task.priority}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                  <span>Deadline: {format(new Date(task.deadline), 'MMM d, yyyy')}</span>
                  <span className={daysLeft < 3 ? 'text-red-500 font-medium' : ''}>
                    {daysLeft > 0 ? `${daysLeft}d left` : 'Overdue'}
                  </span>
                  <span>{task.estimated_hours}h estimated</span>
                  <span>Difficulty: {DIFFICULTY_LABELS[task.difficulty]} ({task.difficulty}/5)</span>
                </div>

                {/* Progress bar */}
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-brand-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {task.completed_hours}h / {task.estimated_hours}h ({pct}%)
                  </span>
                </div>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => onEdit(task)}
                  className="text-xs border border-gray-200 text-gray-600 hover:border-brand-400 hover:text-brand-600 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(task.id)}
                  className="text-xs border border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-600 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

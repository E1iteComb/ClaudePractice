const { addDays, startOfDay, differenceInCalendarDays, format, isAfter, isBefore, isEqual } = require('date-fns');

const PRIORITY_WEIGHT = { high: 3, medium: 2, low: 1 };
const MAX_CHUNK_HOURS = 2;
const MIN_CHUNK_HOURS = 0.5;

/**
 * Generates an optimized list of StudySession objects for the given tasks.
 *
 * Algorithm (Step 1 — deadline-first baseline, Step 2 — priority+difficulty weighting):
 *  1. Calculate each task's urgency score = (priority_weight * difficulty) / days_until_deadline
 *     so high-priority, hard tasks with near deadlines float to the top.
 *  2. Sort tasks descending by urgency score (ties broken by earliest deadline).
 *  3. Walk each task in order, filling available day-slots from today → deadline.
 *     Each slot is capped at MAX_CHUNK_HOURS so no session is overwhelming.
 *  4. Track hours allocated per day across all tasks to avoid overloading a single day.
 *
 * @param {Array}  tasks               Prisma Task rows (with sessions included)
 * @param {number} dailyAvailableHours User's daily study budget
 * @returns {Array} Plain session objects ready to be bulk-inserted
 */
function generateSchedule(tasks, dailyAvailableHours) {
  const today = startOfDay(new Date());

  // --- Step 1: Score and sort tasks ---
  const scoredTasks = tasks
    .map((task) => {
      const daysLeft = Math.max(1, differenceInCalendarDays(startOfDay(new Date(task.deadline)), today));
      const weight = PRIORITY_WEIGHT[task.priority] ?? 1;
      const urgency = (weight * task.difficulty) / daysLeft;

      // Remaining hours = estimated minus already-completed session time
      const completedSessionHours = task.sessions
        .filter((s) => s.completed)
        .reduce((sum, s) => sum + s.duration, 0);
      const remainingHours = Math.max(0, task.estimated_hours - completedSessionHours);

      return { ...task, urgency, remainingHours };
    })
    .filter((t) => t.remainingHours > 0);

  // Sort: highest urgency first, earliest deadline as tiebreaker
  scoredTasks.sort((a, b) => {
    const diff = b.urgency - a.urgency;
    if (Math.abs(diff) > 0.001) return diff;
    return new Date(a.deadline) - new Date(b.deadline);
  });

  // --- Step 2: Greedy slot-filling ---
  // dailyBudget[dateKey] tracks total hours already scheduled on that date
  const dailyBudget = {};

  const sessions = [];

  for (const task of scoredTasks) {
    let hoursLeft = task.remainingHours;
    const deadline = startOfDay(new Date(task.deadline));

    let cursor = new Date(today);

    while (hoursLeft >= MIN_CHUNK_HOURS) {
      // Stop if we've passed the deadline
      if (isAfter(cursor, deadline)) break;

      const key = format(cursor, 'yyyy-MM-dd');
      const used = dailyBudget[key] ?? 0;
      const available = dailyAvailableHours - used;

      if (available >= MIN_CHUNK_HOURS) {
        // Chunk size: up to MAX_CHUNK_HOURS, but don't exceed what's left or available today
        const chunk = Math.min(MAX_CHUNK_HOURS, hoursLeft, available);

        sessions.push({
          taskId: task.id,
          date: new Date(cursor),
          duration: Math.round(chunk * 10) / 10, // round to 1 decimal
          completed: false,
        });

        dailyBudget[key] = used + chunk;
        hoursLeft -= chunk;
      }

      cursor = addDays(cursor, 1);
    }
  }

  return sessions;
}

/**
 * Redistributes remaining hours for an incomplete session.
 * Called after a session is marked incomplete: re-fills days from tomorrow onward.
 *
 * @param {object} task                 Prisma Task row (with sessions)
 * @param {number} dailyAvailableHours  User's daily budget
 * @param {object} existingBudget       { dateKey: hoursUsed } map of already-scheduled sessions
 * @returns {Array} New session objects to insert
 */
function rescheduleTask(task, dailyAvailableHours, existingBudget) {
  return generateSchedule([task], dailyAvailableHours);
}

module.exports = { generateSchedule, rescheduleTask };

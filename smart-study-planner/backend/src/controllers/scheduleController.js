const { PrismaClient } = require('@prisma/client');
const { generateSchedule } = require('../services/scheduler');

const prisma = new PrismaClient();

/**
 * POST /api/generate-schedule
 * Clears all pending (incomplete) sessions for the user's tasks,
 * runs the scheduling algorithm, and saves fresh sessions.
 */
async function generateScheduleHandler(req, res, next) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });

    const tasks = await prisma.task.findMany({
      where: { userId: req.userId },
      include: { sessions: true },
    });

    if (tasks.length === 0) {
      return res.json({ message: 'No tasks to schedule', sessions: [] });
    }

    // Remove only incomplete (pending) sessions so completed work is preserved
    const taskIds = tasks.map((t) => t.id);
    await prisma.studySession.deleteMany({
      where: { taskId: { in: taskIds }, completed: false },
    });

    const newSessions = generateSchedule(tasks, user.daily_available_hours);

    if (newSessions.length === 0) {
      return res.json({ message: 'All tasks are already complete', sessions: [] });
    }

    // Bulk insert sessions
    await prisma.studySession.createMany({ data: newSessions });

    // Return full sessions with task info
    const sessions = await prisma.studySession.findMany({
      where: { taskId: { in: taskIds } },
      include: { task: { select: { id: true, title: true, priority: true, difficulty: true } } },
      orderBy: { date: 'asc' },
    });

    res.json({ message: `Schedule generated: ${sessions.length} sessions`, sessions });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/schedule
 * Returns all study sessions for the authenticated user.
 */
async function getSchedule(req, res, next) {
  try {
    const tasks = await prisma.task.findMany({
      where: { userId: req.userId },
      select: { id: true },
    });
    const taskIds = tasks.map((t) => t.id);

    const sessions = await prisma.studySession.findMany({
      where: { taskId: { in: taskIds } },
      include: { task: { select: { id: true, title: true, priority: true, difficulty: true } } },
      orderBy: { date: 'asc' },
    });

    res.json(sessions);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/sessions/:id/complete
 * Mark a session complete or incomplete.
 * If marked incomplete, redistributes remaining hours for that task.
 */
async function updateSessionStatus(req, res, next) {
  try {
    const sessionId = Number(req.params.id);
    const { completed } = req.body;

    // Verify ownership via task → user
    const session = await prisma.studySession.findFirst({
      where: { id: sessionId },
      include: { task: true },
    });
    if (!session || session.task.userId !== req.userId) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const updated = await prisma.studySession.update({
      where: { id: sessionId },
      data: { completed: Boolean(completed) },
    });

    // If marked incomplete, recalculate completed_hours on the parent task
    if (!completed) {
      const task = await prisma.task.findUnique({
        where: { id: session.taskId },
        include: { sessions: true },
      });
      const completedHours = task.sessions
        .filter((s) => s.completed && s.id !== sessionId)
        .reduce((sum, s) => sum + s.duration, 0);

      await prisma.task.update({
        where: { id: session.taskId },
        data: { completed_hours: completedHours },
      });
    } else {
      // Track cumulative completed hours on the task for progress display
      const task = await prisma.task.findUnique({
        where: { id: session.taskId },
        include: { sessions: true },
      });
      const completedHours = task.sessions
        .filter((s) => s.completed || s.id === sessionId)
        .reduce((sum, s) => sum + s.duration, 0);

      await prisma.task.update({
        where: { id: session.taskId },
        data: { completed_hours: completedHours },
      });
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

module.exports = { generateScheduleHandler, getSchedule, updateSessionStatus };

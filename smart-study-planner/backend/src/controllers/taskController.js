const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const VALID_PRIORITIES = ['low', 'medium', 'high'];

async function getTasks(req, res, next) {
  try {
    const tasks = await prisma.task.findMany({
      where: { userId: req.userId },
      include: { sessions: true },
      orderBy: { deadline: 'asc' },
    });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
}

async function createTask(req, res, next) {
  try {
    const { title, deadline, estimated_hours, difficulty, priority } = req.body;

    if (!title || !deadline || !estimated_hours || !difficulty || !priority) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (!VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ error: 'Priority must be low, medium, or high' });
    }
    if (difficulty < 1 || difficulty > 5) {
      return res.status(400).json({ error: 'Difficulty must be between 1 and 5' });
    }

    const task = await prisma.task.create({
      data: {
        userId: req.userId,
        title,
        deadline: new Date(deadline),
        estimated_hours: Number(estimated_hours),
        difficulty: Number(difficulty),
        priority,
      },
      include: { sessions: true },
    });

    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

async function updateTask(req, res, next) {
  try {
    const taskId = Number(req.params.id);
    const existing = await prisma.task.findFirst({ where: { id: taskId, userId: req.userId } });
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { title, deadline, estimated_hours, difficulty, priority } = req.body;
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ error: 'Priority must be low, medium, or high' });
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(title && { title }),
        ...(deadline && { deadline: new Date(deadline) }),
        ...(estimated_hours !== undefined && { estimated_hours: Number(estimated_hours) }),
        ...(difficulty !== undefined && { difficulty: Number(difficulty) }),
        ...(priority && { priority }),
      },
      include: { sessions: true },
    });

    res.json(task);
  } catch (err) {
    next(err);
  }
}

async function deleteTask(req, res, next) {
  try {
    const taskId = Number(req.params.id);
    const existing = await prisma.task.findFirst({ where: { id: taskId, userId: req.userId } });
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await prisma.task.delete({ where: { id: taskId } });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getTasks, createTask, updateTask, deleteTask };

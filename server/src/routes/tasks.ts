import express from 'express';
import { AuthRequest, authenticateToken, requireAdmin } from '../middleware/auth';
import Task from '../models/Task';
import Project from '../models/Project';
import User from '../models/User';

const router = express.Router();

const VALID_STATUSES = ['PROPOSED', 'IN_PROGRESS', 'NEEDS_REVIEW', 'COMPLETE', 'ON_HOLD'];
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { projectId, status, assigneeId, search, priority, includeAll } = req.query;
    let query: any = {};
    if (projectId) query.project = projectId;
    if (status && VALID_STATUSES.includes(status as string)) query.status = status;
    if (priority && VALID_PRIORITIES.includes(priority as string)) query.priority = priority;
    if (assigneeId) query.assignees = assigneeId;
    if (search) query.title = { $regex: search, $options: 'i' };

    if (req.user!.role === 'MEMBER' && includeAll !== 'true') {
      query.assignees = req.user!.id;
    }

    const tasks = await Task.find(query)
      .populate('assignees', 'name email designation')
      .populate('project', 'name')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching tasks.' });
  }
});

router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { title, description, notes, dueDate, projectId, assigneeIds, priority } = req.body;

    if (!title || title.trim().length < 2) {
      res.status(400).json({ error: 'Task title is required and must be at least 2 characters.' });
      return;
    }
    if (!projectId) {
      res.status(400).json({ error: 'Project ID is required.' });
      return;
    }

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    if (assigneeIds && assigneeIds.length > 0) {
      for (const aid of assigneeIds) {
        const assignee = await User.findById(aid);
        if (!assignee || assignee.role !== 'MEMBER') {
          res.status(400).json({ error: `User ${aid} is not a valid member.` });
          return;
        }
        const isMember = project.members.some((m: any) => m.toString() === aid);
        if (!isMember) {
          res.status(400).json({ error: 'All assignees must be members of the project.' });
          return;
        }
      }
    }

    if (priority && !VALID_PRIORITIES.includes(priority)) {
      res.status(400).json({ error: `Invalid priority.` });
      return;
    }

    const task = new Task({
      title: title.trim(),
      description: description?.trim() || '',
      notes: notes?.trim() || '',
      dueDate: dueDate || undefined,
      project: projectId,
      assignees: assigneeIds || [],
      priority: priority || 'MEDIUM',
      status: 'PROPOSED' 
    });

    await task.save();
    const populatedTask = await Task.findById(task._id)
      .populate('assignees', 'name email designation')
      .populate('project', 'name');
    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ error: 'Error creating task.' });
  }
});

router.patch('/:id', authenticateToken, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { status, dueDate, assigneeIds, priority, notes } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }

    if (req.user!.role === 'MEMBER') {
      const isAssigned = task.assignees.some((a: any) => a.toString() === req.user!.id);
      if (!isAssigned) {
        res.status(403).json({ error: 'You can only update tasks assigned to you.' });
        return;
      }
      if (assigneeIds !== undefined || priority !== undefined) {
        res.status(403).json({ error: 'Members cannot change assignees or priority.' });
        return;
      }
    }

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        res.status(400).json({ error: `Invalid status.` });
        return;
      }
      task.status = status;
    }

    if (dueDate !== undefined) {
      task.dueDate = dueDate ? new Date(dueDate) : undefined;
    }

    if (notes !== undefined) {
      task.notes = notes;
    }

    if (priority !== undefined && req.user!.role === 'ADMIN') {
      if (!VALID_PRIORITIES.includes(priority)) {
        res.status(400).json({ error: `Invalid priority.` });
        return;
      }
      task.priority = priority;
    }

    if (assigneeIds !== undefined && req.user!.role === 'ADMIN') {
      if (assigneeIds && assigneeIds.length > 0) {
        const project = await Project.findById(task.project);
        for (const aid of assigneeIds) {
          const assignee = await User.findById(aid);
          if (!assignee || assignee.role !== 'MEMBER') {
            res.status(400).json({ error: `User ${aid} is not a valid member.` });
            return;
          }
          if (project) {
            const isMember = project.members.some((m: any) => m.toString() === aid);
            if (!isMember) {
              res.status(400).json({ error: 'All assignees must be members of the project.' });
              return;
            }
          }
        }
        
        const hadAssignees = task.assignees.length > 0;
        task.assignees = assigneeIds;
        if (!hadAssignees && assigneeIds.length > 0) {
          task.status = 'PROPOSED';
        }
      } else {
        task.assignees = [];
      }
    }

    await task.save();
    const updatedTask = await Task.findById(task._id)
      .populate('assignees', 'name email designation')
      .populate('project', 'name');
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: 'Error updating task.' });
  }
});

router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }
    res.json({ message: 'Task deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting task.' });
  }
});

export default router;

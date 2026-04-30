import express from 'express';
import { AuthRequest, authenticateToken, requireAdmin } from '../middleware/auth';
import Project from '../models/Project';
import User from '../models/User';
import Task from '../models/Task';

const router = express.Router();
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    let projects;
    if (req.user!.role === 'ADMIN') {
      projects = await Project.find()
        .populate('owner', 'name email')
        .populate('members', 'name email')
        .sort({ createdAt: -1 });
    } else {
      projects = await Project.find({ members: req.user!.id })
        .populate('owner', 'name email')
        .populate('members', 'name email')
        .sort({ createdAt: -1 });
    }
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching projects.' });
  }
});

router.get('/:id', authenticateToken, async (req: AuthRequest, res): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name email');

    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    if (req.user!.role === 'MEMBER') {
      const isMember = project.members.some((m: any) => m._id.toString() === req.user!.id);
      if (!isMember) {
        res.status(403).json({ error: 'Access denied. You are not a member of this project.' });
        return;
      }
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching project.' });
  }
});

router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { name, description, memberIds, priority } = req.body;

    if (!name || name.trim().length < 2) {
      res.status(400).json({ error: 'Project name is required and must be at least 2 characters.' });
      return;
    }

    if (priority && !VALID_PRIORITIES.includes(priority)) {
      res.status(400).json({ error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` });
      return;
    }

    if (memberIds && memberIds.length > 0) {
      const members = await User.find({ _id: { $in: memberIds }, role: 'MEMBER' });
      if (members.length !== memberIds.length) {
        res.status(400).json({ error: 'One or more member IDs are invalid or belong to admin users.' });
        return;
      }
    }

    const project = new Project({
      name: name.trim(),
      description: description?.trim() || '',
      priority: priority || 'MEDIUM',
      owner: req.user!.id,
      members: memberIds || []
    });

    await project.save();
    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('members', 'name email');
    res.status(201).json(populatedProject);
  } catch (error) {
    res.status(500).json({ error: 'Error creating project.' });
  }
});

router.patch('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { priority } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    if (priority) {
      if (!VALID_PRIORITIES.includes(priority)) {
        res.status(400).json({ error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` });
        return;
      }
      project.priority = priority;
    }

    await project.save();
    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('members', 'name email');
    res.json(populatedProject);
  } catch (error) {
    res.status(500).json({ error: 'Error updating project.' });
  }
});

router.post('/:id/members', authenticateToken, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ error: 'userId is required.' });
      return;
    }

    const memberUser = await User.findById(userId);
    if (!memberUser) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    if (memberUser.role !== 'MEMBER') {
      res.status(400).json({ error: 'Only users with MEMBER role can be added to projects.' });
      return;
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    const alreadyMember = project.members.some((m: any) => m.toString() === userId);
    if (alreadyMember) {
      res.status(400).json({ error: 'User is already a member of this project.' });
      return;
    }

    project.members.push(userId);
    await project.save();

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('members', 'name email');
    res.json(populatedProject);
  } catch (error) {
    res.status(500).json({ error: 'Error adding member to project.' });
  }
});

router.delete('/:id/members/:userId', authenticateToken, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    project.members = project.members.filter((m: any) => m.toString() !== req.params.userId);
    await project.save();

    await Task.updateMany(
      { project: req.params.id, assignees: req.params.userId } as any,
      { $pull: { assignees: req.params.userId } } as any
    );

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('members', 'name email');
    res.json(populatedProject);
  } catch (error) {
    res.status(500).json({ error: 'Error removing member from project.' });
  }
});

router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    await Task.deleteMany({ project: req.params.id });

    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project and all its tasks deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting project.' });
  }
});

export default router;

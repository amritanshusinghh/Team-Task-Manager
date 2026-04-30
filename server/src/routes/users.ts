import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import User from '../models/User';

const router = express.Router();

// Get all members (Admin only) — used to populate dropdowns for assigning members
router.get('/members', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const members = await User.find({ role: 'MEMBER' }).select('-password');
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching members.' });
  }
});

export default router;

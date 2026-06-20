
const express = require('express');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);


router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, status, last_login, created_at
       FROM users
       ORDER BY last_login DESC NULLS LAST, created_at DESC`
    );
    res.json({ users: result.rows });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

router.post('/block', async (req, res) => {
  const { userIds } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ error: 'No users selected.' });
  }

  try {
    await pool.query(
      `UPDATE users SET status = 'blocked' WHERE id = ANY($1::uuid[])`,
      [userIds]
    );

    res.json({ message: `${userIds.length} user(s) blocked successfully.` });
  } catch (err) {
    console.error('Block users error:', err);
    res.status(500).json({ error: 'Failed to block users.' });
  }
});


router.post('/unblock', async (req, res) => {
  const { userIds } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ error: 'No users selected.' });
  }

  try {
    await pool.query(
      `UPDATE users SET status = 'active' WHERE id = ANY($1::uuid[]) AND status = 'blocked'`,
      [userIds]
    );

    res.json({ message: `Users unblocked successfully.` });
  } catch (err) {
    console.error('Unblock users error:', err);
    res.status(500).json({ error: 'Failed to unblock users.' });
  }
});

router.post('/delete', async (req, res) => {
  const { userIds } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ error: 'No users selected.' });
  }

  try {
    await pool.query(
      `DELETE FROM users WHERE id = ANY($1::uuid[])`,
      [userIds]
    );

    res.json({ message: `${userIds.length} user(s) deleted successfully.` });
  } catch (err) {
    console.error('Delete users error:', err);
    res.status(500).json({ error: 'Failed to delete users.' });
  }
});


router.post('/delete-unverified', async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM users WHERE status = 'unverified' RETURNING id`
    );

    res.json({ message: `${result.rowCount} unverified user(s) deleted.` });
  } catch (err) {
    console.error('Delete unverified error:', err);
    res.status(500).json({ error: 'Failed to delete unverified users.' });
  }
});

module.exports = router;

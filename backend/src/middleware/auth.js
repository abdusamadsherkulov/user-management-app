
const jwt = require('jsonwebtoken');
const { pool } = require('../db');

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided. Please log in.' });
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }

  try {
    const result = await pool.query(
      'SELECT id, name, email, status FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Account not found. Please register again.', redirect: true });
    }

    const user = result.rows[0];

    if (user.status === 'blocked') {
      return res.status(403).json({ error: 'Your account has been blocked.', redirect: true });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Server error during authentication.' });
  }
}

module.exports = { requireAuth };

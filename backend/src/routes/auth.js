
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');
const { pool, getUniqIdValue } = require('../db');

const router = express.Router();

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendVerificationEmail(email, name, token) {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  console.log('\n========================================');
  console.log('EMAIL VERIFICATION LINK:');
  console.log(verifyUrl);
  console.log('========================================\n');

  if (!process.env.RESEND_API_KEY) {
    console.log('No RESEND_API_KEY set - email not sent, use console link above');
    return;
  }

  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Verify your User Management account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Welcome, ${name}!</h2>
          <p>Click the button below to verify your email address:</p>
          <a href="${verifyUrl}" style="display:inline-block;padding:10px 20px;background:#0d6efd;color:#fff;text-decoration:none;border-radius:4px;">
            Verify Email
          </a>
          <p style="margin-top:16px;color:#666;font-size:13px;">
            Or copy this link: <a href="${verifyUrl}">${verifyUrl}</a>
          </p>
          <p style="color:#999;font-size:12px;">If you did not register, ignore this email.</p>
        </div>
      `
    });
    console.log(`Verification email sent to ${email}`);
  } catch (err) {
    console.error('Failed to send verification email:', err.message);
  }
}

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  if (name.trim().length === 0) {
    return res.status(400).json({ error: 'Name cannot be empty.' });
  }

  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  if (password.length === 0) {
    return res.status(400).json({ error: 'Password cannot be empty.' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = getUniqIdValue();

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, status, verification_token)
       VALUES ($1, $2, $3, 'unverified', $4)
       RETURNING id, name, email, status, created_at`,
      [name.trim(), email.toLowerCase().trim(), passwordHash, verificationToken]
    );

    const newUser = result.rows[0];

    sendVerificationEmail(email, name, verificationToken).catch(console.error);

    res.status(201).json({
      message: 'Registration successful! A verification email has been sent. You can log in right away.',
      user: { id: newUser.id, name: newUser.name, email: newUser.email }
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
      [email.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];

    if (user.status === 'blocked') {
      return res.status(403).json({ error: 'Your account has been blocked.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful.',
      token,
      user: { id: user.id, name: user.name, email: user.email, status: user.status }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

router.get('/verify-email', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Verification token is required.' });
  }

  try {
    const result = await pool.query(
      `UPDATE users
       SET status = CASE WHEN status = 'blocked' THEN 'blocked' ELSE 'active' END,
           verification_token = NULL
       WHERE verification_token = $1
       RETURNING id, name, email, status`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or already used verification token.' });
    }

    res.json({ message: 'Email verified successfully! Your account is now active.' });
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
});

module.exports = router;

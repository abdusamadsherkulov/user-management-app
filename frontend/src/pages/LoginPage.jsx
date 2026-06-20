import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const authError = localStorage.getItem('authError');
    if (authError) {
      setError(authError);
      localStorage.removeItem('authError');
    }
  }, []);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow-sm" style={{ width: '100%', maxWidth: '420px' }}>
        <div className="card-body p-4">
          <div className="mb-4">
            <h4 className="fw-bold mb-1">Sign in</h4>
            <p className="text-muted small mb-0">User Management System</p>
          </div>

          {error && (
            <div className="alert alert-danger py-2 small" role="alert">
              <i className="bi bi-exclamation-circle me-2"></i>{error}
            </div>
          )}

          {info && (
            <div className="alert alert-info py-2 small" role="alert">
              <i className="bi bi-info-circle me-2"></i>{info}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label className="form-label small fw-medium" htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-control"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label small fw-medium" htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                className="form-control"
                placeholder="Your password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading}
            >
              {loading
                ? <><span className="spinner-border spinner-border-sm me-2"></span>Signing in...</>
                : 'Sign in'
              }
            </button>
          </form>

          <hr className="my-3" />

          <p className="text-center small mb-0 text-muted">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary text-decoration-none fw-medium">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

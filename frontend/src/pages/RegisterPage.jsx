import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await api.post('/auth/register', form);
      setSuccess(res.data.message);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow-sm" style={{ width: '100%', maxWidth: '420px' }}>
        <div className="card-body p-4">
          <div className="mb-4">
            <h4 className="fw-bold mb-1">Create account</h4>
            <p className="text-muted small mb-0">User Management System</p>
          </div>

          {error && (
            <div className="alert alert-danger py-2 small" role="alert">
              <i className="bi bi-exclamation-circle me-2"></i>{error}
            </div>
          )}

          {success && (
            <div className="alert alert-success py-2 small" role="alert">
              <i className="bi bi-check-circle me-2"></i>{success}
              <div className="mt-1 text-muted">Redirecting to login...</div>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-3">
                <label className="form-label small fw-medium" htmlFor="name">Full name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  className="form-control"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                />
              </div>

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
                <label className="form-label small fw-medium" htmlFor="password">
                  Password
                  <span
                    className="ms-1 text-muted"
                    data-bs-toggle="tooltip"
                    title="Any non-empty password is accepted"
                  >
                    <i className="bi bi-info-circle-fill small"></i>
                  </span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="form-control"
                  placeholder="Any password (even 1 character)"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={loading}
              >
                {loading
                  ? <><span className="spinner-border spinner-border-sm me-2"></span>Creating account...</>
                  : 'Create account'
                }
              </button>
            </form>
          )}

          <hr className="my-3" />

          <p className="text-center small mb-0 text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-primary text-decoration-none fw-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

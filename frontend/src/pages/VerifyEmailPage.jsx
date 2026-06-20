import React, { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('No verification token found in the URL.');
      return;
    }

    api.get(`/auth/verify-email?token=${token}`)
      .then(res => {
        setStatus('success');
        setMessage(res.data.message);
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Verification failed. The link may have expired.');
      });
  }, []);

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow-sm text-center" style={{ width: '100%', maxWidth: '420px' }}>
        <div className="card-body p-4">
          {status === 'verifying' && (
            <>
              <div className="spinner-border text-primary mb-3" role="status"></div>
              <p className="text-muted">Verifying your email...</p>
            </>
          )}
          {status === 'success' && (
            <>
              <i className="bi bi-check-circle-fill text-success fs-1 mb-3 d-block"></i>
              <h5 className="fw-bold">Email Verified</h5>
              <p className="text-muted small">{message}</p>
              <Link to="/login" className="btn btn-primary mt-2">Sign in</Link>
            </>
          )}
          {status === 'error' && (
            <>
              <i className="bi bi-x-circle-fill text-danger fs-1 mb-3 d-block"></i>
              <h5 className="fw-bold">Verification Failed</h5>
              <p className="text-muted small">{message}</p>
              <Link to="/login" className="btn btn-outline-primary mt-2">Go to Login</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function formatLastLogin(dateStr) {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function statusBadge(status) {
  const map = {
    active: 'bg-success',
    blocked: 'bg-danger',
    unverified: 'bg-warning text-dark'
  };
  return map[status] || 'bg-secondary';
}

export default function AdminPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.users);
      setSelected(new Set());
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to load users.';
      showToast(msg, 'danger');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(filter.toLowerCase()) ||
    u.email.toLowerCase().includes(filter.toLowerCase())
  );

  function handleSelectAll(e) {
    if (e.target.checked) {
      setSelected(new Set(filteredUsers.map(u => u.id)));
    } else {
      setSelected(new Set());
    }
  }

  function handleSelectOne(id) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleAction(endpoint, body, successMsg) {
    setActionLoading(true);
    try {
      const res = await api.post(`/users/${endpoint}`, body);
      showToast(res.data.message || successMsg, 'success');
      await fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.error || 'Action failed. Please try again.';
      showToast(msg, 'danger');
    } finally {
      setActionLoading(false);
    }
  }

  function handleBlock() {
    if (selected.size === 0) return;
    handleAction('block', { userIds: [...selected] }, 'Users blocked.');
  }

  function handleUnblock() {
    if (selected.size === 0) return;
    handleAction('unblock', { userIds: [...selected] }, 'Users unblocked.');
  }

  function handleDelete() {
    if (selected.size === 0) return;
    handleAction('delete', { userIds: [...selected] }, 'Users deleted.');
  }

  function handleDeleteUnverified() {
    handleAction('delete-unverified', {}, 'Unverified users deleted.');
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  const allSelected = filteredUsers.length > 0 && filteredUsers.every(u => selected.has(u.id));
  const someSelected = selected.size > 0 && !allSelected;
  const noneSelected = selected.size === 0;

  return (
    <div className="min-vh-100 bg-light">
      <nav className="navbar navbar-light bg-white border-bottom shadow-sm">
        <div className="container-fluid px-4">
          <span className="navbar-brand fw-bold fs-5 mb-0">
            <i className="bi bi-people-fill me-2 text-primary"></i>
            User Management
          </span>
          <div className="d-flex align-items-center gap-3">
            <span className="text-muted small">
              <i className="bi bi-person-circle me-1"></i>
              {currentUser.name}
              <span className="ms-2 badge bg-secondary fw-normal">{currentUser.status}</span>
            </span>
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={handleLogout}
              title="Sign out"
            >
              <i className="bi bi-box-arrow-right me-1"></i>Sign out
            </button>
          </div>
        </div>
      </nav>

      {toast && (
        <div
          className={`position-fixed top-0 end-0 m-3 alert alert-${toast.type} shadow d-flex align-items-center py-2 px-3`}
          style={{ zIndex: 9999, minWidth: '280px' }}
          role="alert"
        >
          <i className={`bi ${toast.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle'} me-2`}></i>
          <span className="small">{toast.message}</span>
        </div>
      )}

      <div className="container-fluid px-4 py-4">
        <div className="card shadow-sm">
          <div className="card-body p-0">

            <div className="d-flex align-items-center gap-2 p-3 border-bottom flex-wrap">
              <button
                className="btn btn-outline-danger btn-sm"
                onClick={handleBlock}
                disabled={noneSelected || actionLoading}
                title="Block selected users"
                data-bs-toggle="tooltip"
              >
                <i className="bi bi-lock-fill me-1"></i>Block
              </button>

              <button
                className="btn btn-outline-success btn-sm"
                onClick={handleUnblock}
                disabled={noneSelected || actionLoading}
                title="Unblock selected users"
              >
                <i className="bi bi-unlock-fill"></i>
              </button>

              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={handleDelete}
                disabled={noneSelected || actionLoading}
                title="Delete selected users"
              >
                <i className="bi bi-trash3-fill"></i>
              </button>

              <button
                className="btn btn-outline-warning btn-sm"
                onClick={handleDeleteUnverified}
                disabled={actionLoading}
                title="Delete all unverified users"
              >
                <i className="bi bi-person-x-fill"></i>
              </button>

              <button
                className="btn btn-outline-primary btn-sm"
                onClick={fetchUsers}
                disabled={actionLoading}
                title="Refresh user list"
              >
                <i className="bi bi-arrow-clockwise"></i>
              </button>

              {selected.size > 0 && (
                <span className="text-muted small ms-1">
                  {selected.size} selected
                </span>
              )}

              <div className="ms-auto">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Filter by name or email..."
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                  style={{ minWidth: '200px' }}
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="text-muted mt-2 small">Loading users...</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover table-sm align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '40px' }} className="text-center">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={allSelected}
                          ref={el => { if (el) el.indeterminate = someSelected; }}
                          onChange={handleSelectAll}
                          title="Select all / Deselect all"
                        />
                      </th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>
                        Last Login
                        <i className="bi bi-arrow-down ms-1 text-muted small" title="Sorted by most recent"></i>
                      </th>
                      <th>Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center text-muted py-4">
                          {filter ? 'No users match your filter.' : 'No users found.'}
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(user => {
                        const isCurrentUser = user.id === currentUser.id;
                        const isSelected = selected.has(user.id);
                        return (
                          <tr
                            key={user.id}
                            className={`${isSelected ? 'table-active' : ''} ${user.status === 'blocked' ? 'text-decoration-line-through text-muted' : ''}`}
                          >
                            <td className="text-center">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={isSelected}
                                onChange={() => handleSelectOne(user.id)}
                              />
                            </td>
                            <td>
                              <span className="fw-medium">
                                {user.name}
                                {isCurrentUser && (
                                  <span className="badge bg-primary ms-2 fw-normal small" title="This is you">
                                    you
                                  </span>
                                )}
                              </span>
                            </td>
                            <td className="text-muted small">{user.email}</td>
                            <td>
                              <span className={`badge ${statusBadge(user.status)} fw-normal`}>
                                {user.status}
                              </span>
                            </td>
                            <td
                              className="small text-muted"
                              title={user.last_login ? new Date(user.last_login).toLocaleString() : 'Never logged in'}
                            >
                              {formatLastLogin(user.last_login)}
                            </td>
                            <td className="small text-muted">
                              {new Date(user.created_at).toLocaleDateString('en-GB')}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="px-3 py-2 border-top text-muted small">
              {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
              {filter && ` matching "${filter}"`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

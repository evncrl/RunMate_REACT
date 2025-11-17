import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import '../../css/AdminUsers.css';

const API_URL = 'http://localhost:5000/api/admin';

function AdminUsers() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingUser, setEditingUser] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    isAdmin: false
  });

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (!currentUser.isAdmin) {
      navigate('/products');
      return;
    }

    fetchUsers();
  }, [currentUser, search, page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      if (search) params.append('search', search);

      const response = await fetch(`${API_URL}/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
        setTotalPages(data.pages);
      } else {
        setError(data.message || 'Failed to fetch users');
      }
    } catch (err) {
      setError('Error loading users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      // Use signup endpoint to create user (public endpoint, no auth needed)
      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (data.success) {
        // If admin checkbox was checked, update the user using admin endpoint
        if (formData.isAdmin) {
          const token = localStorage.getItem('token');
          await fetch(`${API_URL}/users/${data.user.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ isAdmin: true })
          });
        }
        setShowCreateForm(false);
        setFormData({ name: '', email: '', password: '', isAdmin: false });
        fetchUsers();
        alert('User created successfully');
      } else {
        alert(data.message || 'Failed to create user');
      }
    } catch (err) {
      alert('Error creating user');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '',
      isAdmin: user.isAdmin || false
    });
  };

  const handleUpdate = async (userId, updateData = null) => {
    try {
      const token = localStorage.getItem('token');
      const dataToUpdate = updateData || {
        name: formData.name,
        email: formData.email,
        isAdmin: formData.isAdmin
      };

      // Only include password if it's provided
      if (formData.password) {
        dataToUpdate.password = formData.password;
      }

      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToUpdate)
      });

      const data = await response.json();

      if (data.success) {
        setEditingUser(null);
        setFormData({ name: '', email: '', password: '', isAdmin: false });
        fetchUsers();
        alert('User updated successfully');
      } else {
        alert(data.message || 'Failed to update user');
      }
    } catch (err) {
      alert('Error updating user');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    if (userId === currentUser.id) {
      alert('Cannot delete your own account');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        fetchUsers();
        alert('User deleted successfully');
      } else {
        alert(data.message || 'Failed to delete user');
      }
    } catch (err) {
      alert('Error deleting user');
    }
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', isAdmin: false });
  };

  if (loading && users.length === 0) {
    return (
      <div className="admin-users">
        <div className="loading">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="admin-users">
      <Sidebar />
      <div className="admin-users-content">
        <Topbar />
        <div className="admin-users-main">
          <div className="admin-users-header">
            <h1>User Management</h1>
            <div className="header-actions">
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="search-input"
              />
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="btn-create"
              >
                {showCreateForm ? 'Cancel' : '+ Create User'}
              </button>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          {showCreateForm && (
            <div className="create-form">
              <h2>Create New User</h2>
              <form onSubmit={handleCreate}>
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.isAdmin}
                      onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                    />
                    Admin User
                  </label>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-submit">Create User</button>
                  <button type="button" onClick={() => setShowCreateForm(false)} className="btn-cancel">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {users.length === 0 ? (
            <div className="no-users">No users found</div>
          ) : (
            <>
              <div className="users-table-container">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id || user.id}>
                        {editingUser && editingUser._id === user._id ? (
                          <td colSpan="5">
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleUpdate(user._id || user.id);
                              }}
                              className="edit-form-inline"
                            >
                              <div className="form-row">
                                <input
                                  type="text"
                                  value={formData.name}
                                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                  placeholder="Name"
                                  required
                                />
                                <input
                                  type="email"
                                  value={formData.email}
                                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                  placeholder="Email"
                                  required
                                />
                                <input
                                  type="password"
                                  value={formData.password}
                                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                  placeholder="New Password (leave empty to keep current)"
                                />
                                <label className="checkbox-label">
                                  <input
                                    type="checkbox"
                                    checked={formData.isAdmin}
                                    onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                                  />
                                  Admin
                                </label>
                                <button type="submit" className="btn-save">Save</button>
                                <button type="button" onClick={cancelEdit} className="btn-cancel">
                                  Cancel
                                </button>
                              </div>
                            </form>
                          </td>
                        ) : (
                          <>
                            <td>{user.name || 'N/A'}</td>
                            <td>{user.email}</td>
                            <td>
                              <span className={user.isAdmin ? 'badge-admin' : 'badge-user'}>
                                {user.isAdmin ? 'Admin' : 'User'}
                              </span>
                            </td>
                            <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                            <td>
                              <button
                                onClick={() => handleEdit(user)}
                                className="btn-edit"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(user._id || user.id)}
                                className="btn-delete"
                                disabled={user._id === currentUser.id || user.id === currentUser.id}
                              >
                                Delete
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </button>
                  <span>Page {page} of {totalPages}</span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminUsers;


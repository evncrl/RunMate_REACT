import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import SalesChart from './SalesChart';
import '../../css/AdminDashboard.css';

const API_URL = 'http://localhost:5000/api/admin';

function AdminDashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (!currentUser.isAdmin) {
      navigate('/products');
      return;
    }

    fetchDashboardData();
  }, [currentUser]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
        setRecentOrders(data.recentOrders || []);
        setRecentUsers(data.recentUsers || []);
      } else {
        setError(data.message || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      setError('Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'text-yellow-600',
      processing: 'text-blue-600',
      shipped: 'text-purple-600',
      delivered: 'text-green-600',
      cancelled: 'text-red-600'
    };
    return colors[status] || 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <Sidebar />
      <div className="dashboard-content">
        <Topbar />
        <div className="dashboard-main">
          <div className="stats-grid">
            <div className="stat-card">
              <h3 className="stat-title">Total Users</h3>
              <p className="stat-value">{stats?.totalUsers || 0}</p>
            </div>

            <div className="stat-card">
              <h3 className="stat-title">Total Orders</h3>
              <p className="stat-value">{stats?.totalOrders || 0}</p>
            </div>

            <div className="stat-card">
              <h3 className="stat-title">Total Products</h3>
              <p className="stat-value">{stats?.totalProducts || 0}</p>
            </div>

            <div className="stat-card">
              <h3 className="stat-title">Total Revenue</h3>
              <p className="stat-value">${(stats?.totalRevenue || 0).toFixed(2)}</p>
            </div>
          </div>

          <div className="dashboard-section">
            <h2 className="section-title">Recent Orders</h2>
            {recentOrders.length === 0 ? (
              <p className="no-data">No orders found</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order._id}>
                      <td>#{order._id.slice(-8)}</td>
                      <td>{order.user?.name || order.user?.email || 'N/A'}</td>
                      <td>${order.totalAmount.toFixed(2)}</td>
                      <td className={getStatusColor(order.status)}>
                        {order.status}
                      </td>
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="dashboard-section">
            <h2 className="section-title">Recent Users</h2>
            {recentUsers.length === 0 ? (
              <p className="no-data">No users found</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map((user) => (
                    <tr key={user._id}>
                      <td>{user.name || 'N/A'}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={user.isAdmin ? 'badge-admin' : 'badge-user'}>
                          {user.isAdmin ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Sales Chart Section */}
      <div className="dashboard-section">
        <SalesChart />
      </div>
    </div>
  );
}

export default AdminDashboard;

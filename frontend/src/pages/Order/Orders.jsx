import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../css/Orders.css';

const API_URL = 'http://localhost:5000/api/orders';

function Orders() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`${API_URL}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setOrders(data.orders);
      } else {
        setError(data.message || 'Failed to fetch orders');
      }
    } catch (err) {
      setError('Error loading orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (data.success) {
        fetchOrders();
      } else {
        alert(data.message || 'Failed to update order');
      }
    } catch (err) {
      alert('Error updating order');
    }
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        fetchOrders();
      } else {
        alert(data.message || 'Failed to delete order');
      }
    } catch (err) {
      alert('Error deleting order');
    }
  };

  if (loading) {
    return <div className="orders-container">Loading...</div>;
  }

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h1>My Orders</h1>
        <Link to="/orders/new" className="btn-primary">
          Create New Order
        </Link>
      </div>

      <div className="orders-filters">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="status-select"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {error && <div className="error-message">{error}</div>}

      {orders.length === 0 ? (
        <div className="no-orders">
          <p>No orders found</p>
          <Link to="/orders/new" className="btn-primary">
            Create Your First Order
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <div>
                  <h3>Order #{order._id.slice(-8)}</h3>
                  <p className="order-date">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="order-status">
                  <span className={`status-badge status-${order.status}`}>
                    {order.status}
                  </span>
                </div>
              </div>

              <div className="order-items">
                <h4>Items:</h4>
                    {order.items.map((item, index) => (
                  <div key={index} className="order-item">
                    {item.product?.photos?.[0] && (
                      <img
                        src={item.product.photos[0]}
                            alt={item.product.name || item.productName}
                        className="item-image"
                      />
                    )}
                    <div className="item-details">
                          <p className="item-name">{item.product?.name || item.productName || 'Product'}</p>
                      <p className="item-quantity">Quantity: {item.quantity}</p>
                      <p className="item-price">${item.price} each</p>
                    </div>
                    {order.status === 'delivered' && (
                      <div className="item-review-action">
                        {/* Sa future, pwede mo 'tong lagyan ng check
                          para 'pag na-review na, iba ang lalabas.
                          e.g., !item.isReviewed ? ( ... link ... ) : ( <p>Reviewed</p> )
                        */}
                        <Link 
                          to={`/review?productId=${item.product?._id}&orderId=${order._id}&itemId=${item._id}`}
                          className="btn-review"
                        >
                          Leave Review
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="order-footer">
                <div className="order-total">
                  <strong>Total: ${order.totalAmount.toFixed(2)}</strong>
                </div>
                <div className="order-actions">
                  <Link to={`/orders/${order._id}`} className="btn-view">
                    View Details
                  </Link>
                  {order.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(order._id, 'cancelled')}
                        className="btn-cancel"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(order._id)}
                        className="btn-delete"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Orders;


import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../css/OrderDetail.css';

const API_URL = 'http://localhost:5000/api/orders';

function OrderDetail() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setOrder(data.order);
      } else {
        setError(data.message || 'Order not found');
      }
    } catch (err) {
      setError('Error loading order');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="order-detail-container">Loading...</div>;
  }

  if (error || !order) {
    return <div className="order-detail-container">{error || 'Order not found'}</div>;
  }

  return (
    <div className="order-detail-container">
      <Link to="/orders" className="back-link">← Back to Orders</Link>

      <div className="order-detail-card">
        <div className="order-header">
          <div>
            <h1>Order #{order._id.slice(-8)}</h1>
            <p className="order-date">
              Placed on {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="order-status">
            <span className={`status-badge status-${order.status}`}>
              {order.status}
            </span>
            <span className={`payment-badge payment-${order.paymentStatus}`}>
              Payment: {order.paymentStatus}
            </span>
          </div>
        </div>

        <div className="order-items-section">
          <h2>Order Items</h2>
          {order.items.map((item, index) => (
            <div key={index} className="order-item-detail">
              {item.product?.photos?.[0] && (
                <img
                  src={item.product.photos[0]}
                  alt={item.product.name || item.productName}
                  className="item-image"
                />
              )}
              <div className="item-details">
                <h3>{item.product?.name || item.productName || 'Product'}</h3>
                <p className="item-description">{item.product?.description}</p>
                <div className="item-meta">
                  <span>Quantity: {item.quantity}</span>
                  <span>Price: ${item.price} each</span>
                  <span className="item-subtotal">
                    Subtotal: ${(item.quantity * item.price).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="order-info-grid">
          <div className="shipping-info">
            <h2>Shipping Address</h2>
            <div className="address-details">
              <p>{order.shippingAddress.street}</p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                {order.shippingAddress.zipCode}
              </p>
              <p>{order.shippingAddress.country}</p>
            </div>
          </div>

          <div className="payment-info">
            <h2>Payment Information</h2>
            <div className="payment-details">
              <p>
                <strong>Method:</strong> {order.paymentMethod.replace('_', ' ').toUpperCase()}
              </p>
              <p>
                <strong>Status:</strong>{' '}
                <span className={`payment-status payment-${order.paymentStatus}`}>
                  {order.paymentStatus}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="order-summary">
          <h2>Order Summary</h2>
          <div className="summary-row">
            <span>Subtotal:</span>
            <span>${order.totalAmount.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Shipping:</span>
            <span>Free</span>
          </div>
          <div className="summary-row total-row">
            <span>Total:</span>
            <span>${order.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetail;


import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import '../../css/OrderForm.css';

const API_URL = 'http://localhost:5000/api/payments/confirm';

function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      setStatus('error');
      setError('Missing session information.');
      return;
    }

    const confirmPayment = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ sessionId })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Unable to confirm payment.');
        }

        clearCart();
        setOrderId(data.order?._id);
        setStatus('success');
      } catch (err) {
        setStatus('error');
        setError(err.message || 'Unable to verify payment.');
      }
    };

    confirmPayment();
  }, [searchParams, clearCart]);

  const handleViewOrder = () => {
    if (orderId) {
      navigate(`/orders/${orderId}`);
    } else {
      navigate('/orders');
    }
  };

  return (
    <div className="order-form-container">
      <h1>Payment Confirmation</h1>
      {status === 'loading' && (
        <p>We&apos;re verifying your payment. Please wait...</p>
      )}
      {status === 'success' && (
        <>
          <p>Payment confirmed! A PDF receipt has been sent to your email.</p>
          <button className="btn-submit" onClick={handleViewOrder}>
            View Order
          </button>
          <Link to="/orders" className="back-link">
            ← Back to Orders
          </Link>
        </>
      )}
      {status === 'error' && (
        <>
          <p className="error-message">{error}</p>
          <Link to="/orders" className="back-link">
            ← Back to Orders
          </Link>
        </>
      )}
    </div>
  );
}

export default CheckoutSuccess;



import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import '../../css/OrderForm.css';

const API_URL = 'http://localhost:5000/api';

function OrderForm() {
  const { currentUser } = useAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Load cart from CartContext
    if (cartItems.length > 0) {
      fetchProducts(cartItems);
    }
  }, [cartItems, currentUser, navigate]);

  const fetchProducts = async (items) => {
    try {
      const productIds = items.map(item => item.productId);
      const productPromises = productIds.map(id =>
        fetch(`${API_URL}/products/${id}`).then(res => res.json())
      );
      const productData = await Promise.all(productPromises);
      setProducts(productData.filter(p => p.success).map(p => p.product));
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/products?limit=100`);
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const product = products.find(p => p._id === item.productId);
      return total + (product?.price || item.price) * item.quantity;
    }, 0);
  };

  const startStripeCheckout = async () => {
    if (cartItems.length === 0) {
      setError('Please add at least one product to the order');
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/payments/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        shippingAddress
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to start checkout session');
    }

    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error('Missing Stripe checkout URL');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await startStripeCheckout();
    } catch (err) {
      setError(err.message || 'Unable to start checkout');
      setLoading(false);
    }
  };

  return (
    <div className="order-form-container">
      <h1>Create New Order</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="order-form-layout">
        <div className="order-section">
          <h2>Order Summary</h2>

          {cartItems.length === 0 ? (
            <p className="empty-cart">No items in cart. <Link to="/">Add products</Link></p>
          ) : (
            <div className="cart-items">
              {cartItems.map((item) => {
                const product = products.find(p => p._id === item.productId) || item.product;
                return (
                  <div key={item.productId} className="cart-item">
                    {product?.photos?.[0] && (
                      <img src={product.photos[0]} alt={product.name} />
                    )}
                    <div className="item-info">
                      <h4>{product?.name || 'Product'}</h4>
                      <p>${product?.price || item.price} each</p>
                    </div>
                    <div className="item-quantity">
                      <span>Qty: {item.quantity}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="order-total">
            <strong>Total: ${calculateTotal().toFixed(2)}</strong>
          </div>

          <form onSubmit={handleSubmit} className="order-form">
            <h3>Shipping Address</h3>
            <div className="form-group">
              <label>Street *</label>
              <input
                type="text"
                value={shippingAddress.street}
                onChange={(e) => setShippingAddress({...shippingAddress, street: e.target.value})}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>City *</label>
                <input
                  type="text"
                  value={shippingAddress.city}
                  onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>State *</label>
                <input
                  type="text"
                  value={shippingAddress.state}
                  onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Zip Code *</label>
                <input
                  type="text"
                  value={shippingAddress.zipCode}
                  onChange={(e) => setShippingAddress({...shippingAddress, zipCode: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Country *</label>
                <input
                  type="text"
                  value={shippingAddress.country}
                  onChange={(e) => setShippingAddress({...shippingAddress, country: e.target.value})}
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading || cartItems.length === 0} className="btn-submit">
              {loading ? 'Redirecting...' : 'Pay with Stripe'}
            </button>
            <p className="checkout-note">
              Secure payments are processed via Stripe Checkout. You will receive an email with the PDF receipt after payment.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default OrderForm;


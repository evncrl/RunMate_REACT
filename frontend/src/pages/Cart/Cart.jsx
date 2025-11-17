import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import '../../css/Cart.css';

function Cart() {
  const { cartItems, removeFromCart, updateQuantity, clearCart, getCartTotal } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleCheckout = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Navigate to order form with cart items
    navigate('/orders/new');
  };

  const handleQuantityChange = (productId, newQuantity) => {
    const quantity = parseInt(newQuantity);
    if (quantity > 0) {
      updateQuantity(productId, quantity);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-container">
        <div className="cart-empty">
          <h2>Your cart is empty</h2>
          <p>Add some products to get started!</p>
          <Link to="/" className="btn-continue-shopping">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const total = getCartTotal();

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h1>Shopping Cart</h1>
        <button onClick={clearCart} className="btn-clear-cart">
          Clear Cart
        </button>
      </div>

      <div className="cart-content">
        <div className="cart-items">
          {cartItems.map((item) => (
            <div key={item.productId} className="cart-item">
              {item.product?.photos?.[0] && (
                <div className="cart-item-image">
                  <img src={item.product.photos[0]} alt={item.product.name} />
                </div>
              )}
              <div className="cart-item-details">
                <h3 className="cart-item-name">
                  <Link to={`/products/${item.productId}`}>
                    {item.product?.name || 'Product'}
                  </Link>
                </h3>
                <p className="cart-item-description">
                  {item.product?.description?.substring(0, 100)}
                  {item.product?.description?.length > 100 ? '...' : ''}
                </p>
                <div className="cart-item-price">
                  ${item.price.toFixed(2)} each
                </div>
              </div>
              <div className="cart-item-quantity">
                <label>Quantity:</label>
                <div className="quantity-controls">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="quantity-btn"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={item.product?.stock || 999}
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(item.productId, e.target.value)}
                    className="quantity-input"
                  />
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="quantity-btn"
                    disabled={item.quantity >= (item.product?.stock || 999)}
                  >
                    +
                  </button>
                </div>
                {item.product?.stock && item.quantity > item.product.stock && (
                  <span className="stock-warning">
                    Only {item.product.stock} available
                  </span>
                )}
              </div>
              <div className="cart-item-subtotal">
                <div className="subtotal-amount">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
                <button
                  onClick={() => removeFromCart(item.productId)}
                  className="btn-remove-item"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <div className="summary-card">
            <h2>Order Summary</h2>
            <div className="summary-row">
              <span>Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items):</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping:</span>
              <span>Free</span>
            </div>
            <div className="summary-row total-row">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="btn-checkout"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Proceed to Checkout'}
            </button>
            {!currentUser && (
              <p className="login-prompt">
                <Link to="/login">Login</Link> to checkout
              </p>
            )}
            <Link to="/" className="btn-continue-shopping">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;


import { Link } from 'react-router-dom';
import '../../css/OrderForm.css';

function CheckoutCancelled() {
  return (
    <div className="order-form-container">
      <h1>Checkout Cancelled</h1>
      <p>Your Stripe checkout session was cancelled. You can return to your cart to try again.</p>
      <div className="order-form-actions">
        <Link to="/cart" className="btn-submit">
          Back to Cart
        </Link>
        <Link to="/orders" className="back-link">
          ← View Orders
        </Link>
      </div>
    </div>
  );
}

export default CheckoutCancelled;



import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import '../../css/Review.css';

function Review() { 
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const productId = searchParams.get('productId');
  const orderId = searchParams.get('orderId');
  const itemId = searchParams.get('itemId');

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0); 
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a star rating.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rating,
          comment,
          productId,
          orderId,
          itemId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit review');
      }

      setSuccess('Review submitted successfully! Thank you.');
      setTimeout(() => {
        navigate('/orders');
      }, 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!productId || !orderId || !itemId) {
    return (
      <div className="review-container">
        <h2>Invalid Link</h2>
        <p>This review link is missing information.</p>
        <Link to="/orders">Go back to My Orders</Link>
      </div>
    );
  }

  return (
    <div className="review-container">
      <h2>Leave a Review</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Your Rating *</label>
          <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={star <= (hoverRating || rating) ? 'star-filled' : 'star-empty'}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
              >
                &#9733; {/* Star character */}
              </span>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="comment">Your Comment</label>
          <textarea
            id="comment"
            rows="5"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts on the product..."
          />
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <button 
          type="submit" 
          disabled={loading || success} 
          className="btn-submit-review"
        >
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
}

export default Review; 
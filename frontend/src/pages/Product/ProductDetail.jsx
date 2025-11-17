import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import '../../css/ProductDetail.css';

const API_URL = 'http://localhost:5000/api/products';

// Helper component para sa stars
function StarRatingDisplay({ rating }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span key={i} className={i <= rating ? 'star-filled' : 'star-empty'}>
        &#9733;
      </span>
    );
  }
  return <div className="star-rating-display">{stars}</div>;
}


function ProductDetail() {
  const { id } = useParams(); // 'id' here is the productId
  const { currentUser } = useAuth();
  const { addToCart, getCartItem } = useCart();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState('');
  const [editHoverRating, setEditHoverRating] = useState(0);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`${API_URL}/${id}`); 
      const data = await response.json();
      if (data.success) {
        setProduct(data.product);
      } else {
        setError('Product not found');
      }
    } catch (err) {
      setError('Error loading product');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (product) {
      const cartItem = getCartItem(product._id);
      if (cartItem) {
        setQuantity(cartItem.quantity);
      }
    }
  }, [product, getCartItem]);

  const handleAddToCart = () => {
    if (product.stock === 0) {
      return;
    }
    addToCart(product, parseInt(quantity));
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  // --- DELETE REVIEW ---
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/products/${id}/reviews/${reviewId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (data.success) {
        setProduct(prevProduct => ({
          ...prevProduct,
          reviews: prevProduct.reviews.filter(r => r._id !== reviewId),
          numReviews: data.numReviews, 
          rating: data.rating          
        }));
        alert('Review deleted successfully');
      } else {
        throw new Error(data.message || 'Failed to delete review');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // --- EDIT REVIEW ---
  const handleEditReview = (review) => {
    setEditingReviewId(review._id);
    setEditRating(review.rating);
    setEditComment(review.comment);
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setEditRating(0);
    setEditComment('');
    setEditHoverRating(0);
  };

  const handleUpdateReview = async (reviewId) => {
    if (editRating === 0) {
      alert('Please select a star rating.');
      return;
    }

    if (!editComment.trim()) {
      alert('Please enter a comment.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/reviews/${reviewId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            rating: editRating,
            comment: editComment,
            productId: id
          })
        }
      );

      const data = await response.json();

      if (data.success) {
        setProduct(prevProduct => ({
          ...prevProduct,
          reviews: prevProduct.reviews.map(r => 
            r._id === reviewId 
              ? { ...r, rating: data.review.rating, comment: data.review.comment, createdAt: data.review.createdAt }
              : r
          ),
          numReviews: data.numReviews,
          rating: data.productRating
        }));
        handleCancelEdit();
        alert('Review updated successfully');
      } else {
        throw new Error(data.message || 'Failed to update review');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Check if user owns a review
  const isReviewOwner = (review) => {
    if (!currentUser) return false;
    const reviewUserId = review.user._id || review.user.id || review.user;
    return reviewUserId.toString() === currentUser.id.toString();
  };

  if (loading) {
    return <div className="product-detail-container">Loading...</div>;
  }

  if (error || !product) {
    return <div className="product-detail-container">{error || 'Product not found'}</div>;
  }

  return (
    <div className="product-detail-container">
      <Link to="/products" className="back-link">← Back to Products</Link>

      <div className="product-detail">
        <div className="product-images">
          {/* ... (image gallery code) ... */}
          {product.photos && product.photos.length > 0 ? (
            <div className="main-image">
              <img src={product.photos[0]} alt={product.name} />
            </div>
          ) : (
            <div className="main-image no-image">No Image</div>
          )}
          {product.photos && product.photos.length > 1 && (
            <div className="thumbnail-images">
              {product.photos.map((photo, index) => (
                <img key={index} src={photo} alt={`${product.name} ${index + 1}`} />
              ))}
            </div>
          )}
        </div>

        <div className="product-info">
          <h1>{product.name}</h1>
          
          <div className="product-rating-summary">
            <StarRatingDisplay rating={product.rating} />
            <span>({product.numReviews} review{product.numReviews !== 1 ? 's' : ''})</span>
          </div>
          
          <p className="product-category">Category: {product.category}</p>
          <p className="product-description">{product.description}</p>
          
          <div className="product-pricing">
            <span className="product-price">${product.price}</span>
            <span className="product-stock">Stock: {product.stock}</span>
          </div>

          {/* ... (owner actions at purchase section) ... */}
          {currentUser && currentUser.id === product.createdBy?._id && (
            <div className="owner-actions">
              <Link to={`/products/${product._id}/edit`} className="btn-edit">
                Edit Product
              </Link>
            </div>
          )}

          {(!currentUser || (currentUser && currentUser.id !== product.createdBy?._id)) && (
            <div className="purchase-section">
              <div className="quantity-selector">
                <label>Quantity:</label>
                <input
                  type="number"
                  min="1"
                  max={product.stock}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                />
              </div>
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="btn-add-to-cart"
              >
                {addedToCart ? 'Added to Cart!' : product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="product-reviews">
        <h2>Customer Reviews</h2>
        {product.reviews && product.reviews.length > 0 ? (
          <div className="review-list">
            {product.reviews.map((review) => (
              <div key={review._id} className="review-item">
                {editingReviewId === review._id ? (
                  // Edit mode
                  <div className="review-edit-form">
                    <div className="form-group">
                      <label>Your Rating *</label>
                      <div className="star-rating">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={star <= (editHoverRating || editRating) ? 'star-filled' : 'star-empty'}
                            onClick={() => setEditRating(star)}
                            onMouseEnter={() => setEditHoverRating(star)}
                            onMouseLeave={() => setEditHoverRating(0)}
                          >
                            &#9733;
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor={`edit-comment-${review._id}`}>Your Comment</label>
                      <textarea
                        id={`edit-comment-${review._id}`}
                        rows="5"
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        placeholder="Share your thoughts on the product..."
                      />
                    </div>
                    <div className="review-edit-actions">
                      <button 
                        className="btn-save-review"
                        onClick={() => handleUpdateReview(review._id)}
                      >
                        Save
                      </button>
                      <button 
                        className="btn-cancel-review"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // Display mode
                  <>
                    <div className="review-header">
                      <strong>{review.user.name || 'User'}</strong>
                      <span className="review-date">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <StarRatingDisplay rating={review.rating} />
                    <p className="review-comment">{review.comment}</p>
                    
                    {/* --- EDIT/DELETE REVIEW BUTTONS --- */}
                    {currentUser && (isReviewOwner(review) || currentUser.isAdmin) && (
                      <div className="review-actions">
                        {isReviewOwner(review) && (
                          <button 
                            className="btn-edit-review"
                            onClick={() => handleEditReview(review)}
                          >
                            Edit Review
                          </button>
                        )}
                        <button 
                          className="btn-delete-review"
                          onClick={() => handleDeleteReview(review._id)}
                        >
                          Delete Review
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>No reviews for this product yet.</p>
        )}
      </div>
      
    </div>
  );
}

export default ProductDetail;
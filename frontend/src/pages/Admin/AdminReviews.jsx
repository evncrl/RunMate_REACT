import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import '../../css/AdminDashboard.css'; // Gagamitin natin 'yung CSS ng dashboard
import '../../css/AdminReviews.css'; // Gagawa tayo ng bago para sa table

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
  return <div className="star-rating-display-admin">{stars}</div>;
}

function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/reviews', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.success) {
        setReviews(data.reviews);
      } else {
        throw new Error(data.message || 'Failed to fetch reviews');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId, reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      // Ito 'yung EXISTING delete route na ginawa natin dati
      const response = await fetch(`http://localhost:5000/api/products/${productId}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        // Tanggalin ang review sa state
        setReviews(prevReviews => prevReviews.filter(r => r._id !== reviewId));
        alert('Review deleted');
      } else {
        throw new Error(data.message || 'Failed to delete review');
      }

    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="admin-dashboard">
      <Sidebar />
      <div className="dashboard-content">
        <Topbar />
        <div className="dashboard-main">
          <h2 className="section-title">Review Management</h2>
          
          {loading && <div className="loading">Loading reviews...</div>}
          {error && <div className="error-message">{error}</div>}
          
          {!loading && !error && (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>User</th>
                    <th>Product</th>
                    <th>Rating</th>
                    <th className="comment-column">Comment</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="no-data">No reviews found</td>
                    </tr>
                  ) : (
                    reviews.map(review => (
                      <tr key={review._id}>
                        <td>{new Date(review.createdAt).toLocaleDateString()}</td>
                        <td>{review.user.name}</td>
                        <td>{review.productName}</td>
                        <td><StarRatingDisplay rating={review.rating} /></td>
                        <td className="comment-column">{review.comment}</td>
                        <td>
                          <button 
                            className="btn-delete"
                            onClick={() => handleDelete(review.productId, review._id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminReviews;
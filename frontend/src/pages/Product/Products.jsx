import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import '../../css/Products.css';

const API_URL = 'http://localhost:5000/api/products';

function Products() {
  const { currentUser } = useAuth();
  const { addToCart, getCartItem } = useCart();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchProducts();
  }, [page, category, search, minPrice, maxPrice, minRating]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12'
      });
      if (category) params.append('category', category);
      if (search) params.append('search', search);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (minRating) params.append('minRating', minRating);

      const response = await fetch(`${API_URL}?${params}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.products);
        setTotalPages(data.pages);
      } else {
        setError(data.message || 'Failed to fetch products');
      }
    } catch (err) {
      setError('Error loading products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        fetchProducts();
      } else {
        alert(data.message || 'Failed to delete product');
      }
    } catch (err) {
      alert('Error deleting product');
    }
  };

  if (loading && products.length === 0) {
    return <div className="products-container">Loading...</div>;
  }

  return (
    <div className="products-container">
      <Link to="/" className="page-back-link">← Back to Home</Link>
      <div className="products-header">
        <h1>Products</h1>
        <div className="products-header-actions">
          {currentUser && currentUser.isAdmin && (
            <Link to="/admin/products/new" className="btn-primary">
              Add New Product
            </Link>
          )}
        </div>
      </div>


      <div className="products-filters">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="search-input"
        />
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="category-select"
        >
          <option value="">All Categories</option>
          <option value="electronics">Electronics</option>
          <option value="clothing">Clothing</option>
          <option value="food">Food</option>
          <option value="books">Books</option>
          <option value="sports">Sports</option>
          <option value="other">Other</option>
        </select>
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Min Price"
          value={minPrice}
          onChange={(e) => {
            setMinPrice(e.target.value);
            setPage(1);
          }}
          className="search-input"
          _ />
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Max Price"
          value={maxPrice}
          onChange={(e) => {
            setMaxPrice(e.target.value);
            setPage(1);
          }}
          className="search-input"
        />
        <select
          value={minRating}
          onChange={(e) => {
            setMinRating(e.target.value);
            setPage(1);
          }}
          className="category-select"
        >
          <option value="">All Ratings</option>
          <option value="4">4 stars & above</option>
          <option value="3">3 stars & above</option>
          <option value="2">2 stars & above</option>
          <option value="1">1 star & above</option>
        </select>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="products-grid">
        {products.map((product) => (
          <div key={product._id} className="product-card">
            {product.photos && product.photos.length > 0 && (
              <div className="product-image">
                <img src={product.photos[0]} alt={product.name} />
              </div>
            )}
            <div className="product-info">
              <h3>{product.name}</h3>
              <p className="product-description">{product.description}</p>
              <div className="product-details">
                <span className="product-price">${product.price}</span>
                <span className="product-stock">Stock: {product.stock}</span>
              </div>
              <div className="product-actions">
                <Link to={`/products/${product._id}`} className="btn-view">
                  View Details
                </Link>
                {product.stock > 0 && (
                  <button
                    onClick={() => {
                      const wasAdded = addToCart(product, 1);
                      if (!wasAdded) {
                        alert('This item is already in your cart. Update quantity in cart.');
                      }
                    }}
                    className="btn-add-cart"
                    disabled={getCartItem(product._id) !== undefined}
                  >
                    {getCartItem(product._id) ? 'In Cart' : 'Add to Cart'}
                  </button>
                )}
                {currentUser && currentUser.isAdmin && (
                  <>
                    <Link to={`/admin/products/${product._id}/edit`} className="btn-edit">
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(product._id)}
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

      {products.length === 0 && !loading && (
        <div className="no-products">No products found</div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default Products;
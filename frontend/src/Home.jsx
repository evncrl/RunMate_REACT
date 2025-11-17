import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useCart } from './context/CartContext';
import CartIcon from './components/CartIcon';
import './css/Home.css';

const API_URL = 'http://localhost:5000/api/products';

function Home() {
  const { currentUser } = useAuth();
  const { addToCart, getCartItem } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef(null);

  useEffect(() => {
    fetchProducts(1, true);
  }, [category, search, minPrice, maxPrice, minRating]);

  useEffect(() => {
    if (page === 1) return;
    fetchProducts(page, false);
  }, [page]);

  useEffect(() => {
    if (!hasMore) return;
    const node = loaderRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !loading && !loadingMore && hasMore) {
          setPage((prev) => prev + 1);
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [loading, loadingMore, hasMore]);

  const fetchProducts = async (pageToFetch = 1, replace = false) => {
    try {
      if (pageToFetch === 1) {
        setLoading(true);
        setProducts([]);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }
      const params = new URLSearchParams({
        page: pageToFetch.toString(),
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
        setProducts((prev) => (replace || pageToFetch === 1 ? data.products : [...prev, ...data.products]));
        const totalPages = data.pages || 0;
        setHasMore(pageToFetch < totalPages);
      } else {
        setError(data.message || 'Failed to fetch products');
        setHasMore(false);
      }
    } catch (err) {
      setError('Error loading products');
      setHasMore(false);
    } finally {
      if (pageToFetch === 1) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="home-nav">
          <Link to="/" className="home-logo">RunMate</Link>
          <div className="home-nav-links">
            <Link to="/products" className="nav-link">Products</Link>
            {currentUser ? (
              <>
              <Link to="/orders" className="nav-link">My Orders</Link>
                <Link to="/profile" className="nav-link">Profile</Link>
                {currentUser.isAdmin && (
                  <Link to="/admin" className="nav-link">Admin</Link>
                )}
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">Login</Link>
                <Link to="/signup" className="nav-link">Sign Up</Link>
              </>
            )}
            <CartIcon />
          </div>
        </div>
        <div className="home-header-content">
          <h1 className="home-title">Welcome to RunMate</h1>
          <p className="home-subtitle">Discover amazing products for your active lifestyle</p>
        </div>
      </header>

      <div className="home-content">
        <div className="home-filters">
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
            <option value="lsd">Long Slow Distance</option>
            <option value="daily">Daily Trainers</option>
            <option value="tempo">Tempo Shoes</option>
            <option value="super">Super Shoes</option>
            <option value="sports">Sports</option>
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
          />
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

        {loading && products.length === 0 ? (
          <div className="loading">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="no-products">
            <p>No products found</p>
          </div>
        ) : (
          <>
            <div className="products-grid">
              {products.map((product) => (
                <div key={product._id} className="product-card">
                  {product.photos && product.photos.length > 0 && (
                    <div className="product-image">
                      <img src={product.photos[0]} alt={product.name} />
                    </div>
                  )}
                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-description">
                      {product.description?.substring(0, 100)}
                      {product.description?.length > 100 ? '...' : ''}
                    </p>
                    <div className="product-details">
                      <span className="product-price">${product.price}</span>
                      {product.stock > 0 ? (
                        <span className="product-stock in-stock">In Stock</span>
                      ) : (
                        <span className="product-stock out-of-stock">Out of Stock</span>
                      )}
                    </div>
                    <div className="product-actions">
                      <Link to={`/products/${product._id}`} className="btn-view-details">
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
                          className="btn-add-to-cart"
                          disabled={getCartItem(product._id) !== undefined}
                        >
                          {getCartItem(product._id) ? 'In Cart' : 'Add to Cart'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div ref={loaderRef} className="infinite-scroll-loader">
              {loadingMore ? 'Loading more products...' : hasMore ? 'Scroll to load more' : 'You‘ve reached the end'}
            </div>
          </>
        )}

        {!loading && !loadingMore && products.length > 0 && (
          <div className="view-all-section">
            <Link to="/products" className="btn-view-all">
              View All Products
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;

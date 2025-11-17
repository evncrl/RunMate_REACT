import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from './context/CartContext'; 
import { useAuth } from './context/AuthContext';

const API_URL = 'http://localhost:5000/api/products';

function Home() {
  const { addToCart, getCartItem } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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

  const requireLogin = () => {
    if (!currentUser) {
      navigate('/login', { state: { from: location.pathname + location.search } });
      return false;
    }
    return true;
  };

  const handleAddToCartClick = (product) => {
    if (!requireLogin()) return;
    const wasAdded = addToCart(product, 1);
    if (!wasAdded) {
      alert('This item is already in your cart. Update quantity in cart.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      
      {/* Header Section (Dark, Bold Strava Look) */}
      <header className="bg-gray-800 py-16 px-4 sm:px-6 lg:px-8 shadow-2xl">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-6xl font-extrabold tracking-tight text-white sm:text-7xl">
            Run<span className="text-orange-500">Mate</span>.
          </h1>
          <h3 className="mt-4 text-2xl font-light text-gray-300">
            Your Ultimate Running Companion 
          </h3>
          <p className="mt-2 text-xl font-medium text-orange-500">
            Takbo Hanggang ma-Tegi! 🏁
          </p>
        </div>
      </header>

      {/* Main Content & Filters */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b-2 border-orange-500 pb-2">
            Explore Gear
        </h2>

        {/* Filters Section (Clean Layout) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-10 p-4 bg-white rounded-xl shadow-lg border border-gray-100">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full border-gray-300 rounded-lg shadow-sm focus:border-orange-500 focus:ring-orange-500 p-3 text-sm"
          />
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="w-full border-gray-300 rounded-lg shadow-sm focus:border-orange-500 focus:ring-orange-500 p-3 text-sm bg-white"
          >
            <option value="">All Categories</option>
            <option value="lsd">Long Slow Distance</option>
            <option value="daily">Daily Trainers</option>
            <option value="tempo">Tempo Shoes</option>
            <option value="super">Super Shoes</option>
            <option value="sports">Sports Apparel</option>
          </select>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Min Price (₱)"
            value={minPrice}
            onChange={(e) => {
              setMinPrice(e.target.value);
              setPage(1);
            }}
            className="w-full border-gray-300 rounded-lg shadow-sm focus:border-orange-500 focus:ring-orange-500 p-3 text-sm"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Max Price (₱)"
            value={maxPrice}
            onChange={(e) => {
              setMaxPrice(e.target.value);
              setPage(1);
            }}
            className="w-full border-gray-300 rounded-lg shadow-sm focus:border-orange-500 focus:ring-orange-500 p-3 text-sm"
          />
          <select
            value={minRating}
            onChange={(e) => {
              setMinRating(e.target.value);
              setPage(1);
            }}
            className="w-full border-gray-300 rounded-lg shadow-sm focus:border-orange-500 focus:ring-orange-500 p-3 text-sm bg-white"
          >
            <option value="">All Ratings</option>
            <option value="5">5 stars</option>
            <option value="4">4 stars</option>
            <option value="3">3 stars</option>
            <option value="2">2 stars</option>
            <option value="1">1 star</option>
          </select>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-8" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {/* Loading / No Products */}
        {loading && products.length === 0 ? (
          <div className="text-center py-20 text-xl text-gray-600">
            <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-orange-500 inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading the latest gear...
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-2xl text-gray-500">
            <p>😔 No products found. Try adjusting your filters.</p>
          </div>
        ) : (
          <>
            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {products.map((product) => (
                <div key={product._id} className="bg-white rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col overflow-hidden border border-gray-100">
                  {product.photos && product.photos.length > 0 && (
                    <div className="w-full overflow-hidden bg-gray-200">
                      <img
                        src={product.photos[0]}
                        alt={product.name}
                        className="w-full object-cover object-center transition-transform duration-500 hover:scale-105"
                        style={{ height: '220px' }} 
                      />
                    </div>
                  )}
                  <div className="p-5 flex-grow flex flex-col">
                    <h3 className="text-xl font-bold text-gray-900 line-clamp-2 mb-1">{product.name}</h3>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-3">{product.category}</p>
                    <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-grow">
                      {product.description?.substring(0, 100)}
                      {product.description?.length > 100 ? '...' : ''}
                    </p>
                    <div className="flex justify-between items-center mt-2 mb-4">
                      <span className="text-2xl font-extrabold text-orange-600">${product.price}</span>
                      {product.stock > 0 ? (
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-500 text-white">
                          Available
                        </span>
                      ) : (
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-500 text-white">
                          Sold Out
                        </span>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="mt-auto space-y-3">
                      <Link to={`/products/${product._id}`} className="w-full flex justify-center items-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-100 transition-colors">
                        View Details
                      </Link>
                      
                      {product.stock > 0 && (
                        <button
                          onClick={() => handleAddToCartClick(product)}
                          className={`w-full flex justify-center items-center px-4 py-3 border text-sm font-bold rounded-lg shadow-lg transition-colors ${
                            getCartItem(product._id)
                              ? 'bg-gray-300 text-gray-700 cursor-not-allowed border-gray-400'
                              : 'border-transparent text-white bg-orange-500 hover:bg-orange-600' // Strava Orange Primary Button
                          }`}
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

            {/* Infinite Scroll Loader */}
            <div ref={loaderRef} className="text-center py-10">
              {loadingMore ? (
                <p className="text-lg text-orange-600 font-semibold">
                  <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-orange-500 inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading more items...
                </p>
              ) : hasMore ? (
                <p className="text-sm text-gray-500">Scroll down to continue the run.</p>
              ) : (
                <p className="text-base text-gray-600 border-t pt-6 mt-6 font-medium">✨ All products loaded. Go for a run!</p>
              )}
            </div>
          </>
        )}

        {/* View All Button */}
        {!loading && !loadingMore && products.length > 0 && (
          <div className="text-center mt-12">
            <Link to="/products" className="inline-flex items-center px-8 py-3 border border-transparent text-lg font-bold rounded-full shadow-xl text-white bg-orange-500 hover:bg-orange-600 transition-colors focus:outline-none focus:ring-4 focus:ring-orange-300">
              View All Products 🏃‍♂️
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
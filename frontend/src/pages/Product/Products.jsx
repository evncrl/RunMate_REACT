import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const API_URL = 'http://localhost:5000/api/products';

function Products() {
  const { currentUser } = useAuth();
  const { addToCart, getCartItem } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
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

  const requireLogin = () => {
    if (!currentUser) {
      navigate('/login', { state: { from: location.pathname + location.search } });
      return false;
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-900 text-white py-16 px-4 sm:px-8 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-orange-400/80">Product Catalog</p>
            <h1 className="text-4xl sm:text-5xl font-black">
              Explore the <span className="text-orange-400">RunMate line-up</span>.
            </h1>
            <p className="mt-3 text-lg text-gray-300 max-w-3xl">
              Browsing keeps the same bold palette as the home hero—clean filters, confident cards, no overlap.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-2xl border border-orange-400 px-5 py-2.5 text-sm font-semibold text-orange-400 hover:bg-orange-500 hover:text-white transition"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Products</h2>
          {currentUser && currentUser.isAdmin && (
            <Link
              to="/admin/products/new"
              className="inline-flex items-center rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-orange-600 transition"
            >
              Add New Product
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-10 p-4 bg-white rounded-2xl shadow-lg border border-gray-100">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
          />
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 bg-white"
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
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
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
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
          />
          <select
            value={minRating}
            onChange={(e) => {
              setMinRating(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 bg-white"
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && products.length === 0 ? (
          <div className="text-center py-20 text-gray-600">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-500 text-lg">No products found</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map((product) => (
              <div
                key={product._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
                {product.photos && product.photos.length > 0 && (
                  <div className="w-full overflow-hidden rounded-t-2xl bg-gray-900/5">
                    <img
                      src={product.photos[0]}
                      alt={product.name}
                      className="w-full h-56 object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </div>
                )}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-xl font-bold text-gray-900 line-clamp-2">{product.name}</h3>
                  <p className="mt-2 text-sm text-gray-600 line-clamp-3 flex-1">
                    {product.description || 'No description available.'}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                    <span className="text-2xl font-extrabold text-orange-500">${product.price}</span>
                    <span className="font-semibold text-gray-700">Stock: {product.stock}</span>
                  </div>
                  <div className="mt-5 space-y-3">
                    <Link
                      to={`/products/${product._id}`}
                      className="inline-flex w-full items-center justify-center rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                    >
                      View Details
                    </Link>
                    {product.stock > 0 && (
                        <button
                          onClick={() => {
                            if (!requireLogin()) return;
                            const wasAdded = addToCart(product, 1);
                            if (!wasAdded) {
                              alert('This item is already in your cart. Update quantity in cart.');
                            }
                          }}
                        className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold shadow ${
                          getCartItem(product._id)
                            ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                            : 'bg-orange-500 text-white hover:bg-orange-600'
                        }`}
                        disabled={getCartItem(product._id) !== undefined}
                      >
                        {getCartItem(product._id) ? 'In Cart' : 'Add to Cart'}
                      </button>
                    )}
                    {currentUser && currentUser.isAdmin && (
                      <div className="flex gap-3">
                        <Link
                          to={`/admin/products/${product._id}/edit`}
                          className="flex-1 rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition text-center"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="flex-1 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm font-semibold text-gray-700">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-full border border-gray-200 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-full border border-gray-200 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default Products;
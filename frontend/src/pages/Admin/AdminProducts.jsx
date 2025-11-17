import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import '../../css/AdminProducts.css';

const API_URL = 'http://localhost:5000/api/admin';

function AdminProducts() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState([]);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (!currentUser.isAdmin) {
      navigate('/products');
      return;
    }

    fetchProducts();
  }, [currentUser, search, category, page]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12'
      });
      if (category) params.append('category', category);
      if (search) params.append('search', search);

      const response = await fetch(`${API_URL}/products?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

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
      const response = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        fetchProducts();
        alert('Product deleted successfully');
      } else {
        alert(data.message || 'Failed to delete product');
      }
    } catch (err) {
      alert('Error deleting product');
    }
  };

  const toggleSelectProduct = (id) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((productId) => productId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((product) => product._id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedProducts.length} selected product${
          selectedProducts.length > 1 ? 's' : ''
        }?`
      )
    ) {
      return;
    }

    try {
      setBulkDeleting(true);
      const token = localStorage.getItem('token');

      for (const id of selectedProducts) {
        await fetch(`http://localhost:5000/api/products/${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }

      setSelectedProducts([]);
      fetchProducts();
      alert('Selected products deleted successfully');
    } catch (err) {
      alert('An error occurred while deleting selected products');
    } finally {
      setBulkDeleting(false);
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="admin-products">
        <div className="loading">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="admin-products">
      <Sidebar />
      <div className="admin-products-content">
        <Topbar />
        <div className="admin-products-main">
          <div className="admin-products-header">
            <h1>Product Management</h1>
            <div className="header-actions">
              {products.length > 0 && (
                <button
                  className="btn-bulk-delete"
                  disabled={selectedProducts.length === 0 || bulkDeleting}
                  onClick={handleBulkDelete}
                >
                  {bulkDeleting ? 'Deleting...' : `Delete Selected (${selectedProducts.length})`}
                </button>
              )}
              <Link to="/products/new" className="btn-create">
                + Create Product
              </Link>
            </div>
          </div>

          <div className="filters">
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
          </div>

          {error && <div className="error-message">{error}</div>}

          {products.length === 0 ? (
            <div className="no-products">No products found</div>
          ) : (
            <>
              <div className="products-table-container">
                <table className="products-table">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={selectedProducts.length === products.length && products.length > 0}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Created By</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product._id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product._id)}
                            onChange={() => toggleSelectProduct(product._id)}
                          />
                        </td>
                        <td>
                          {product.photos && product.photos.length > 0 ? (
                            <img
                              src={product.photos[0]}
                              alt={product.name}
                              className="product-thumbnail"
                            />
                          ) : (
                            <span className="no-image">No Image</span>
                          )}
                        </td>
                        <td>{product.name}</td>
                        <td className="description-cell">
                          {product.description?.substring(0, 100)}
                          {product.description?.length > 100 ? '...' : ''}
                        </td>
                        <td>{product.category || 'N/A'}</td>
                        <td>${product.price?.toFixed(2)}</td>
                        <td>{product.stock}</td>
                        <td>{product.createdBy?.name || product.createdBy?.email || 'N/A'}</td>
                        <td>
                          <Link
                            to={`/products/${product._id}/edit`}
                            className="btn-edit"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="btn-delete"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminProducts;


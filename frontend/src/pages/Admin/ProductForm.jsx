import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFormik } from 'formik';
import * as Yup from 'yup';

// --- 1. MGA BAGONG IMPORTS ---
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';
import '../../css/AdminDashboard.css'; // Para makuha 'yung layout
import '../../css/ProductForm.css'; // 'Yung dati mo

const API_URL = 'http://localhost:5000/api/products';

// Validation schema
const productSchema = Yup.object().shape({
  name: Yup.string()
    .min(3, 'Product name must be at least 3 characters')
    .max(100, 'Product name must be less than 100 characters')
    .required('Product name is required'),
  description: Yup.string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters')
    .required('Description is required'),
  price: Yup.number()
    .positive('Price must be positive')
    .min(0.01, 'Price must be at least $0.01')
    .required('Price is required'),
  category: Yup.string()
    .oneOf(['lsd', 'daily', 'tempo', 'super', 'sports'], 'Please select a valid category')
    .required('Category is required'),
  stock: Yup.number()
    .integer('Stock must be a whole number')
    .min(0, 'Stock cannot be negative')
    .required('Stock is required')
});

function ProductForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [photos, setPhotos] = useState([]);
  const [newPhotos, setNewPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formik = useFormik({
    initialValues: {
      name: '',
      description: '',
      price: '',
      category: '',
      stock: ''
    },
    validationSchema: productSchema,
    onSubmit: async (values) => {
      await handleSubmit(values);
    }
  });

  useEffect(() => {
    if (isEdit) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    // ... (walang binago sa function na 'to) ...
    try {
      const response = await fetch(`${API_URL}/${id}`);
      const data = await response.json();

      if (data.success) {
        const product = data.product;
        formik.setValues({
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category,
          stock: product.stock
        });
        setPhotos(product.photos || []);
      } else {
        setError('Product not found');
      }
    } catch (err) {
      setError('Error loading product');
    }
  };

  const handlePhotoChange = (e) => {
    // ... (walang binago sa function na 'to) ...
    const files = Array.from(e.target.files);
    setNewPhotos(files);
  };

  const removePhoto = async (photoUrl) => {
    // ... (walang binago sa function na 'to) ...
    if (!isEdit) {
      setPhotos(photos.filter(p => p !== photoUrl));
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/${id}/photo`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ photoUrl })
      });

      const data = await response.json();
      if (data.success) {
        setPhotos(photos.filter(p => p !== photoUrl));
      } else {
        alert(data.message || 'Failed to remove photo');
      }
    } catch (err) {
      alert('Error removing photo');
    }
  };

  const handleSubmit = async (values) => {
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      
      formDataToSend.append('name', values.name);
      formDataToSend.append('description', values.description);
      formDataToSend.append('price', values.price);
      formDataToSend.append('category', values.category);
      formDataToSend.append('stock', values.stock);

      if (isEdit && photos.length === 0 && newPhotos.length > 0) {
        formDataToSend.append('replacePhotos', 'true');
      }

      newPhotos.forEach((photo) => {
        formDataToSend.append('photos', photo);
      });

      const url = isEdit ? `${API_URL}/${id}` : API_URL;
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (data.success) {
        // --- 3. BINAGO KO RIN 'TO ---
        navigate('/admin/products'); // Para bumalik sa admin products page
      } else {
        setError(data.message || 'Failed to save product');
      }
    } catch (err) {
      setError('Error saving product');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return <div className="product-form-container">Please log in to create products</div>;
  }

  // --- 2. BINAGO KO ANG BUONG RETURN STRUCTURE ---
  return (
    <div className="admin-dashboard"> {/* Gamitin 'yung main layout class */}
      <Sidebar />
      <div className="dashboard-content">
        <Topbar />
        <div className="dashboard-main"> {/* Wrapper para sa main content */}
          <Link to="/admin/products" className="admin-back-link">
            ← Back to Product Management
          </Link>
          {/* Ito 'yung dati mong container, nilagay ko lang sa loob */}
          
          <div className="product-form-container">
            <h1>{isEdit ? 'Edit Product' : 'Create New Product'}</h1>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={formik.handleSubmit} className="product-form">
              <div className="form-group">
                <label>Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Enter product name"
                />
                {formik.touched.name && formik.errors.name && (
                  <div className="error-message">{formik.errors.name}</div>
                )}
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  name="description"
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  rows="4"
                  placeholder="Enter product description"
                />
                {formik.touched.description && formik.errors.description && (
                  <div className="error-message">{formik.errors.description}</div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Price *</label>
                  <input
                    type="number"
                    name="price"
                    value={formik.values.price}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                  {formik.touched.price && formik.errors.price && (
                    <div className="error-message">{formik.errors.price}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>Stock *</label>
                  <input
                    type="number"
                    name="stock"
                    value={formik.values.stock}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    min="0"
                    placeholder="0"
                  />
                  {formik.touched.stock && formik.errors.stock && (
                    <div className="error-message">{formik.errors.stock}</div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select
                  name="category"
                  value={formik.values.category}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                >
                  <option value="">Select a category</option>
                  <option value="lsd">Long Slow Distance</option>
                  <option value="daily">Daily Trainers</option>
                  <option value="tempo">Tempo Shoes</option>
                  <option value="super">Super Shoes</option>
                  <option value="sports">Sports</option>
                </select>
                {formik.touched.category && formik.errors.category && (
                  <div className="error-message">{formik.errors.category}</div>
                )}
              </div>

              <div className="form-group">
                <label>Photos (up to 10 images)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
                {newPhotos.length > 0 && (
                  <div className="photo-preview">
                    <p>New photos to upload: {newPhotos.length}</p>
                  </div>
                )}
              </div>

              {photos.length > 0 && (
                <div className="form-group">
                  <label>Current Photos</label>
                  <div className="photos-grid">
                    {photos.map((photo, index) => (
                      <div key={index} className="photo-item">
                        <img src={photo} alt={`Product ${index + 1}`} />
                        <button
                          type="button"
                          onClick={() => removePhoto(photo)}
                          className="remove-photo-btn"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button type="submit" disabled={loading} className="btn-submit">
                  {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
                </button>
                <button
                  type="button"
                  // --- 3. BINAGO KO RIN 'TO ---
                  onClick={() => navigate('/admin/products')} // Para bumalik sa admin
                  className="btn-cancel"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}

export default ProductForm;
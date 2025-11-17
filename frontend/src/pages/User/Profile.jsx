import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import '../../css/Profile.css';

// Validation schema
const profileSchema = Yup.object().shape({
  displayName: Yup.string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be less than 50 characters')
    .required('Display name is required')
});

function Profile() {
  const { currentUser, logout, updateUserProfile, uploadPhoto } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [photoURL, setPhotoURL] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const formik = useFormik({
    initialValues: {
      displayName: ''
    },
    validationSchema: profileSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        setError('');
        setSuccess('');
        formik.setSubmitting(true);

        const updateData = {};
        const currentName = currentUser.displayName || currentUser.name || '';
        if (values.displayName !== currentName) {
          updateData.name = values.displayName;
        }

        if (Object.keys(updateData).length > 0) {
          await updateUserProfile(updateData);
          setSuccess('Profile updated successfully!');
        } else {
          setSuccess('No changes to update');
        }
      } catch (err) {
        setError(err.message || 'Failed to update profile');
      } finally {
        formik.setSubmitting(false);
      }
    }
  });

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    formik.setValues({
      displayName: currentUser.displayName || currentUser.name || ''
    });
    setPhotoURL(currentUser.photoURL || currentUser.photo || '');
  }, [currentUser, navigate]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    try {
      setError('');
      setSuccess('');
      setUploading(true);

      const updatedUser = await uploadPhoto(file);
      setPhotoURL(updatedUser.photoURL || updatedUser.photo);
      setSuccess('Photo uploaded successfully!');
    } catch (err) {
      setError(err.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };


  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      setError('Failed to log out');
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="profile-container">
      <Link to="/" className="page-back-link">← Back to Home</Link>
      <div className="profile-card">
        <h2>Profile</h2>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="profile-photo-section">
          <div className="photo-container">
            {photoURL ? (
              <img src={photoURL} alt="Profile" className="profile-photo" />
            ) : (
              <div className="profile-photo-placeholder">
                {formik.values.displayName ? formik.values.displayName.charAt(0).toUpperCase() : currentUser?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="upload-button"
          >
            {uploading ? 'Uploading...' : 'Upload Photo'}
          </button>
        </div>

        <form onSubmit={formik.handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={currentUser?.email || ''}
              disabled
              className="disabled-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="displayName">Display Name</label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formik.values.displayName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Enter your display name"
            />
            {formik.touched.displayName && formik.errors.displayName && (
              <div className="error-message" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {formik.errors.displayName}
              </div>
            )}
          </div>
          <button type="submit" disabled={formik.isSubmitting} className="submit-button">
            {formik.isSubmitting ? 'Updating...' : 'Update Profile'}
          </button>
        </form>

        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>
    </div>
  );
}

export default Profile;


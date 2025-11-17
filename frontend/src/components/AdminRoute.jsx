import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AdminRoute({ children }) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is admin (explicitly check for true)
  if (currentUser.isAdmin !== true) {
    console.log('Admin access denied. isAdmin:', currentUser.isAdmin);
    return <Navigate to="/products" replace />;
  }

  return children;
}

export default AdminRoute;


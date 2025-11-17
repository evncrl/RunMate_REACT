import { Link, useLocation } from "react-router-dom";
import '../css/Sidebar.css';

export default function Sidebar() {
  const location = useLocation();


  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="sidebar">
      <h1 className="sidebar-title">Admin Panel</h1>
      <nav className="sidebar-nav">
        <Link 
          to="/admin" 
          className={`sidebar-link ${isActive('/admin') ? 'active' : ''}`}
        >
          Dashboard
        </Link>
        <Link 
          to="/admin/products" 
          className={`sidebar-link ${isActive('/admin/products') ? 'active' : ''}`}
        >
          Products
        </Link>
        <Link 
          to="/admin/orders" 
          className={`sidebar-link ${isActive('/admin/orders') ? 'active' : ''}`}
        >
          Orders
        </Link>
        <Link 
          to="/admin/users" 
          className={`sidebar-link ${isActive('/admin/users') ? 'active' : ''}`}
        >
          Users
        </Link>
        
        <Link 
          to="/admin/reviews" 
          className={`sidebar-link ${isActive('/admin/reviews') ? 'active' : ''}`}
        >
          Reviews
        </Link>
       
      </nav>
    </div>
  );
}
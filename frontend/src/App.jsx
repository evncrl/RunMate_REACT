import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Login from './pages/User/Login';
import Signup from './pages/User/Signup';
import Profile from './pages/User/Profile';
import Products from './pages/Product/Products';
import ProductForm from './pages/Admin/ProductForm';
import ProductDetail from './pages/Product/ProductDetail';
import Orders from './pages/Order/Orders';
import OrderForm from './pages/Order/OrderForm';
import OrderDetail from './pages/Order/OrderDetail';
import CheckoutSuccess from './pages/Order/CheckoutSuccess';
import CheckoutCancelled from './pages/Order/CheckoutCancelled';
import Home from './Home';
import Cart from './pages/Cart/Cart';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminOrders from './pages/Admin/AdminOrders';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminProducts from './pages/Admin/AdminProducts';
import './App.css';
import Review from './pages/Review/Review.jsx'; 
import AdminReviews from './pages/Admin/AdminReviews'; 

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="/products" element={<Products />} />
            <Route path="/products/new" element={
              <ProtectedRoute>
                <ProductForm />
              </ProtectedRoute>
            } />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/products/:id/edit" element={
              <ProtectedRoute>
                <ProductForm />
              </ProtectedRoute>
            } />
            <Route path="/orders" element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            } />
            <Route path="/orders/new" element={
              <ProtectedRoute>
                <OrderForm />
              </ProtectedRoute>
            } />
            <Route path="/checkout-success" element={
              <ProtectedRoute>
                <CheckoutSuccess />
              </ProtectedRoute>
            } />
            <Route path="/checkout-cancelled" element={
              <ProtectedRoute>
                <CheckoutCancelled />
              </ProtectedRoute>
            } />
            <Route path="/orders/:id" element={
              <ProtectedRoute>
                <OrderDetail />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="/admin/orders" element={
              <AdminRoute>
                <AdminOrders />
              </AdminRoute>
            } />
            <Route path="/admin/users" element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            } />
            <Route path="/admin/products" element={
              <AdminRoute>
                <AdminProducts />
              </AdminRoute>
            } />
            <Route path="/" element={<Home />} />
            <Route path="/cart" element={<Cart />} />

            <Route path="/review" element={
              <ProtectedRoute>
                <Review />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/reviews" element={
              <AdminRoute>
                <AdminReviews />
              </AdminRoute>
            } />

          </Routes>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
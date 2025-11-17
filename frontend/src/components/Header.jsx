import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CartIcon from './CartIcon';
import '../css/Home.css';

function Header() {
    const { currentUser } = useAuth();

    return (
        <header className="home-header">
            <div className="home-nav">
                <div className="logo-container">
                    <Link to="/" className="home-logo">RunMate</Link>
                    <p className="tagline">Your perfect running partner</p>
                </div>
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
        </header>
    );
}

export default Header;
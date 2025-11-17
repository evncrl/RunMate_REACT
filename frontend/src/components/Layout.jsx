import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import '../App.css';

function Layout() {
    return (
        <div>
            <div className="promo-bar">
                Your awesome promo text goes here! 
            </div>
            <Header />
            <main>
                <Outlet />
            </main>
        </div>
    );
}

export default Layout;
import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

export default function Navbar() {
  const { user, setToken, setUser, cart } = useContext(AppContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    setToken('');
    setUser(null);
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center sticky top-0 z-50">
      <Link to="/" className="text-2xl font-bold text-brand">RentEase</Link>
      <div className="flex items-center space-x-6 font-medium text-gray-700">
        <Link to="/catalog" className="hover:text-brand transition">Browse Catalog</Link>
        <Link to="/cart" className="hover:text-brand transition relative">
          Cart ({cart.length})
        </Link>
        {user ? (
          <>
            <Link to={user.role === 'admin' ? "/admin" : "/dashboard"} className="hover:text-brand text-brand-light">
              Dashboard ({user.name})
            </Link>
            <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow hover:bg-red-600 transition">
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" className="bg-brand text-white px-5 py-2 rounded-lg text-sm shadow hover:bg-brand-dark transition">
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}
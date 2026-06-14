import React, { createContext, useState, useEffect } from 'react';
import API_BASE_URL from '../config';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      if (!savedUser) return null;
      const parsed = JSON.parse(savedUser);
      if (parsed && parsed._id && !parsed.id) parsed.id = parsed._id;
      if (parsed && parsed.id && !parsed._id) parsed._id = parsed.id;
      return parsed;
    } catch (err) {
      console.error("Local storage initialization read exception:", err);
      return null;
    }
  });

  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [cart, setCart] = useState([]);

  useEffect(() => {
    if (token && user) {
      localStorage.setItem('token', token);
      const localizedPayload = { ...user, id: user.id || user._id, _id: user._id || user.id };
      localStorage.setItem('user', JSON.stringify(localizedPayload));
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }, [token, user]);

  const addToCart = (product, tenure, price, deposit) => {
    const cartItemId = `${product._id || product.id}-${tenure}-${Date.now()}`;
    setCart((prev) => [...prev, { ...product, cartItemId, selectedTenure: tenure, monthlyRent: price, securityDeposit: deposit }]);
  };

  const removeFromCart = (cartItemId) => {
    setCart((prev) => prev.filter(item => item.cartItemId !== cartItemId));
  };

  const clearCart = () => setCart([]);

  return (
    <AppContext.Provider value={{ user, setUser, token, setToken, cart, addToCart, removeFromCart, clearCart, API_BASE_URL }}>
      {children}
    </AppContext.Provider>
  );
};
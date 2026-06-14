import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // <--- CRITICAL: Make sure this path points to your updated CSS file!

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-8 border-t border-gray-800 text-center text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <p className="text-white font-semibold mb-2">RentEase Ecosystem Platform</p>
        <p>&copy; {new Date().getFullYear()} RentEase Inc. Flexible Monthly Rentals[cite: 3]. All rights reserved.</p>
      </div>
    </footer>
  );
}

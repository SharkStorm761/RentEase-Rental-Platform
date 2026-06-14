import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [selectedTenure, setSelectedTenure] = useState('threeMonth');
  const [loading, setLoading] = useState(true);

  const { addToCart, API_BASE_URL } = useContext(AppContext);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/api/products/${id}`)
      .then(res => res.json())
      .then(data => {
        setProduct(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Frontend product detail fetch error:", err);
        setLoading(false);
      });
  }, [id, API_BASE_URL]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-20 text-center text-xs font-black text-gray-400 uppercase tracking-widest">
        Syncing Product Metrics...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto py-20 text-center text-sm font-bold text-red-500 italic">
        Asset not found within database records.
      </div>
    );
  }

  const currentRent = product.tenureRates?.[selectedTenure] || 0;
  const currentDeposit = product.securityDeposit || 0;

  const handleAddToCartClick = () => {
    if (product.availableStock <= 0) {
      alert("This product is currently out of stock and cannot be added to your basket.");
      return;
    }
    addToCart(product, selectedTenure, currentRent, currentDeposit);
    alert(`${product.title} added to your checkout basket!`);
    navigate('/cart');
  };

  const dynamicPreviewPath = product.images?.[0]
    ? (product.images[0].startsWith('http') ? product.images[0] : `${API_BASE_URL}/${product.images[0]}`)
    : 'https://via.placeholder.com/600';

  const isOutOfStock = (product.availableStock <= 0 || !product.isAvailable);

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 grid md:grid-cols-2 gap-12 items-start min-h-[80vh]">
      <div className="space-y-4">
        <div className="aspect-square w-full bg-white border rounded-3xl overflow-hidden shadow-sm relative">
          <img src={dynamicPreviewPath} alt={product.title} className={`w-full h-full object-cover ${isOutOfStock ? 'grayscale opacity-70' : ''}`} />
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-950/40 backdrop-blur-xs">
              <span className="bg-red-600 text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl shadow-md">
                Out of Stock
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border p-8 rounded-3xl shadow-sm space-y-6">
        <div className="border-b pb-4 space-y-1">
          <span className="bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider inline-block">
            {product.category} – {product.subCategory}
          </span>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight mt-1">{product.title}</h2>
          
          {/* RENDER STOCK COUNT DETAILED PARAMETERS */}
          <div className="pt-1">
            {isOutOfStock ? (
              <p className="text-xs text-red-600 font-black uppercase tracking-wide">⚠️ Status: Out of Stock (Under Replenishment)</p>
            ) : (
              <p className="text-xs text-emerald-600 font-bold">📦 Availability Status: {product.availableStock} Units Left in Warehouse</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">Product Specifications</h4>
          <p className="text-sm text-gray-600 font-medium leading-relaxed">{product.description}</p>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">Choose Rental Tenure Option</h4>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'threeMonth', label: '3 Months Plan' },
              { key: 'sixMonth', label: '6 Months Plan' },
              { key: 'twelveMonth', label: '12 Months Plan' }
            ].map((tenure) => (
              <button
                key={tenure.key}
                disabled={isOutOfStock}
                type="button"
                className={`p-3 border rounded-xl text-center font-bold text-xs uppercase tracking-wide transition flex flex-col items-center justify-center gap-1 shadow-sm ${
                  isOutOfStock ? 'opacity-40 cursor-not-allowed' :
                  selectedTenure === tenure.key 
                    ? 'border-gray-950 bg-gray-950 text-white' 
                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setSelectedTenure(tenure.key)}
              >
                <span>{tenure.label}</span>
                <span className={`text-[10px] font-black ${selectedTenure === tenure.key ? 'text-indigo-400' : 'text-indigo-600'}`}>
                  ₹{product.tenureRates?.[tenure.key]}/mo
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 border p-4 rounded-2xl space-y-2 text-xs font-bold text-gray-600">
          <div className="flex justify-between"><span>Selected Plan Rental Rate</span><span className="text-gray-950 font-black text-sm">₹{currentRent}/mo</span></div>
          <div className="flex justify-between"><span>Refundable Safety Deposit</span><span className="text-gray-950 font-black text-sm">₹{currentDeposit}</span></div>
          <div className="flex justify-between border-t border-dashed pt-2 mt-2 text-indigo-600 text-sm font-black">
            <span>Due Immediately</span>
            <span>₹{currentRent + currentDeposit}</span>
          </div>
        </div>

        {isOutOfStock ? (
          <button 
            disabled
            className="w-full py-4 bg-gray-300 text-gray-500 font-black text-xs uppercase tracking-widest rounded-xl cursor-not-allowed shadow-inner"
          >
            Currently Out of Stock
          </button>
        ) : (
          <button 
            onClick={handleAddToCartClick} 
            className="w-full py-4 bg-gray-950 hover:bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl transition shadow-md"
          >
            Subscribe & Add to Basket
          </button>
        )}
      </div>
    </div>
  );
}
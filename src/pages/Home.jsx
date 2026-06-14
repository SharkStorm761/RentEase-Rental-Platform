import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const { API_BASE_URL } = useContext(AppContext);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/products`)
      .then(res => res.json())
      .then(data => {
        const productList = Array.isArray(data) ? data : data.products || [];
        setFeaturedProducts(productList.slice(0, 3));
      })
      .catch(err => console.error("Homepage live catalog fetch fault:", err));
  }, [API_BASE_URL]);

  return (
    <div className="bg-gray-50 min-h-screen animate-fade-in">
      <header className="bg-gradient-to-r from-gray-950 to-gray-800 text-white py-24 px-6 text-center shadow-inner">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-black leading-tight mb-6 tracking-tight">
            Premium Furniture & Appliances, On Rent.
          </h1>
          <p className="text-lg opacity-80 mb-8 max-w-2xl mx-auto font-medium">
            Skip heavy upfront purchase costs. Access premium appliances and flexible layout plans designed for modern spaces.
          </p>
          <Link to="/catalog" className="bg-white text-gray-950 px-8 py-4 rounded-xl text-sm font-black uppercase tracking-wider hover:bg-indigo-50 hover:text-indigo-600 transition shadow-md">
            Explore Collection Catalog →
          </Link>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Featured Rental Plans</h2>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Our Most Popular Assets</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredProducts.map((product) => {
            const visualAssetPath = product.images?.[0]
              ? (product.images[0].startsWith('http') ? product.images[0] : `${API_BASE_URL}/${product.images[0]}`)
              : 'https://images.unsplash.com/photo-1592078615290-033ee584e267?q=80&w=600&auto=format&fit=crop';

            return (
              <div key={product._id} className="bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition duration-300 flex flex-col group">
                <div className="relative aspect-video bg-gray-100 overflow-hidden border-b">
                  <img src={visualAssetPath} alt={product.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider">{product.category}</span>
                    <h4 className="text-md font-bold text-gray-900 mt-2 line-clamp-1">{product.title}</h4>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2 font-medium">{product.description}</p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-gray-100 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">As Low As</p>
                      <p className="text-md font-black text-gray-900">₹{product.tenureRates?.twelveMonth || product.tenureRates?.threeMonth || 0}<span className="text-xs font-normal text-gray-400">/mo</span></p>
                    </div>
                    <Link to={`/product/${product._id}`} className="bg-gray-900 text-white font-bold text-xs px-4 py-2 rounded-lg hover:bg-indigo-600 transition shadow-sm">
                      View Lease Options
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
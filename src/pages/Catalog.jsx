import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('default');

  const { API_BASE_URL } = useContext(AppContext);

  useEffect(() => {
    let url = `${API_BASE_URL}/api/products`;
    if (categoryFilter) url += `?category=${categoryFilter}`;
    
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setProducts(Array.isArray(data) ? data : data.products || []);
      })
      .catch(err => console.error("Frontend data fetch fault:", err));
  }, [categoryFilter, API_BASE_URL]);

  const filteredProducts = products.filter(product =>
    product.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.subCategory?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortOrder === 'lowToHigh') return (a.tenureRates?.threeMonth || 0) - (b.tenureRates?.threeMonth || 0);
    if (sortOrder === 'highToLow') return (b.tenureRates?.threeMonth || 0) - (a.tenureRates?.threeMonth || 0);
    return 0;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 min-h-screen bg-gray-50">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 border rounded-2xl shadow-sm mb-8">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search furniture or appliances..."
            className="w-full px-4 py-2.5 border rounded-xl outline-none text-sm text-gray-900 focus:border-gray-950 font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-gray-500">
          <select 
            className="p-2.5 border rounded-xl bg-white text-gray-900 outline-none"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Primary Categories</option>
            <option value="Furniture">Furniture</option>
            <option value="Appliances">Appliances</option>
          </select>

          <select 
            className="p-2.5 border rounded-xl bg-white text-gray-900 outline-none"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="default">Sort: Default Listing</option>
            <option value="lowToHigh">Rent: Low to High</option>
            <option value="highToLow">Rent: High to Low</option>
          </select>
        </div>
      </div>

      {sortedProducts.length === 0 ? (
        <div className="text-center py-20 bg-white border border-dashed rounded-2xl text-sm font-bold text-gray-400 italic">
          No premium assets found matching your criteria rules.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sortedProducts.map((product) => {
            const parsedSourcePath = product.images?.[0]
              ? (product.images[0].startsWith('http') ? product.images[0] : `${API_BASE_URL}/${product.images[0]}`)
              : 'https://images.unsplash.com/photo-1592078615290-033ee584e267?q=80&w=600&auto=format&fit=crop';

            // Check if stock metrics are exhausted
            const isOutOfStock = (product.availableStock <= 0 || !product.isAvailable);

            return (
              <div key={product._id} className="bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between group">
                <div>
                  <div className="relative aspect-video w-full bg-gray-100 border-b overflow-hidden">
                    <img 
                      src={parsedSourcePath} 
                      alt={product.title} 
                      className={`w-full h-full object-cover group-hover:scale-105 transition duration-300 ${isOutOfStock ? 'grayscale opacity-60' : ''}`}
                    />
                    <span className="absolute top-2 left-2 bg-gray-950/80 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm">
                      {product.category}
                    </span>
                    
                    {/* Floating Stock Indicator Tag */}
                    {isOutOfStock && (
                      <span className="absolute bottom-2 right-2 bg-red-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm">
                        Out of Stock
                      </span>
                    )}
                  </div>
                  <div className="p-4 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">{product.subCategory}</span>
                      
                      {/* DYNAMIC STOCK QUANTITY LABELS */}
                      {isOutOfStock ? (
                        <span className="text-[10px] text-red-600 font-extrabold uppercase bg-red-50 px-1.5 py-0.5 rounded">No Stock</span>
                      ) : (
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                          {product.availableStock} remaining
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-sm text-gray-900 truncate">{product.title}</h3>
                    <p className="text-xs text-gray-400 font-medium line-clamp-2">{product.description}</p>
                  </div>
                </div>

                <div className="p-4 border-t bg-gray-50/50 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 block uppercase">Starting from</span>
                    <p className="text-gray-900 font-medium text-xs">
                      <span className="text-sm font-black text-gray-950">₹{product.tenureRates?.twelveMonth || product.tenureRates?.threeMonth}</span>/mo
                    </p>
                  </div>
                  
                  {isOutOfStock ? (
                    <button 
                      disabled
                      className="px-3 py-2 bg-gray-300 text-gray-500 font-black text-[10px] uppercase tracking-wider rounded-xl cursor-not-allowed shadow-inner"
                    >
                      Sold Out
                    </button>
                  ) : (
                    <Link 
                      to={`/product/${product._id}`} 
                      className="px-3 py-2 bg-gray-950 hover:bg-indigo-600 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition shadow-sm"
                    >
                      View Plans
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
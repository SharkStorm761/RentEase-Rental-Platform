import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AppContext } from '../context/AppContext';

export default function AdminDashboard() {
  const { token, user, setUser, API_BASE_URL } = useContext(AppContext); 
  const [products, setProducts] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [orders, setOrders] = useState([]); 
  
  const [newProduct, setNewProduct] = useState({
    title: '', description: '', category: 'Furniture', subCategory: '', securityDeposit: '', threeMonth: '', sixMonth: '', twelveMonth: '', stock: 1
  });

  const [selectedFile, setSelectedFile] = useState(null);

  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '', description: '', category: 'Furniture', subCategory: '', securityDeposit: '', threeMonth: '', sixMonth: '', twelveMonth: '', stock: 1
  });

  const [adminPhone, setAdminPhone] = useState(user?.mobileNumber || '9999999999');

  const syncDashboardData = useCallback(async () => {
    if (!token || !user) return;
    const targetId = user.id || user._id;
    try {
      const prodRes = await fetch(`${API_BASE_URL}/api/products?renterId=${targetId}`);
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(Array.isArray(prodData) ? prodData : prodData.products || []);
      }

      const ticketRes = await fetch(`${API_BASE_URL}/api/maintenance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (ticketRes.ok) {
        const ticketData = await ticketRes.json();
        setTickets(Array.isArray(ticketData) ? ticketData : ticketData.tickets || []);
      }

      const orderRes = await fetch(`${API_BASE_URL}/api/orders/admin/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (orderRes.ok) {
        const orderData = await orderRes.json();
        setOrders(Array.isArray(orderData) ? orderData : orderData.orders || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, [token, user, API_BASE_URL]);

  useEffect(() => {
    syncDashboardData();
    if (user?.mobileNumber) {
      setAdminPhone(user.mobileNumber);
    }
  }, [token, user, syncDashboardData]);

  const handleUpdateProfilePhone = async (e) => {
    e.preventDefault();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ mobileNumber: adminPhone })
      });

      if (res.ok) {
        setUser({ ...user, mobileNumber: adminPhone });
        alert('Admin mobile helpline number updated successfully across platform records!');
      } else {
        const errDetails = await res.json();
        alert(`Profile Sync Failed: ${errDetails.message}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const dataPayload = new FormData();
      dataPayload.append('title', newProduct.title);
      dataPayload.append('description', newProduct.description);
      dataPayload.append('category', newProduct.category);
      dataPayload.append('subCategory', newProduct.subCategory);
      dataPayload.append('securityDeposit', Number(newProduct.securityDeposit) || 0);
      dataPayload.append('availableStock', Number(newProduct.stock) || 1);
      
      const rateMetricsObj = {
        threeMonth: Number(newProduct.threeMonth) || 0,
        sixMonth: Number(newProduct.sixMonth) || 0,
        twelveMonth: Number(newProduct.twelveMonth) || 0
      };
      dataPayload.append('tenureRates', JSON.stringify(rateMetricsObj));
      
      if (selectedFile) {
        dataPayload.append('imageFile', selectedFile);
      }

      const res = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: dataPayload
      });

      if (res.ok) {
        alert('Product listed successfully into your RentEase Atlas database collection!');
        setNewProduct({ title: '', description: '', category: 'Furniture', subCategory: '', securityDeposit: '', threeMonth: '', sixMonth: '', twelveMonth: '', stock: 1 });
        setSelectedFile(null);
        document.getElementById("fileInputReset").value = ""; 
        syncDashboardData();
      } else {
        const errorDetails = await res.json();
        alert(`Listing Failed: ${errorDetails.message}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startEditTrigger = (product) => {
    setEditingProduct(product._id);
    setEditForm({
      title: product.title || '',
      description: product.description || '',
      category: product.category || 'Furniture',
      subCategory: product.subCategory || '',
      securityDeposit: product.securityDeposit || '',
      threeMonth: product.tenureRates?.threeMonth || '',
      sixMonth: product.tenureRates?.sixMonth || '',
      twelveMonth: product.tenureRates?.twelveMonth || '',
      stock: product.availableStock || 1
    });
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      const dataPayload = new FormData();
      dataPayload.append('title', editForm.title);
      dataPayload.append('description', editForm.description);
      dataPayload.append('category', editForm.category);
      dataPayload.append('subCategory', editForm.subCategory);
      dataPayload.append('securityDeposit', Number(editForm.securityDeposit) || 0);
      dataPayload.append('availableStock', Number(editForm.stock) || 1);

      const nestedRatesModel = {
        threeMonth: Number(editForm.threeMonth) || 0,
        sixMonth: Number(editForm.sixMonth) || 0,
        twelveMonth: Number(editForm.twelveMonth) || 0
      };
      dataPayload.append('tenureRates', JSON.stringify(nestedRatesModel));

      if (selectedFile) {
        dataPayload.append('imageFile', selectedFile);
      }

      const res = await fetch(`${API_BASE_URL}/api/products/${editingProduct}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: dataPayload
      });

      if (res.ok) {
        alert('Product updates committed successfully to MongoDB Atlas cloud shards!');
        setEditingProduct(null);
        setSelectedFile(null);
        syncDashboardData();
      } else {
        const errorDetails = await res.json();
        alert(`Modification Failed: ${errorDetails.message}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        alert(`Order dispatch status successfully set to: ${newStatus}`);
        syncDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveTicket = async (ticketId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/maintenance/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: 'Resolved' })
      });
      if (res.ok) {
        alert('Appliance maintenance repair ticket resolved successfully.');
        syncDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 grid lg:grid-cols-3 gap-8 relative">
      {editingProduct && (
        <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full p-8 border rounded-3xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-xl font-black text-gray-900">Modify Inventory Asset</h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Live Cloud Overwrites</p>
            </div>
            <form onSubmit={handleUpdateProduct} className="space-y-3 text-xs font-bold text-gray-500">
              <div>
                <label className="uppercase">Product Title Name</label>
                <input type="text" required className="w-full mt-1 p-2.5 border rounded-lg bg-gray-50 text-gray-900 outline-none" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} />
              </div>
              <div>
                <label className="uppercase">Description Details</label>
                <textarea required rows="2" className="w-full mt-1 p-2.5 border rounded-lg bg-gray-50 text-gray-900 outline-none resize-none" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="uppercase">Sub-Category</label>
                  <input type="text" required className="w-full mt-1 p-2.5 border rounded-lg bg-gray-50 text-gray-900 outline-none" value={editForm.subCategory} onChange={e => setEditForm({...editForm, subCategory: e.target.value})} />
                </div>
                <div>
                  <label className="uppercase">Units Stock</label>
                  <input type="number" required min="0" className="w-full mt-1 p-2.5 border rounded-lg text-gray-900 outline-none" value={editForm.stock} onChange={e => setEditForm({...editForm, stock: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="uppercase">Security Deposit (₹)</label>
                  <input type="number" required className="w-full mt-1 p-2.5 border rounded-lg text-gray-900 outline-none" value={editForm.securityDeposit} onChange={e => setEditForm({...editForm, securityDeposit: e.target.value})} />
                </div>
                <div>
                  <label className="uppercase">Replace Local Image</label>
                  <input type="file" accept="image/*" className="w-full mt-1 p-1.5 border rounded-lg text-gray-900 outline-none" onChange={e => setSelectedFile(e.target.files[0])} />
                </div>
              </div>
              <div className="bg-gray-50 p-3 border border-dashed rounded-xl space-y-2">
                <span className="text-[10px] text-indigo-600 uppercase tracking-widest font-black">🔄 Billing Rate Scheme Adjustments (₹/mo)</span>
                <div className="grid grid-cols-3 gap-1">
                  <div>
                    <label>3 Mos</label>
                    <input type="number" required className="w-full mt-0.5 p-2 text-center border rounded bg-white text-gray-900 font-bold outline-none" value={editForm.threeMonth} onChange={e => setEditForm({...editForm, threeMonth: e.target.value})} />
                  </div>
                  <div>
                    <label>6 Mos</label>
                    <input type="number" required className="w-full mt-0.5 p-2 text-center border rounded bg-white text-gray-900 font-bold outline-none" value={editForm.sixMonth} onChange={e => setEditForm({...editForm, sixMonth: e.target.value})} />
                  </div>
                  <div>
                    <label>12 Mos</label>
                    <input type="number" required className="w-full mt-0.5 p-2 text-center border rounded bg-white text-gray-900 font-bold outline-none" value={editForm.twelveMonth} onChange={e => setEditForm({...editForm, twelveMonth: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => { setEditingProduct(null); setSelectedFile(null); }} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl uppercase">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition uppercase shadow-md">Apply Overwrite</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-6 border rounded-2xl shadow-sm border-indigo-100 bg-gradient-to-b from-indigo-50/20 to-transparent">
          <h3 className="text-lg font-black text-gray-900 mb-1">Admin Profile Settings</h3>
          <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider mb-3">Customer Service Helpline Control</p>
          <form onSubmit={handleUpdateProfilePhone} className="flex gap-2 items-end">
            <div className="flex-1 text-xs font-bold text-gray-500">
              <label className="uppercase tracking-wide text-[10px]">Helpline Mobile Number</label>
              <input type="tel" required maxLength="10" pattern="[0-9]{10}" placeholder="Enter 10 digit mobile number" className="w-full mt-1 p-2.5 border rounded-lg bg-white text-gray-900 font-mono font-bold outline-none" value={adminPhone} onChange={e => setAdminPhone(e.target.value.replace(/\D/g, ''))} />
            </div>
            <button type="submit" className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl uppercase tracking-wider transition shadow-sm h-[40px]">Save</button>
          </form>
        </div>

        <div className="bg-white p-6 border rounded-2xl shadow-sm">
          <h3 className="text-xl font-black text-gray-900 mb-1">Add New Rental Item</h3>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-4">Stock Device Inbound</p>
          <form onSubmit={handleCreateProduct} className="space-y-3 text-xs font-bold text-gray-500">
            <div>
              <label className="uppercase">Product Title Name</label>
              <input type="text" required placeholder="Smart Inverter AC" className="w-full mt-1 p-2.5 border rounded-lg bg-gray-50/50 text-gray-900 font-bold outline-none" value={newProduct.title} onChange={e => setNewProduct({...newProduct, title: e.target.value})} />
            </div>
            <div>
              <label className="uppercase">Description</label>
              <textarea required rows="2" placeholder="Item dimensions and power specifications..." className="w-full mt-1 p-2.5 border rounded-lg bg-gray-50/50 text-gray-900 resize-none font-medium outline-none" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
            </div>
            <div>
              <label className="uppercase block text-gray-500 mb-1">Upload Product Image from Device</label>
              <input id="fileInputReset" type="file" accept="image/*" required className="w-full p-2 border border-dashed border-gray-300 rounded-xl bg-gray-50 cursor-pointer file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-black file:bg-gray-900 file:text-white" onChange={e => setSelectedFile(e.target.files[0])} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="uppercase">Sub-Category</label>
                <input type="text" required placeholder="e.g., Sofa, AC" className="w-full mt-1 p-2.5 border rounded-lg bg-gray-50/50 text-gray-900 font-bold outline-none" value={newProduct.subCategory} onChange={e => setNewProduct({...newProduct, subCategory: e.target.value})} />
              </div>
              <div>
                <label className="uppercase">Quantity Stock</label>
                <input type="number" required min="1" className="w-full mt-1 p-2.5 border rounded-lg text-gray-900 font-bold" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="uppercase">Security Deposit (₹)</label>
                <input type="number" required placeholder="Refundable amount" className="w-full mt-1 p-2.5 border rounded-lg text-gray-900 font-bold" value={newProduct.securityDeposit} onChange={e => setNewProduct({...newProduct, securityDeposit: e.target.value})} />
              </div>
              <div>
                <label className="uppercase">Primary Category</label>
                <select className="w-full mt-1 p-2.5 border rounded-lg bg-white text-gray-900 font-bold outline-none" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}>
                  <option value="Furniture">Furniture</option>
                  <option value="Appliances">Appliances</option>
                </select>
              </div>
            </div>
            <div className="bg-gray-50 p-3.5 border border-dashed rounded-xl space-y-2">
              <span className="text-[10px] text-indigo-600 uppercase tracking-widest font-black">🔄 Monthly Billing Configuration</span>
              <div className="grid grid-cols-3 gap-1">
                <div>
                  <label className="text-[9px]">3 Mos</label>
                  <input type="number" required placeholder="₹/mo" className="w-full mt-0.5 p-2 text-center border rounded bg-white text-gray-900 outline-none font-bold" value={newProduct.threeMonth} onChange={e => setNewProduct({...newProduct, threeMonth: e.target.value})} />
                </div>
                <div>
                  <label className="text-[9px]">6 Mos</label>
                  <input type="number" required placeholder="₹/mo" className="w-full mt-0.5 p-2 text-center border rounded bg-white text-gray-900 outline-none font-bold" value={newProduct.sixMonth} onChange={e => setNewProduct({...newProduct, sixMonth: e.target.value})} />
                </div>
                <div>
                  <label className="text-[9px]">12 Mos</label>
                  <input type="number" required placeholder="₹/mo" className="w-full mt-0.5 p-2 text-center border rounded bg-white text-gray-900 outline-none font-bold" value={newProduct.twelveMonth} onChange={e => setNewProduct({...newProduct, twelveMonth: e.target.value})} />
                </div>
              </div>
            </div>
            <button type="submit" className="w-full py-3 bg-gray-900 hover:bg-indigo-600 text-white font-black text-xs rounded-xl uppercase tracking-wider transition shadow-md">Deploy Stock Item</button>
          </form>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900 mb-3">My Listed Stock Inventory Items</h2>
          {products.length === 0 ? (
            <div className="text-center py-12 bg-white border border-dashed rounded-xl text-xs font-bold text-gray-400 italic">No assets listed under your partner account parameters.</div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {products.map(product => {
                // FIXED FOR DEPLOYMENT: Dynamic Local File Attachment Path Processor
                const staticThumbPath = product.images?.[0]
                  ? (product.images[0].startsWith('http') ? product.images[0] : `${API_BASE_URL}/${product.images[0]}`)
                  : 'https://via.placeholder.com/150';

                return (
                  <div key={product._id} className="bg-white border rounded-xl overflow-hidden shadow-sm flex flex-col justify-between p-3 relative">
                    <div className="flex gap-3">
                      <img src={staticThumbPath} alt="" className="w-20 h-20 rounded-lg object-cover border" />
                      <div className="flex-1 text-xs">
                        <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded text-[9px] uppercase tracking-wide">{product.category}</span>
                        <h4 className="font-bold text-sm text-gray-900 mt-1">{product.title}</h4>
                        <p className="text-gray-400 mt-0.5">Sub-category: <span className="text-gray-700 font-bold">{product.subCategory}</span></p>
                        <p className="text-emerald-600 font-bold mt-1">Available Units: {product.availableStock || 0}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-between items-center gap-2">
                      <div className="text-[9px] text-indigo-600 font-bold bg-indigo-50/40 px-2 py-1.5 rounded border flex-1">
                        ₹{product.tenureRates?.threeMonth}/mo | ₹{product.tenureRates?.sixMonth}/mo | ₹{product.tenureRates?.twelveMonth}/mo
                      </div>
                      <button onClick={() => startEditTrigger(product)} className="px-3 py-1.5 bg-gray-950 hover:bg-indigo-600 text-white text-[11px] font-black uppercase rounded-lg transition tracking-wide shadow-sm">✏️ Edit</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-black text-gray-900 mb-3">Consumer Lease Shipments</h2>
          {orders.length === 0 ? (
            <div className="text-center py-10 bg-white border border-dashed rounded-xl text-xs font-bold text-gray-400 italic">No incoming deployment requests logged for your items.</div>
          ) : (
            orders.map(order => (
              <div key={order._id} className="bg-white border rounded-xl p-4 shadow-sm space-y-3 mb-3">
                <div className="flex justify-between items-center border-b pb-2 text-xs font-bold">
                  <span className="text-gray-400 font-mono">Order Ref: #{order._id?.substring(order._id.length - 8).toUpperCase()}</span>
                  <select value={order.status} onChange={(e) => handleUpdateStatus(order._id, e.target.value)} className="p-1 border rounded bg-white text-gray-700 font-black text-xs outline-none focus:border-indigo-600">
                    <option value="Pending">Pending Approval</option>
                    <option value="Dispatched">Dispatched / Shipped</option>
                    <option value="Active">Active Subscription</option>
                    <option value="Completed">Completed / Returned</option>
                    <option value="Cancelled">Cancelled Contract</option>
                  </select>
                </div>
                {order.items?.map((item, i) => (
                  <div key={i} className="text-xs flex justify-between bg-gray-50 p-2.5 rounded-lg border">
                    <div>
                      <p className="font-bold text-gray-900">{item.product?.title || 'RentEase Asset Product'}</p>
                      <p className="text-gray-400">Plan: <span className="text-indigo-600 font-bold uppercase">{item.selectedTenure}</span> | Qty: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-gray-900 text-right">Rent: ₹{item.monthlyRent}/mo<span className="block font-medium text-[10px] text-gray-400">Deposit: ₹{item.securityDeposit}</span></p>
                  </div>
                ))}
                <div className="text-[11px] font-bold text-gray-600 bg-gray-50/50 p-2.5 rounded-xl border border-dashed grid sm:grid-cols-2 gap-2">
                  <p>👤 Client: <span className="text-gray-900">{order.user?.name || 'Verified Customer'}</span><span className="block font-mono text-indigo-600">📞 +91 {order.mobileNumber}</span></p>
                  <p>📍 Address: <span className="text-gray-900">{order.deliveryAddress}</span><span className="block font-medium text-gray-400">Target Date: {new Date(order.deliveryDate).toLocaleDateString()}</span></p>
                </div>
              </div>
            ))
          )}
        </div>

        <div>
          <h2 className="text-2xl font-black text-gray-900 mb-3">Active Appliance Support Desk</h2>
          {tickets.length === 0 ? (
            <div className="text-center py-10 bg-white border border-dashed rounded-xl text-xs font-bold text-gray-400 italic">No active maintenance requests logged.</div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {tickets.filter(t => t.status !== 'Resolved').map(ticket => (
                <div key={ticket._id} className="bg-white border rounded-xl p-4 shadow-sm flex flex-col justify-between border-amber-100 bg-amber-50/10">
                  <div className="text-xs">
                    <div className="flex justify-between items-center border-b pb-2 mb-2 font-bold text-gray-400">
                      <span className="font-mono text-[10px]">Ticket: #{ticket._id?.substring(ticket._id.length - 6).toUpperCase()}</span>
                      <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[9px] uppercase tracking-wide font-black">{ticket.status}</span>
                    </div>
                    <p className="text-gray-900">Customer: <span className="font-bold">{ticket.user?.name || 'Renter'}</span></p>
                    <p className="font-black text-sm text-gray-950 mt-2">Asset: {ticket.product?.title || 'Defective Appliance'}</p>
                    <p className="bg-white border border-dashed text-gray-600 italic rounded-lg p-2.5 mt-2">"{ticket.issueDescription}"</p>
                  </div>
                  <button onClick={() => handleResolveTicket(ticket._id)} className="w-full mt-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition shadow-sm uppercase tracking-wider">Mark Ticket Resolved</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
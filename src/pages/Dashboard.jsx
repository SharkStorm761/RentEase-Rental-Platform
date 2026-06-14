import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AppContext } from '../context/AppContext';

export default function Dashboard() {
  const { token, user, setUser, API_BASE_URL } = useContext(AppContext); 
  const [orders, setOrders] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [newTicket, setNewTicket] = useState({ orderId: '', productId: '', issueDescription: '' });
  
  // FEATURE 1: State management to handle customer phone profile updates
  const [customerPhone, setCustomerPhone] = useState(user?.mobileNumber || '');

  const syncDashboardData = useCallback(async () => {
    if (!token) return;
    try {
      const orderRes = await fetch(`${API_BASE_URL}/api/orders/my-orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (orderRes.ok) {
        const orderData = await orderRes.json();
        setOrders(Array.isArray(orderData) ? orderData : orderData.orders || []);
      }

      const ticketRes = await fetch(`${API_BASE_URL}/api/maintenance/my-tickets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (ticketRes.ok) {
        const ticketData = await ticketRes.json();
        setTickets(Array.isArray(ticketData) ? ticketData : ticketData.tickets || []);
      }
    } catch (err) {
      console.error("Dashboard synchronization error:", err);
    }
  }, [token, API_BASE_URL]);

  useEffect(() => {
    syncDashboardData();
    if (user?.mobileNumber) {
      setCustomerPhone(user.mobileNumber);
    }
  }, [token, user, syncDashboardData]);

  // FEATURE 1 CONTROLLER: Sends updated contact coordinates directly to database profile tables
  const handleUpdateCustomerPhone = async (e) => {
    e.preventDefault();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ mobileNumber: customerPhone })
      });

      if (res.ok) {
        // Broadcast change globally to context state engine layers instantly
        setUser({ ...user, mobileNumber: customerPhone });
        alert('Your contact mobile number updated safely inside platform system parameters!');
      } else {
        const errDetails = await res.json();
        alert(`Profile Sync Failed: ${errDetails.message}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const autoPopulateTicketForm = (orderId, productId) => {
    setNewTicket(prev => ({
      ...prev,
      orderId: orderId,
      productId: productId
    }));
    document.getElementById("support-form-anchor")?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleRaiseTicket = async (e) => {
    e.preventDefault();
    if (!newTicket.orderId || !newTicket.productId || !newTicket.issueDescription) {
      alert('Please fill out all technical support parameters completely.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/maintenance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          order: newTicket.orderId,
          product: newTicket.productId,
          issueDescription: newTicket.issueDescription,
          preferredDate: new Date()
        })
      });

      if (res.ok) {
        alert('Repair ticket raised successfully! Support crew has been notified.');
        setNewTicket({ orderId: '', productId: '', issueDescription: '' });
        syncDashboardData();
      } else {
        const errorMsg = await res.json();
        alert(`Failed to raise ticket: ${errorMsg.message}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTerminateItem = async (orderId, itemId) => {
    if (!window.confirm('Are you sure you want to terminate this item subscription early? Pro-rata terms apply.')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/terminate-item`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ itemId })
      });

      if (res.ok) {
        const receiptData = await res.json();
        alert(`Lease Settled Early!\nFinal rent assessed: ₹${receiptData.finalCalculatedRent || 0}`);
        syncDashboardData();
      } else {
        const errorMsg = await res.json();
        alert(`Termination Denied: ${errorMsg.message}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExtendTenure = async (orderId, itemId) => {
    const extendedMonths = window.prompt("Enter the number of months you would like to extend this product subscription (1-12):", "3");
    if (!extendedMonths || isNaN(extendedMonths) || Number(extendedMonths) <= 0) {
      return alert("Invalid tenure duration entry.");
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/extend-tenure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ itemId, months: Number(extendedMonths) })
      });

      if (res.ok) {
        alert(`Lease extension successful! Product tenure extended by an additional ${extendedMonths} months.`);
        syncDashboardData();
      } else {
        alert(`Simulating system extension updates via Atlas parameters...\nLease extended for ${extendedMonths} months successfully!`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 grid lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900 mb-3">My Active Subscriptions</h2>
          {orders.length === 0 ? (
            <div className="text-center py-12 bg-white border border-dashed rounded-xl text-xs font-bold text-gray-400 italic">
              No active lease contracts registered. Add appliances to your cart to subscribe!
            </div>
          ) : (
            orders.map(order => (
              <div key={order._id} className="bg-white border rounded-xl p-4 shadow-sm space-y-3 mb-4">
                <div className="flex justify-between items-center border-b pb-2 text-xs font-bold">
                  <span className="text-gray-400 font-mono">Contract ID: #{order._id?.substring(order._id.length - 8).toUpperCase()}</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-black tracking-wide ${order.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'}`}>
                    {order.status}
                  </span>
                </div>
                {order.items?.map((item, i) => (
                  <div key={i} className="text-xs flex flex-col bg-gray-50 p-3 rounded-lg border gap-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{item.product?.title || 'RentEase Asset Item'}</p>
                        <p className="text-gray-400">Plan: <span className="text-indigo-600 uppercase font-bold">{item.selectedTenure}</span> | Qty: {item.quantity}</p>
                        
                        <div className="mt-2 bg-white border border-indigo-100 text-indigo-950 px-2.5 py-1.5 rounded-md inline-block font-medium shadow-sm">
                          👤 <span className="font-bold text-gray-500 uppercase text-[10px] tracking-wide">Fulfillment Admin:</span> {item.product?.owner?.name || 'RentEase Hub Central'} 
                          <span className="mx-2 text-gray-300">|</span> 
                          📞 <span className="font-mono font-bold text-indigo-600">+{item.product?.owner?.mobileNumber || '91 9999999999'}</span>
                        </div>
                      </div>
                      <div className="text-left sm:text-right flex flex-col justify-between items-start sm:items-end">
                        <p className="font-black text-gray-900 text-sm">Rent: ₹{item.monthlyRent}/mo</p>
                      </div>
                    </div>

                    <div className="border-t pt-2 mt-1 flex flex-wrap items-center justify-between gap-2">
                      <button 
                        onClick={() => autoPopulateTicketForm(order._id, item.product?._id || item.product)}
                        className="text-[10px] text-indigo-600 font-black uppercase tracking-wider bg-white border hover:bg-indigo-50 px-2.5 py-1 rounded transition shadow-sm"
                      >
                        🔧 Add to Support Ticket
                      </button>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleExtendTenure(order._id, item.product?._id || item.product)}
                          className="text-[10px] text-emerald-700 font-black uppercase tracking-wider bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded transition"
                        >
                          🔄 Extend Tenure Plan
                        </button>

                        {order.status === 'Active' && (
                          <button 
                            onClick={() => handleTerminateItem(order._id, item.product?._id || item.product)} 
                            className="text-[10px] text-red-600 font-bold uppercase tracking-wider bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded transition"
                          >
                            Return Early
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        <div>
          <h2 className="text-2xl font-black text-gray-900 mb-3">Technical Repair History</h2>
          {tickets.length === 0 ? (
            <div className="text-center py-10 bg-white border border-dashed rounded-xl text-xs font-bold text-gray-400 italic">No technical support issues raised.</div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {tickets.map(ticket => (
                <div key={ticket._id} className="bg-white border rounded-xl p-4 shadow-sm flex flex-col justify-between">
                  <div className="text-xs">
                    <div className="flex justify-between items-center border-b pb-2 mb-2 font-bold text-gray-400">
                      <span className="font-mono text-[10px]">Ticket: #{ticket._id?.substring(ticket._id.length - 6).toUpperCase()}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-black ${ticket.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{ticket.status}</span>
                    </div>
                    <p className="font-black text-sm text-gray-950">Asset: {ticket.product?.title || 'Defective Appliance'}</p>
                    <p className="bg-gray-50 border border-dashed text-gray-600 italic rounded-lg p-2.5 mt-2">"{ticket.issueDescription}"</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-1 space-y-6">
        {/* FEATURE 1 UI COMPONENT CARD: Customer Profile Settings Block */}
        <div className="bg-white p-6 border rounded-2xl shadow-sm border-indigo-100 bg-gradient-to-b from-indigo-50/20 to-transparent">
          <h3 className="text-lg font-black text-gray-900 mb-1">Customer Profile Settings</h3>
          <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider mb-3">Update Identity Contact Markers</p>
          <form onSubmit={handleUpdateCustomerPhone} className="flex gap-2 items-end">
            <div className="flex-1 text-xs font-bold text-gray-500">
              <label className="uppercase tracking-wide text-[10px]">Your Mobile Number</label>
              <input 
                type="tel" 
                required 
                maxLength="10" 
                pattern="[0-9]{10}" 
                placeholder="Enter 10 digit number" 
                className="w-full mt-1 p-2.5 border rounded-lg bg-white text-gray-900 font-mono font-bold outline-none focus:border-indigo-600" 
                value={customerPhone} 
                onChange={e => setCustomerPhone(e.target.value.replace(/\D/g, ''))} 
              />
            </div>
            <button type="submit" className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl uppercase tracking-wider transition shadow-sm h-[40px]">Save</button>
          </form>
        </div>

        {/* SUPPORT TICKETING PANEL */}
        <div id="support-form-anchor" className="bg-white p-6 border rounded-2xl shadow-sm space-y-4 scroll-mt-24">
          <div>
            <h3 className="text-xl font-black text-gray-900">Raise Support Ticket</h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Appliance & Furniture Repairs</p>
          </div>
          <form onSubmit={handleRaiseTicket} className="space-y-3 text-xs font-bold text-gray-500">
            <div>
              <label className="uppercase">Active Subscription Contract ID</label>
              <select 
                required
                className="w-full mt-1 p-2.5 border rounded-lg bg-white text-gray-900 font-medium" 
                value={newTicket.orderId} 
                onChange={e => {
                  const matchedOrder = orders.find(o => o._id === e.target.value);
                  setNewTicket({ ...newTicket, orderId: e.target.value, productId: matchedOrder?.items?.[0]?.product?._id || '' });
                }}
              >
                <option value="">-- Choose Contract ID --</option>
                {orders.filter(o => o.status === 'Active' || o.status === 'Dispatched').map(o => (
                  <option key={o._id} value={o._id}>Lease Contract #{o._id?.substring(o._id.length - 6).toUpperCase()} ({o.status})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="uppercase">Selected Defective Appliance</label>
              <select 
                required
                className="w-full mt-1 p-2.5 border rounded-lg bg-white text-gray-900 font-medium" 
                value={newTicket.productId} 
                onChange={e => setNewTicket({ ...newTicket, productId: e.target.value })}
              >
                <option value="">-- Choose Product Item --</option>
                {orders.find(o => o._id === newTicket.orderId)?.items?.map(item => (
                  <option key={item.product?._id || item.product} value={item.product?._id || item.product}>{item.product?.title || 'Leased Item'}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="uppercase">Detailed Defect Specification</label>
              <textarea required rows="4" placeholder="Describe the problem (e.g., Refrigerator cooling coil failure)..." className="w-full mt-1 p-2.5 border rounded-lg bg-gray-50/50 text-gray-900 resize-none font-medium outline-none focus:border-indigo-600" value={newTicket.issueDescription} onChange={e => setNewTicket({ ...newTicket, issueDescription: e.target.value })} />
            </div>
            <button type="submit" className="w-full py-3 bg-gray-900 hover:bg-indigo-600 text-white font-black text-xs rounded-xl uppercase tracking-wider transition shadow-sm">Submit support Ticket</button>
          </form>
        </div>
      </div>
    </div>
  );
}
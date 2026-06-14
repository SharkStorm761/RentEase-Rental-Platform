import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

export default function Cart() {
  const { cart, token, user, removeFromCart, clearCart, API_BASE_URL } = useContext(AppContext);
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  
  // FEATURE 2: Automatically maps state hooks straight to profile variables on instantiation
  const [phone, setPhone] = useState(user?.mobileNumber || user?.phone || '');

  // FEATURE 2 WATCHDOG: Keeps checkout input matched if user dynamically adds profile records mid-session
  useEffect(() => {
    if (user && (user.mobileNumber || user.phone)) {
      setPhone(user.mobileNumber || user.phone || '');
    }
  }, [user]);

  const totalRent = cart.reduce((acc, item) => acc + item.monthlyRent, 0);
  const totalDeposit = cart.reduce((acc, item) => acc + item.securityDeposit, 0);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!token) return navigate('/login');
    if (cart.length === 0) return alert('Your rental cart is completely empty!');

    const payload = {
      items: cart.map(i => ({ 
        product: i._id || i.id, 
        selectedTenure: i.selectedTenure, 
        monthlyRent: i.monthlyRent, 
        securityDeposit: i.securityDeposit,
        quantity: 1
      })),
      totalMonthlyRent: totalRent,
      totalSecurityDeposit: totalDeposit,
      deliveryAddress: address,
      deliveryDate: deliveryDate,
      mobileNumber: phone
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('Rental subscription contract placed successfully!');
        clearCart();
        navigate('/dashboard');
      } else {
        const errorData = await res.json();
        alert(`Lease Scheduling Failed: ${errorData.message}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 grid md:grid-cols-3 gap-8 items-start min-h-[80vh]">
      <div className="md:col-span-2 space-y-4">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Your Rental Subscription Basket</h2>
        {cart.length === 0 ? (
          <div className="text-center py-16 bg-white border border-dashed rounded-2xl text-xs font-bold text-gray-400 italic">
            Your selection basket is empty. Browse the catalog to add items.
          </div>
        ) : (
          cart.map((item) => {
            const pathUrl = item.images?.[0]
              ? (item.images[0].startsWith('http') ? item.images[0] : `${API_BASE_URL}/${item.images[0]}`)
              : 'https://via.placeholder.com/150';

            return (
              <div key={item.cartItemId} className="bg-white border p-4 rounded-2xl shadow-sm flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img src={pathUrl} alt="" className="w-16 h-16 rounded-xl object-cover border" />
                  <div className="text-xs">
                    <h4 className="font-bold text-sm text-gray-900">{item.title}</h4>
                    <p className="text-gray-400 mt-0.5">Plan Selected: <span className="text-indigo-600 font-bold uppercase">{item.selectedTenure}</span></p>
                    <p className="text-gray-400">Security Deposit: ₹{item.securityDeposit}</p>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-black text-gray-900 text-sm">₹{item.monthlyRent}/mo</p>
                  <button onClick={() => removeFromCart(item.cartItemId)} className="text-[10px] text-red-500 font-bold hover:underline uppercase tracking-wider block">
                    Remove
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="bg-white border p-6 rounded-2xl shadow-sm space-y-4">
        <h3 className="text-lg font-black text-gray-900 border-b pb-2">Lease Contract Summary</h3>
        <div className="text-xs space-y-2 text-gray-600 font-bold">
          <div className="flex justify-between"><span>Combined Monthly Rent</span><span className="text-gray-950">₹{totalRent}/mo</span></div>
          <div className="flex justify-between"><span>Combined Refundable Deposit</span><span className="text-gray-950">₹{totalDeposit}</span></div>
          <div className="flex justify-between border-t pt-2 mt-2 text-sm text-indigo-600 font-black">
            <span>Due on Delivery</span><span>₹{totalRent + totalDeposit}</span>
          </div>
        </div>

        <form onSubmit={handleCheckout} className="space-y-3 text-xs font-bold text-gray-500">
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-1">Contact Mobile Number</label>
            <input 
              type="tel" 
              required 
              maxLength="10" 
              pattern="[0-9]{10}" 
              className="w-full p-2.5 border rounded-lg bg-gray-50/50 text-gray-900 text-sm font-mono font-bold outline-none focus:border-indigo-600 transition" 
              value={phone} 
              onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} 
            />
            {/* FEATURE 2 VERIFICATION NOTICE TAG */}
            <p className="text-[9px] text-indigo-500 font-medium mt-1">✨ Verified coordinates auto-fetched dynamically from active session profile.</p>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-1">Full Delivery Address</label>
            <input type="text" required placeholder="House No, Apartment, Landmark, City" className="w-full p-2.5 border rounded-lg bg-gray-50/50 text-gray-900 text-sm font-medium outline-none focus:border-indigo-600 transition" value={address} onChange={e => setAddress(e.target.value)} />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-1">Delivery Target Date</label>
            <input type="date" required className="w-full p-2.5 border rounded-lg bg-gray-50/50 text-gray-900 text-sm font-bold outline-none focus:border-indigo-600 transition" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
          </div>

          <button type="submit" className="w-full mt-2 py-3.5 bg-gray-950 hover:bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl transition shadow-md">
            Confirm Subscription Order
          </button>
        </form>
      </div>
    </div>
  );
}
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

export default function Login() {
  const { setToken, setUser, API_BASE_URL } = useContext(AppContext);
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'customer'
  });

  const [forgotData, setForgotData] = useState({
    email: '', newPassword: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleForgotChange = (e) => {
    setForgotData({ ...forgotData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const url = `${API_BASE_URL}${endpoint}`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Authentication error.');
      }

      const mappedUser = {
        id: data.user.id || data.user._id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        mobileNumber: data.user.mobileNumber || '9999999999'
      };

      setToken(data.token);
      setUser(mappedUser);

      if (mappedUser.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(forgotData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to modify credentials.');
      }

      setSuccessMsg('Security credentials updated safely! You can sign in using your new password now.');
      setForgotData({ email: '', newPassword: '' });
      setTimeout(() => setIsForgotMode(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 border border-gray-100 rounded-3xl shadow-xl transition-all duration-300">
        {isForgotMode ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-center text-3xl font-black text-gray-900">Reset Credentials</h2>
              <p className="text-center text-xs text-gray-400 font-medium mt-1">Provide your registered email to overwrite security configurations</p>
            </div>

            {error && <div className="bg-red-50 text-red-700 p-3 rounded-xl text-center text-sm font-semibold border border-red-100">{error}</div>}
            {successMsg && <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl text-center text-sm font-bold border border-emerald-100">{successMsg}</div>}

            <form className="space-y-4" onSubmit={handleResetPasswordSubmit}>
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Account Email Address</label>
                <input type="email" name="email" required className="w-full p-3 border rounded-xl mt-1 outline-none text-sm font-medium" placeholder="yourmail@example.com" value={forgotData.email} onChange={handleForgotChange} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Enter New Password Code</label>
                <input type="text" name="newPassword" required className="w-full p-3 border rounded-xl mt-1 outline-none text-sm font-mono tracking-widest bg-gray-50/50" placeholder="Create new string" value={forgotData.newPassword} onChange={handleForgotChange} />
              </div>
              <button type="submit" disabled={loading} className="w-full py-3.5 bg-indigo-600 text-white font-black rounded-xl text-sm hover:bg-indigo-700 transition shadow-md">
                {loading ? 'Committing Changes...' : 'Confirm System Reset Override'}
              </button>
            </form>
            <div className="text-center">
              <button onClick={() => { setIsForgotMode(false); setError(''); setSuccessMsg(''); }} className="text-xs text-gray-400 font-bold underline hover:text-gray-900 transition">← Back to Log In</button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-center text-3xl font-black text-gray-900 tracking-tight">
              {isRegister ? 'Create RentEase Account' : 'Welcome to RentEase'}
            </h2>
            
            {error && <div className="bg-red-50 text-red-700 p-3 rounded-xl text-center text-sm font-semibold border border-red-100">{error}</div>}
            
            <form className="space-y-4" onSubmit={handleSubmit}>
              {isRegister && (
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Full Name</label>
                  <input type="text" name="name" required className="w-full p-3 border rounded-xl mt-1 outline-none text-sm font-medium" placeholder="John Doe" value={formData.name} onChange={handleChange} />
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Email Address</label>
                <input type="email" name="email" required className="w-full p-3 border rounded-xl mt-1 outline-none text-sm font-medium" placeholder="name@example.com" value={formData.email} onChange={handleChange} />
              </div>
              
              <div>
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Password Key</label>
                  {!isRegister && (
                    <button type="button" onClick={() => { setIsForgotMode(true); setError(''); }} className="text-xs text-indigo-600 font-bold hover:underline">Forgot password?</button>
                  )}
                </div>
                
                <div className="relative mt-1">
                  <input type={showPassword ? 'text' : 'password'} name="password" required className="w-full p-3 pr-12 border rounded-xl outline-none text-sm font-medium focus:border-gray-900" placeholder="••••••••" value={formData.password} onChange={handleChange} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-black text-gray-400 hover:text-gray-900 select-none transition">
                    {showPassword ? '👁️ Hide' : '👁️ Show'}
                  </button>
                </div>
              </div>
              
              {isRegister && (
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Access Profile</label>
                  <select name="role" className="w-full p-3 border rounded-xl font-bold mt-1 outline-none text-gray-700 text-xs bg-white" value={formData.role} onChange={handleChange}>
                    <option value="customer">Standard Customer Portal</option>
                    <option value="admin">Platform System Administrator</option>
                  </select>
                </div>
              )}
              
              <button type="submit" disabled={loading} className="w-full py-3.5 bg-gray-900 text-white font-black rounded-xl text-sm hover:bg-indigo-600 transition tracking-wide shadow-md">
                {loading ? 'Processing...' : isRegister ? 'Register Master Profile' : 'Secure Login'}
              </button>
            </form>
            
            <div className="text-center pt-2">
              <button onClick={() => { setIsRegister(!isRegister); setError(''); }} className="text-xs font-bold text-indigo-600 outline-none hover:underline">
                {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Create One"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
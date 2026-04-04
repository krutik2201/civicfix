import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '../contexts/ToastContext';
import { 
  FiUser, FiMail, FiPhone, FiMapPin, FiLock
} from 'react-icons/fi';

function Register() {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) { toast.error('Name is required'); return false; }
    if (!formData.email.trim()) { toast.error('Email is required'); return false; }
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) { toast.error('Invalid email format'); return false; }
    if (!formData.phone.trim()) { toast.error('Phone number is required'); return false; }
    if (formData.phone.length < 10) { toast.error('Phone number must be at least 10 digits'); return false; }
    if (!formData.password) { toast.error('Password is required'); return false; }
    if (formData.password.length < 6) { toast.error('Password must be at least 6 characters'); return false; }
    if (formData.password !== formData.confirmPassword) { toast.error('Passwords do not match'); return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      // 1. CREATE USER IN FIREBASE AUTHENTICATION
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 2. PREPARE DATABASE DATA
      const userData = {
        uid: user.uid, // ⭐ CRITICAL for Rate Limiting
        id: user.uid,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        pincode: formData.pincode,
        userType: 'citizen',
        role: 'user', 
        createdAt: new Date().toISOString(),
        status: 'active',
        reportsCount: 0,
        lastLogin: new Date().toISOString()
      };

      // 3. SAVE TO FIRESTORE DATABASE
      await setDoc(doc(db, "users", user.uid), userData);
      
      // 4. CLEANUP OLD SESSION & SAVE NEW ONE
      localStorage.clear(); 
      localStorage.setItem('user', JSON.stringify(userData));

      toast.success('Registration successful! Redirecting to dashboard...');

      // 5. SMOOTH REDIRECT
      setTimeout(() => {
        navigate('/user');
      }, 1500);

    } catch (err) {
      console.error('❌ Registration error:', err);
      
      if (err.code === 'auth/email-already-in-use') {
        toast.error('This email is already registered. Please login instead.');
      } else if (err.code === 'auth/weak-password') {
        toast.error('Password should be at least 6 characters.');
      } else {
        toast.error(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-3 sm:p-6 md:p-8">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl overflow-hidden">
        {/* Header */}
        <div className="bg-brand-primary text-white p-8 sm:p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none"></div>
          <div className="inline-block p-3 sm:p-4 bg-white/10 backdrop-blur-md rounded-3xl mb-6 shadow-xl border border-white/20">
            <img src="/logo.png" alt="CivicFix" className="h-10 w-10 sm:h-12 sm:w-12 invert opacity-90" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight relative z-10">Join CivicFix</h1>
          <p className="mt-3 text-brand-bg/80 font-medium sm:text-lg relative z-10">Report infrastructure issues and improve your city</p>
        </div>

        <div className="p-5 sm:p-8 md:p-12">
          {/* Role Information */}
          <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-brand-primary p-3 rounded-lg bg-opacity-10 text-brand-primary">
                <FiUser className="text-2xl" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Citizen Account</h3>
                <p className="text-gray-600">
                  You're registering as a citizen. This allows you to report infrastructure issues 
                  and track their resolution status.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiUser className="inline mr-2" />
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiMail className="inline mr-2" />
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiPhone className="inline mr-2" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="+91 9876543210"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiMapPin className="inline mr-2" />
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="Mumbai"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiMapPin className="inline mr-2" />
                  Complete Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="Street, Area, Landmark"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiMapPin className="inline mr-2" />
                  Pincode
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="400001"
                />
              </div>
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiLock className="inline mr-2" />
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="At least 6 characters"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiLock className="inline mr-2" />
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="Re-enter password"
                  required
                />
              </div>
            </div>

            {/* Terms and Submit */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-center mb-6">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  className="mr-3"
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  I agree to the <a href="#" className="text-brand-primary hover:underline font-medium">Terms of Service</a> and <a href="#" className="text-brand-primary hover:underline font-medium">Privacy Policy</a>
                </label>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-4 bg-brand-primary text-white rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Creating Account...
                    </span>
                  ) : (
                    'Create Citizen Account'
                  )}
                </button>

                <Link
                  to="/login"
                  className="flex-1 py-4 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 text-center transition-all"
                >
                  Already have an account? Login
                </Link>
              </div>
            </div>
          </form>

          {/* Benefits Section - RESTORED */}
          <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Benefits of Citizen Account:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4">
                <div className="text-2xl mb-2">📸</div>
                <p className="font-medium text-gray-800">Report Issues</p>
                <p className="text-sm text-gray-600">Upload photos of infrastructure problems</p>
              </div>
              <div className="text-center p-4">
                <div className="text-2xl mb-2">📊</div>
                <p className="font-medium text-gray-800">Track Progress</p>
                <p className="text-sm text-gray-600">Monitor status of your reports</p>
              </div>
              <div className="text-center p-4">
                <div className="text-2xl mb-2">🏆</div>
                <p className="font-medium text-gray-800">Community Impact</p>
                <p className="text-sm text-gray-600">Contribute to city improvement</p>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default Register;
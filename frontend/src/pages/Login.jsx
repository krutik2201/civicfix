import React, { useState, useRef } from 'react'; // ⭐ Added useRef
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; 
import { auth, db } from '../firebase/config';
import { useToast } from '../contexts/ToastContext';
import ReCAPTCHA from "react-google-recaptcha"; // ⭐ Import CAPTCHA
import { 
  FiMail, FiLock, FiArrowLeft
} from 'react-icons/fi';

function Login() {
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  
  // ⭐ CAPTCHA STATE
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const recaptchaRef = useRef(null);

  // ⭐ REPLACE THIS WITH YOUR REAL SITE KEY FROM GOOGLE!
  // This is a public test key that ONLY works on localhost.
  const TEST_SITE_KEY = "6Ld6tVUsAAAAAOKX6TpW-lEUFxTDvbVLgN83my1o"; 

  const handleCaptchaChange = (value) => {
    console.log("Captcha value:", value);
    // If value is not null, the user passed the test
    setCaptchaVerified(!!value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ⭐ SECURITY CHECK
    if (!captchaVerified && !isResetMode) {
        toast.error("Please verify that you are not a robot.");
        return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      
      let userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        role: 'user' 
      };

      if (userSnap.exists()) {
        userData = { ...userData, ...userSnap.data(), id: firebaseUser.uid };
      }

      localStorage.clear(); 
      localStorage.setItem('user', JSON.stringify(userData));

      toast.success('Login successful! Redirecting...');
      
      setTimeout(() => {
        if (userData.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/user');
        }
      }, 500);

    } catch (err) {
      console.error('Login error:', err);
      // Reset CAPTCHA on error so they have to verify again (Security Best Practice)
      if (recaptchaRef.current) recaptchaRef.current.reset();
      setCaptchaVerified(false);

      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        toast.error('Invalid email or password.');
      } else if (err.code === 'auth/user-not-found') {
        toast.error('No account found with this email.');
      } else if (err.code === 'auth/too-many-requests') {
        toast.error('Too many failed attempts. Please try again later.');
      } else {
        toast.error('Failed to log in. Please check your connection.');
      }
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email) {
        toast.error("Please enter your email address.");
        return;
    }

    // (Optional) You can enforce CAPTCHA for resets too, but for UX we often skip it here
    setLoading(true);

    try {
        await sendPasswordResetEmail(auth, email);
        toast.success("Reset link sent! Please check your inbox (and spam folder).");
        setIsResetMode(false); 
    } catch (err) {
        console.error("Reset Error:", err);
        if (err.code === 'auth/user-not-found') {
            toast.error("No account found with this email.");
        } else {
            toast.error("Failed to send reset link. Try again.");
        }
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-10">
        <div className="text-center mb-8">
          <div className="inline-block p-3 sm:p-4 bg-brand-primary rounded-3xl mb-4 shadow-lg border border-brand-primary">
            <img src="/logo.png" alt="CivicFix" className="h-10 w-10 sm:h-12 sm:w-12 invert" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-primary mt-2">
            {isResetMode ? 'Reset Password' : 'CivicFix Login'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isResetMode ? 'Enter your email to receive a recovery link' : 'Access the infrastructure management system'}
          </p>
        </div>
        
        <div className="border-t border-gray-200 pt-6">
          <form onSubmit={isResetMode ? handleResetPassword : handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiMail className="inline mr-2" />
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="Enter your email"
                required
              />
            </div>

            {!isResetMode && (
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiLock className="inline mr-2" />
                    Password
                </label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="Enter your password"
                    required
                />
                </div>
            )}

            {/* ⭐ CAPTCHA WIDGET (Only show in Login Mode) */}
            {!isResetMode && (
                <div className="flex justify-center py-2">
                    <ReCAPTCHA
                        ref={recaptchaRef}
                        sitekey={TEST_SITE_KEY} // ⚠️ REPLACE FOR PRODUCTION
                        onChange={handleCaptchaChange}
                    />
                </div>
            )}

            {!isResetMode && (
                <div className="flex items-center justify-between">
                <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <button 
                    type="button"
                    onClick={() => { setIsResetMode(true); }}
                    className="text-sm text-brand-primary hover:underline bg-transparent border-none cursor-pointer font-medium"
                >
                    Forgot password?
                </button>
                </div>
            )}

            <button
              type="submit"
              disabled={loading || (!isResetMode && !captchaVerified)} // ⭐ Disable if captcha not checked
              className={`w-full py-3 text-white rounded-lg font-medium transition-all shadow-md flex items-center justify-center
                ${(loading || (!isResetMode && !captchaVerified)) 
                    ? 'bg-gray-400 cursor-not-allowed opacity-70' 
                    : isResetMode ? 'bg-gray-800 hover:bg-black' : 'bg-brand-primary hover:bg-slate-800'
                }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Processing...
                </span>
              ) : (
                isResetMode ? 'Send Reset Link' : 'Login to CivicFix'
              )}
            </button>

            {isResetMode && (
                <button 
                    type="button"
                    onClick={() => { setIsResetMode(false); }}
                    className="w-full py-3 text-gray-500 font-bold hover:text-gray-800 flex items-center justify-center gap-2"
                >
                    <FiArrowLeft /> Back to Login
                </button>
            )}

          </form>
        </div>

        {!isResetMode && (
            <div className="mt-8 text-center">
            <p className="text-gray-600">
                Don't have an account?
                <Link
                to="/register"
                className="ml-2 text-brand-primary hover:text-slate-800 font-bold"
                >
                Create Citizen Account
                </Link>
            </p>
            </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Secured with Firebase Auth & reCAPTCHA
              <br />
              <span className="text-green-600">● Connected to Live System</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
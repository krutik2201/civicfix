import React, { useState, useRef, useEffect } from 'react';
import { FiCamera, FiUpload, FiMapPin, FiX, FiRefreshCw, FiActivity, FiCheckCircle, FiAlertTriangle, FiAlertCircle } from 'react-icons/fi';
import { reportService, userService } from '../services/firebaseService';
import { auth, db } from '../firebase/config';
// ⭐ FIXED: Consolidated imports
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth'; 
import { BACKEND_URL } from '../utils/constants';

const UserApp = () => {
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [location, setLocation] = useState(null);
  const [useCamera, setUseCamera] = useState(false);
  const [stream, setStream] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  
  // ⭐ FIXED: Added missing state variable
  const [verifiedUserId, setVerifiedUserId] = useState(null);
  
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  // --- 1. DATA SYNC & AUTH ---
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setUserDetails(storedUser);
    
    // ⭐ FIXED: Added Auth Listener to populate verifiedUserId
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("🔥 Firebase Auth Verified:", user.uid);
        setVerifiedUserId(user.uid);
        
        // Fix LocalStorage if needed
        if (!storedUser.uid) {
           const updated = { ...storedUser, uid: user.uid, id: user.uid, email: user.email };
           setUserDetails(updated);
           localStorage.setItem('user', JSON.stringify(updated));
        }
      }
    });

    fetchFreshUserData(); 
    handleGetLocation(); 
    
    return () => {
        stopCamera();
        unsubscribe(); // Clean up listener
    };
  }, []);

  const fetchFreshUserData = async () => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = storedUser.uid || storedUser.id || auth.currentUser?.uid;

    if (userId) {
      try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const freshData = { ...storedUser, ...userSnap.data(), id: userId };
          setUserDetails(freshData);
          localStorage.setItem('user', JSON.stringify(freshData));
        }
      } catch (e) { console.error("Sync error:", e); }
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported.");
    
    setLocation(prev => prev ? { ...prev, address: "Updating location..." } : { lat: 0, lng: 0, address: "Locating..." });

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        
        const fullAddress = data.display_name || "Address Found";
        const addr = data.address || {};
        const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || addr.state_district || "Unknown Location";

        setLocation({ lat: latitude, lng: longitude, address: fullAddress });
        
        const updatedUser = { ...userDetails, city, address: fullAddress };
        setUserDetails(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        if (userDetails?.uid || userDetails?.id) {
          userService.updateUser(userDetails.uid || userDetails.id, { city, address: fullAddress });
        }
      } catch (e) { 
          console.error(e);
          setLocation({ lat: latitude, lng: longitude, address: "Address lookup failed" }); 
      }
    }, (err) => {
        alert("GPS Access Denied. Please enable location.");
    }, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
    });
  };

  // --- 2. CAMERA ---
  useEffect(() => { if (useCamera) startCamera(); else stopCamera(); }, [useCamera]);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch (e) { alert('Camera denied'); setUseCamera(false); }
  };

  const stopCamera = () => { if (stream) stream.getTracks().forEach(t => t.stop()); setStream(null); };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      canvasRef.current.getContext('2d').drawImage(videoRef.current, 0, 0);
      canvasRef.current.toBlob(blob => {
        setImageFile(new File([blob], 'capture.jpg', { type: 'image/jpeg' }));
        setImage(URL.createObjectURL(blob));
        setUseCamera(false);
      }, 'image/jpeg', 0.9);
    }
  };

  const handleFileUpload = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setImage(URL.createObjectURL(e.target.files[0]));
      setResult(null);
      setErrorMsg(null);
    }
  };

  // --- 3. ANALYSIS ---
  const handleAnalyze = async () => {
    const finalUserId = verifiedUserId || userDetails?.id || userDetails?.uid || auth.currentUser?.uid;

    if (!finalUserId) {
        console.error("❌ CRITICAL: No User ID found.");
        alert("Login Error: We cannot verify your identity. Please Logout and Login again.");
        return; 
    }

    if (!imageFile) return;
    if (!location || location.address === "Locating...") { alert("Wait for location..."); return; }

    setLoading(true);
    setErrorMsg(null);

    try {
      // ⭐ FRONTEND RATE LIMIT CHECK
      const todayPrefix = new Date().toISOString().split('T')[0];

      const q = query(
        collection(db, "reports"), 
        where("userId", "==", finalUserId)
      );
      
      const querySnapshot = await getDocs(q);
      
      let dailyCount = 0;
      querySnapshot.forEach((doc) => {
         const data = doc.data();
         if (data.timestamp && data.timestamp.startsWith(todayPrefix)) {
             dailyCount++;
         }
      });

      console.log(`📊 Daily Report Count: ${dailyCount}/5`);

      if (dailyCount >= 5) {
          setErrorMsg(`Daily limit reached (${dailyCount}/5). Please try again tomorrow.`);
          setLoading(false);
          return;
      }

      const fd = new FormData();
      fd.append('file', imageFile);
      fd.append('latitude', location.lat);
      fd.append('longitude', location.lng);
      fd.append('user_id', finalUserId);
      
      const res = await fetch(`${BACKEND_URL}/analyze-image`, { method: 'POST', body: fd });
      
      if (res.status === 429) {
          const errData = await res.json();
          setErrorMsg(errData.detail || "Daily report limit reached.");
          setLoading(false);
          return;
      }

      const data = await res.json();
      
      if (data.status === 'success' || data.data) {
        const rawData = data.data || {};
        const serverImageUrl = rawData.imageUrl || null; 

        const analysis = {
            issue_detected: rawData.issue_detected ?? true, 
            type: rawData.type || "General Issue",
            severity_score: rawData.severity_score || 5,
            recommended_action: rawData.recommended_action || "Inspection Required",
            danger_reason: rawData.danger_reason || "Potential hazard detected",
            location: location,
            imageUrl: serverImageUrl 
        };

        await saveReport(analysis, finalUserId); 
        setResult(analysis); // Pass ID explicitly

      } else {
          throw new Error("Invalid AI Response");
      }
    } catch (e) { 
        console.error(e);
        setErrorMsg("Failed to save report: " + (e.message || "Unknown Error"));
    } finally { 
        setLoading(false); 
    }
  };

  const saveReport = async (data, explicitUserId) => {
    setSaving(true);
    try {
      const userId = explicitUserId || userDetails?.uid || userDetails?.id;
      
      const reportPayload = {
        type: data.type || "Unknown",
        severity_score: Number(data.severity_score) || 1,
        danger_reason: data.danger_reason || "None",
        recommended_action: data.recommended_action || "Review",
        status: 'OPEN',
        source: 'web_app',
        userId: userId || 'anonymous',
        userName: userDetails?.name || 'Citizen',
        userEmail: userDetails?.email || 'No Email',
        imageUrl: data.imageUrl || null,
        location: { 
            coordinates: { 
                lat: Number(data.location?.lat) || 0, 
                lng: Number(data.location?.lng) || 0 
            }, 
            address: data.location?.address || "Unknown" 
        },
        timestamp: new Date().toISOString()
      };

      await reportService.createReport(reportPayload);

      const newCount = (userDetails?.reportsCount || 0) + 1;
      const updatedUser = { ...userDetails, reportsCount: newCount };
      setUserDetails(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      if (userId) userService.updateUser(userId, { reportsCount: newCount });

    } catch (e) { 
        console.error("Firebase Save Error:", e); 
        throw e;
    } finally { 
        setSaving(false); 
    }
  };

  const reset = () => { setImage(null); setImageFile(null); setResult(null); setUseCamera(false); setErrorMsg(null); };

  return (
    <div className="max-w-3xl mx-auto px-3 py-6 sm:px-6 sm:py-10 font-sans text-gray-800">
      
      {/* HEADER */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100/50 mb-6 sm:mb-8 relative overflow-hidden transition-all">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 sm:gap-6 relative z-10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-brand-primary flex items-center gap-3">
              Hello, {userDetails?.name?.split(' ')[0] || 'Citizen'} <span className="animate-pulse">👋</span>
            </h1>
            <div className="flex items-center gap-3 mt-3">
              <span className="flex items-center gap-1.5 bg-brand-bg px-4 py-1.5 rounded-full text-xs font-bold text-gray-600 border border-gray-200">
                <FiMapPin className="text-brand-primary" /> {userDetails?.city || 'Locating...'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-brand-bg p-4 rounded-3xl border border-gray-200 shadow-sm">
            <div className="bg-white p-3 rounded-2xl text-brand-primary shadow-sm"><FiActivity size={24} /></div>
            <div>
              <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">Reports</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-3xl font-black text-brand-primary leading-none">{userDetails?.reportsCount || 0}</span>
                <button onClick={fetchFreshUserData} className="text-gray-400 hover:text-brand-primary transition-all active:scale-90"><FiRefreshCw size={14} /></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CARD */}
      <div className="bg-white rounded-[2rem] shadow-2xl shadow-gray-200/50 border border-gray-100/60 overflow-hidden p-5 sm:p-8 md:p-12">
        <h2 className="text-xl sm:text-2xl font-black text-brand-primary mb-6 sm:mb-8 flex items-center gap-3">
          <span className="bg-brand-bg text-brand-primary p-2.5 sm:p-3 rounded-2xl shadow-sm border border-gray-200"><FiCamera className="text-xl sm:text-2xl" /></span>
          Report Issue
        </h2>

        {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 animate-bounce">
                <FiAlertCircle className="text-xl" />
                <span className="font-bold">{errorMsg}</span>
            </div>
        )}

        {useCamera ? (
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-video mb-6">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <button onClick={capturePhoto} className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 border-4 border-white rounded-full bg-red-500"></button>
            <button onClick={() => setUseCamera(false)} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full"><FiX /></button>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        ) : image && !loading && !result ? (
          <div className="relative rounded-2xl overflow-hidden shadow-md group mb-6 bg-gray-50 border border-gray-200">
            <img src={image} alt="Preview" className="w-full h-64 object-contain" />
            <button onClick={reset} className="absolute top-3 right-3 bg-white text-gray-700 p-2 rounded-full shadow-lg"><FiX /></button>
          </div>
        ) : !loading && !result ? (
          <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-5 mb-6 sm:mb-8">
            <button onClick={() => fileInputRef.current?.click()} className="group flex flex-col items-center justify-center p-6 sm:p-10 border-2 border-dashed border-gray-300 bg-brand-bg rounded-2xl sm:rounded-3xl hover:bg-white hover:border-brand-primary transition-all hover:shadow-xl active:scale-95">
              <div className="bg-white p-3 sm:p-4 rounded-full shadow-sm mb-2 sm:mb-4 group-hover:scale-110 transition-transform"><FiUpload className="text-2xl sm:text-3xl text-gray-600 group-hover:text-brand-primary" /></div>
              <span className="text-sm sm:text-base font-bold text-gray-700 group-hover:text-brand-primary">Upload</span>
            </button>
            <button onClick={() => setUseCamera(true)} className="group flex flex-col items-center justify-center p-6 sm:p-10 border-2 border-dashed border-gray-300 bg-brand-bg rounded-2xl sm:rounded-3xl hover:bg-white hover:border-brand-primary transition-all hover:shadow-xl active:scale-95">
              <div className="bg-white p-3 sm:p-4 rounded-full shadow-sm mb-2 sm:mb-4 group-hover:scale-110 transition-transform"><FiCamera className="text-2xl sm:text-3xl text-gray-600 group-hover:text-brand-primary" /></div>
              <span className="text-sm sm:text-base font-bold text-gray-700 group-hover:text-brand-primary">Camera</span>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </div>
        ) : null}

        {/* LOADING */}
        {loading && image ? (
          <div className="scanner-container aspect-video mb-6">
            <img src={image} className="scanner-image" alt="Scanning..." />
            <div className="scanner-line"></div>
            <div className="scanner-overlay"></div>
            <div className="scanner-text">
                <p className="text-blue-300 font-mono text-xl font-bold animate-pulse tracking-[0.2em]">ANALYZING...</p>
                <p className="text-blue-500 font-mono text-xs mt-2 tracking-widest">IDENTIFYING DEFECTS</p>
            </div>
          </div>
        ) : null}

        {/* RESULTS */}
        {result ? (
          <div className="bg-white rounded-3xl border-2 border-brand-success/20 overflow-hidden shadow-xl animate-fadeIn mt-4">
            <div className="bg-brand-success/10 p-5 border-b border-brand-success/20 flex items-center gap-3">
              <FiCheckCircle className="text-brand-success text-2xl" />
              <span className="font-black text-brand-success text-lg">Report Filed</span>
            </div>
            <div className="p-8 space-y-5">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <span className="text-sm font-bold text-gray-500">Issue Type</span>
                <span className="font-black text-brand-primary bg-brand-bg border border-gray-200 px-4 py-1.5 rounded-xl">{result.type}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <span className="text-sm font-bold text-gray-500">Location Details</span>
                <span className="text-xs font-black font-mono text-gray-600 bg-brand-bg px-3 py-1.5 rounded-xl border border-gray-200">
                  {location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : "No GPS Data"}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <span className="text-sm font-bold text-gray-500">Severity</span>
                <span className={`px-4 py-1.5 rounded-full text-xs font-black border tracking-wide ${result.severity_score >= 7 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-brand-success/10 text-brand-success border-brand-success/20'}`}>
                  {result.severity_score}/10
                </span>
              </div>
              <div className="bg-brand-bg p-5 rounded-2xl border border-gray-200 mt-2">
                <p className="text-[11px] text-gray-500 uppercase font-black tracking-widest mb-2 flex items-center gap-2"><FiAlertTriangle size={14} className="text-brand-warning" /> Recommended Action</p>
                <p className="font-bold text-brand-primary leading-relaxed">{result.recommended_action}</p>
              </div>
              <button onClick={reset} className="w-full mt-2 sm:mt-4 py-3 sm:py-4 bg-brand-primary text-white rounded-2xl font-black text-lg hover:bg-slate-800 transition-all active:scale-95 shadow-lg">Submit Another</button>
            </div>
          </div>
        ) : !loading && (
          <div className="bg-brand-bg rounded-2xl p-5 flex items-center justify-between border border-gray-200 mb-8 mt-6">
            <div className="flex items-center gap-4 overflow-hidden">
              <div className="bg-white p-2 rounded-xl shadow-sm"><FiMapPin className={`text-brand-primary ${location?.address === 'Locating...' ? 'animate-pulse' : ''}`} size={18} /></div>
              <p className="text-sm font-bold text-gray-700 truncate">{location?.address || "Detecting location..."}</p>
            </div>
            {location && location.address !== 'Locating...' && (
               <button onClick={handleGetLocation} className="text-xs font-black text-brand-primary bg-white border border-gray-200 shadow-sm px-5 py-2.5 rounded-xl ml-3 hover:bg-gray-50 active:scale-95 transition-all">REFRESH</button>
            )}
          </div>
        )}

        {!loading && !result && (
            <button onClick={handleAnalyze} disabled={!image || !location || location.address === 'Locating...'} className={`w-full py-4 sm:py-5 rounded-2xl sm:rounded-[1.25rem] font-black text-base sm:text-lg transition-all flex items-center justify-center gap-2 ${image && location && location.address !== 'Locating...' ? 'bg-brand-primary text-white shadow-xl hover:bg-slate-800 active:scale-95 hover:-translate-y-1' : 'bg-brand-bg text-gray-400 cursor-not-allowed border border-gray-200'}`}>
              {image ? (location && location.address !== 'Locating...' ? 'Submit Report' : 'Detecting Location...') : 'Select Photo to Start'}
            </button>
        )}
      </div>
    </div>
  );
};

export default UserApp;
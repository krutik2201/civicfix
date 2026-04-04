import React, { useState, useRef, useEffect } from 'react';
import { FiCamera, FiUpload, FiMapPin, FiX, FiRefreshCw, FiActivity, FiCheckCircle, FiAlertTriangle, FiAlertCircle, FiClock, FiCheck, FiStar, FiMessageSquare } from 'react-icons/fi';
import { reportService, userService } from '../services/firebaseService';
import { auth, db } from '../firebase/config';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth'; 
import { BACKEND_URL } from '../utils/constants';
import axios from 'axios';

const UserApp = () => {
  const [activeTab, setActiveTab] = useState('report'); // 'report' | 'my-reports'
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
  
  const [verifiedUserId, setVerifiedUserId] = useState(null);
  
  // My Reports State
  const [myReports, setMyReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [feedbackInputs, setFeedbackInputs] = useState({});
  const [submittingFeedback, setSubmittingFeedback] = useState(null);

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  // --- 1. DATA SYNC & AUTH ---
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setUserDetails(storedUser);
    
    // Auth Listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setVerifiedUserId(user.uid);
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
        unsubscribe(); 
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

  // --- MY REPORTS FETCHING ---
  const fetchMyReports = async () => {
    const finalUserId = verifiedUserId || userDetails?.uid || userDetails?.id || auth.currentUser?.uid;
    if (!finalUserId) return;
    
    setLoadingReports(true);
    try {
      const dbq = query(collection(db, "reports"), where("userId", "==", finalUserId));
      const querySnapshot = await getDocs(dbq);
      const reports = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort newest first
      reports.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setMyReports(reports);
    } catch (e) {
      console.error("Failed to fetch reports:", e);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'my-reports') {
      fetchMyReports();
    } else {
      stopCamera();
    }
  }, [activeTab, verifiedUserId, userDetails]);

  const handleFeedbackChange = (reportId, field, value) => {
    setFeedbackInputs(prev => ({
        ...prev,
        [reportId]: { ...(prev[reportId] || {}), [field]: value }
    }));
  };

  const submitFeedback = async (reportId) => {
    const input = feedbackInputs[reportId];
    if (!input || !input.rating) return alert("Please select a rating.");
    
    setSubmittingFeedback(reportId);
    try {
        await axios.patch(`${BACKEND_URL}/user/reports/${reportId}/feedback`, {
            rating: input.rating,
            text: input.text || ""
        });
        
        // Update local state
        setMyReports(prev => prev.map(r => r.id === reportId ? {
            ...r,
            citizen_rating: input.rating,
            citizen_feedback: input.text || "",
            rated_at: new Date().toISOString()
        } : r));
        
        // Clear input
        setFeedbackInputs(prev => {
            const next = { ...prev };
            delete next[reportId];
            return next;
        });
    } catch (e) {
        console.error("Failed to submit feedback", e);
        alert("Failed to save feedback.");
    } finally {
        setSubmittingFeedback(null);
    }
  };

  // --- 2. CAMERA ---
  useEffect(() => { if (useCamera && activeTab === 'report') startCamera(); else stopCamera(); }, [useCamera, activeTab]);

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
      const todayPrefix = new Date().toISOString().split('T')[0];

      const q = query(collection(db, "reports"), where("userId", "==", finalUserId));
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
            is_valid: rawData.is_valid ?? true,
            rejection_reason: rawData.rejection_reason || null,
            category: rawData.category || "Unknown",
            severity_score: rawData.severity_score || 1,
            estimated_cost_inr: rawData.estimated_cost_inr || 0,
            location: location,
            imageUrl: serverImageUrl 
        };

        if (!analysis.is_valid || analysis.rejection_reason) {
            setErrorMsg(`Report Rejected: ${analysis.rejection_reason}`);
            setLoading(false);
            return;
        }

        await saveReport(analysis, finalUserId); 
        setResult(analysis); 
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

  const generateTrackingId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `CFX-${result}`;
  };

  const saveReport = async (data, explicitUserId) => {
    setSaving(true);
    try {
      const userId = explicitUserId || userDetails?.uid || userDetails?.id;
      const trackingId = generateTrackingId();
      
      const reportPayload = {
        issue_id: trackingId, // NEW Unique Tracking ID
        category: data.category || "Unknown", // USING CATEGORY NOW
        severity_score: Number(data.severity_score) || 1,
        estimated_cost_inr: data.estimated_cost_inr || 0, // NEW field
        status: 'Reported',
        source: 'web_app',
        userId: userId || 'anonymous',
        userName: userDetails?.name || 'Citizen',
        userEmail: userDetails?.email || 'No Email',
        userPhone: userDetails?.phone || '', // Store for admin access
        reporter_info: {
            name: userDetails?.name || 'Citizen',
            phone: userDetails?.phone || ''
        },
        images: {
            before_url: data.imageUrl || null,
            after_url: null
        },
        imageUrl: data.imageUrl || null, // fallback for safety
        location: { 
            coordinates: { 
                lat: Number(data.location?.lat) || 0, 
                lng: Number(data.location?.lng) || 0 
            }, 
            address: data.location?.address || "Unknown",
            lat: Number(data.location?.lat) || 0,  // Storing at root level for easy plotting
            lng: Number(data.location?.lng) || 0
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

  const getStatusBadge = (status) => {
      switch(status) {
          case 'Reported': case 'OPEN': return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold border border-yellow-200 flex items-center gap-1"><FiAlertCircle /> Reported</span>;
          case 'In-Progress': case 'IN_PROGRESS': return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold border border-blue-200 flex items-center gap-1"><FiActivity /> In-Progress</span>;
          case 'Resolved': case 'RESOLVED': return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold border border-green-200 flex items-center gap-1"><FiCheck /> Resolved</span>;
          default: return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-bold border border-gray-200">{status}</span>;
      }
  }

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

      {/* NAVIGATION TABS */}
      <div className="flex gap-2 mb-6 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
        <button 
            onClick={() => setActiveTab('report')}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex justify-center items-center gap-2 ${activeTab === 'report' ? 'bg-brand-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
        >
            <FiCamera /> Report Issue
        </button>
        <button 
            onClick={() => setActiveTab('my-reports')}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex justify-center items-center gap-2 ${activeTab === 'my-reports' ? 'bg-brand-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
        >
            <FiClock /> My Reports
        </button>
      </div>

      {/* MAIN CONTENT AREA */}
      {activeTab === 'report' ? (
        <div className="bg-white rounded-[2rem] shadow-2xl shadow-gray-200/50 border border-gray-100/60 overflow-hidden p-5 sm:p-8 md:p-12 animate-fadeIn">
            <h2 className="text-xl sm:text-2xl font-black text-brand-primary mb-6 sm:mb-8 flex items-center gap-3">
            <span className="bg-brand-bg text-brand-primary p-2.5 sm:p-3 rounded-2xl shadow-sm border border-gray-200"><FiCamera className="text-xl sm:text-2xl" /></span>
            New Report
            </h2>

            {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 animate-bounce">
                    <FiAlertCircle className="text-xl shrink-0" />
                    <span className="font-bold text-sm">{errorMsg}</span>
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
                <span className="text-sm sm:text-base font-bold text-gray-700 group-hover:text-brand-primary">Upload Photo</span>
                </button>
                <button onClick={() => setUseCamera(true)} className="group flex flex-col items-center justify-center p-6 sm:p-10 border-2 border-dashed border-gray-300 bg-brand-bg rounded-2xl sm:rounded-3xl hover:bg-white hover:border-brand-primary transition-all hover:shadow-xl active:scale-95">
                <div className="bg-white p-3 sm:p-4 rounded-full shadow-sm mb-2 sm:mb-4 group-hover:scale-110 transition-transform"><FiCamera className="text-2xl sm:text-3xl text-gray-600 group-hover:text-brand-primary" /></div>
                <span className="text-sm sm:text-base font-bold text-gray-700 group-hover:text-brand-primary">Take Photo</span>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </div>
            ) : null}

            {/* LOADING */}
            {loading && image ? (
            <div className="scanner-container aspect-video mb-6 rounded-2xl overflow-hidden relative border border-gray-200">
                <img src={image} className="w-full h-full object-cover opacity-50" alt="Scanning..." />
                <div className="absolute inset-0 bg-blue-500/10"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <p className="text-white font-mono text-xl font-black bg-slate-900/80 px-6 py-3 rounded-2xl shadow-xl animate-pulse tracking-[0.2em] border border-slate-700/50">ANALYZING...</p>
                    <p className="text-blue-300 font-mono text-[10px] sm:text-xs tracking-widest bg-slate-900/60 px-4 py-1.5 rounded-lg border border-slate-700/50">IDENTIFYING DEFECTS & ESTIMATING COST</p>
                </div>
            </div>
            ) : null}

            {/* RESULTS */}
            {result ? (
            <div className="bg-white rounded-3xl border-2 border-brand-success/20 overflow-hidden shadow-xl animate-fadeIn mt-4">
                <div className="bg-brand-success/10 p-5 border-b border-brand-success/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FiCheckCircle className="text-brand-success text-2xl" />
                        <span className="font-black text-brand-success text-lg">Report Verified & Filed</span>
                    </div>
                </div>
                <div className="p-8 space-y-5">
                <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <span className="text-sm font-bold text-gray-500">Category Tag</span>
                    <span className="font-black text-brand-primary bg-brand-bg px-3 py-1 rounded-lg border border-gray-200 text-sm">{result.category}</span>
                </div>
                <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <span className="text-sm font-bold text-gray-500">Severity Match</span>
                    <span className={`px-4 py-1.5 rounded-full text-xs font-black border tracking-wide ${result.severity_score >= 7 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-brand-success/10 text-brand-success border-brand-success/20'}`}>
                    {result.severity_score}/10
                    </span>
                </div>

                
                <button onClick={() => { reset(); setActiveTab('my-reports'); }} className="w-full mt-2 sm:mt-4 py-3 sm:py-4 bg-brand-primary text-white rounded-2xl font-black text-lg hover:bg-slate-800 transition-all active:scale-95 shadow-lg">View My Reports</button>
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
                {image ? (location && location.address !== 'Locating...' ? 'Submit Incident' : 'Wait for Region Lock...') : 'Select Photo to Start'}
                </button>
            )}
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] shadow-2xl shadow-gray-200/50 border border-gray-100/60 overflow-hidden p-5 sm:p-8 animate-fadeIn">
            <h2 className="text-xl sm:text-2xl font-black text-brand-primary mb-6 sm:mb-8 flex items-center gap-3">
            <span className="bg-brand-bg text-brand-primary p-2.5 sm:p-3 rounded-2xl shadow-sm border border-gray-200"><FiClock className="text-xl sm:text-2xl" /></span>
            My Reports History
            </h2>

            {loadingReports ? (
                <div className="text-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-brand-primary border-t-transparent mx-auto"></div>
                    <p className="text-gray-500 font-bold mt-4 text-sm tracking-wide">Loading records...</p>
                </div>
            ) : myReports.length === 0 ? (
                <div className="text-center py-12 bg-brand-bg rounded-2xl border border-gray-200 border-dashed">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-sm mb-4">
                        <FiCheckCircle className="text-3xl text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-bold text-lg">You haven't reported any issues yet.</p>
                    <p className="text-gray-400 text-sm mt-2">Help keep your city clean and safe.</p>
                </div>
            ) : (
                <div className="space-y-5">
                    {myReports.map((report) => {
                        const isResolved = report.status === 'Resolved' || report.status === 'RESOLVED';
                        const showFeedbackForm = isResolved && !report.citizen_rating;
                        const ratingInput = feedbackInputs[report.id]?.rating || 0;
                        const textInput = feedbackInputs[report.id]?.text || '';
                        
                        return (
                        <div key={report.id} className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
                            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
                                {/* Image Thumbnail */}
                                <div className={`w-full h-48 sm:h-32 bg-gray-100 rounded-xl overflow-hidden shrink-0 border border-gray-100 relative ${report.images?.after_url ? 'sm:w-64 grid grid-cols-2 gap-1 bg-gray-200' : 'sm:w-36'}`}>
                                    {(report.images?.before_url || report.imageUrl) ? (
                                        <div className="relative h-full">
                                            <img src={report.images?.before_url || report.imageUrl} alt="Before" className="w-full h-full object-cover" />
                                            {report.images?.after_url && <span className="absolute bottom-1 left-1 bg-black/60 text-white font-bold text-[9px] px-1.5 py-0.5 rounded shadow-sm">BEFORE</span>}
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400"><FiCamera size={24} /></div>
                                    )}
                                    {report.images?.after_url && (
                                        <div className="relative h-full">
                                            <img src={report.images.after_url} alt="After" className="w-full h-full object-cover" />
                                            <span className="absolute bottom-1 left-1 bg-brand-success/90 text-white font-bold text-[9px] px-1.5 py-0.5 rounded shadow-sm">AFTER</span>
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2 sm:hidden z-10">
                                        {getStatusBadge(report.status)}
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="flex-1 space-y-2.5 min-w-0 w-full">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-mono font-black text-brand-primary tracking-widest bg-brand-bg border border-brand-primary/10 inline-block px-2 py-1 rounded inline-flex items-center gap-1.5 shadow-sm">
                                                ID: {report.issue_id || 'PENDING'}
                                            </p>
                                            <h3 className="font-black text-gray-800 text-lg mt-1.5 truncate">{report.category || report.type || 'Unknown Issue'}</h3>
                                        </div>
                                        <div className="hidden sm:block">
                                            {getStatusBadge(report.status)}
                                        </div>
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-500 font-medium flex items-center gap-1.5 truncate">
                                        <FiMapPin className="shrink-0 text-gray-400" /> {report.location?.address || 'Location Hidden'}
                                    </p>
                                    <div className="flex flex-wrap gap-2 pt-1 items-center">
                                        <span className="text-[11px] font-bold bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600">
                                            Severity <span className={report.severity_score >= 7 ? 'text-red-500 font-black' : 'text-gray-800'}>{report.severity_score}/10</span>
                                        </span>

                                        <span className="text-[11px] font-bold text-gray-400 py-1 ml-auto">
                                            {new Date(report.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Feedback Section */}
                            {isResolved && (
                                <div className="mt-2 pt-4 border-t border-gray-100">
                                    {report.citizen_rating ? (
                                        <div className="bg-brand-bg/60 p-4 rounded-xl border border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                                            <div>
                                                <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Your Rating</p>
                                                <div className="flex gap-1">
                                                    {[1,2,3,4,5].map(star => (
                                                        <FiStar key={star} className={`text-xl ${star <= report.citizen_rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                                    ))}
                                                </div>
                                            </div>
                                            {report.citizen_feedback && (
                                                <div className="flex-1 bg-white p-3 rounded-xl border border-gray-100 text-sm italic text-gray-600 flex gap-2 w-full shadow-sm">
                                                    <FiMessageSquare className="shrink-0 text-gray-400 mt-0.5" />
                                                    <p>{report.citizen_feedback}</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : showFeedbackForm ? (
                                        <div className="bg-gradient-to-r from-brand-bg to-white p-4 sm:p-5 rounded-2xl border border-brand-primary/20 shadow-sm relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-bl-full pointer-events-none"></div>
                                            <h4 className="font-black text-gray-800 text-sm mb-3">Rate the Resolution</h4>
                                            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                                <div className="flex gap-1.5 p-2 bg-white rounded-xl border border-gray-200 shadow-sm">
                                                    {[1,2,3,4,5].map(star => (
                                                        <button 
                                                            key={star}
                                                            onClick={() => handleFeedbackChange(report.id, 'rating', star)}
                                                            className="text-2xl transition-transform hover:scale-110 active:scale-90 focus:outline-none"
                                                        >
                                                            <FiStar className={`${star <= ratingInput ? 'fill-yellow-400 text-yellow-400 drop-shadow-sm' : 'text-gray-200'} transition-colors`} />
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="flex-1 w-full flex gap-2">
                                                    <input 
                                                        type="text" 
                                                        placeholder="Add optional feedback..." 
                                                        value={textInput}
                                                        onChange={(e) => handleFeedbackChange(report.id, 'text', e.target.value)}
                                                        className="w-full text-sm py-2 px-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all font-medium"
                                                    />
                                                    <button 
                                                        onClick={() => submitFeedback(report.id)}
                                                        disabled={submittingFeedback === report.id || ratingInput === 0}
                                                        className={`px-5 py-2.5 rounded-xl text-sm font-black shadow-lg transition-all whitespace-nowrap ${ratingInput > 0 ? 'bg-brand-primary text-white hover:bg-slate-800 active:scale-95' : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'}`}
                                                    >
                                                        {submittingFeedback === report.id ? 'Saving...' : 'Submit'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </div>
                        );
                    })}
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default UserApp;

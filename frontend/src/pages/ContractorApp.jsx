import React, { useState, useEffect, useRef } from 'react';
import { FiCamera, FiUpload, FiTool, FiCheckCircle, FiClock, FiActivity, FiMapPin, FiRefreshCw, FiAlertCircle, FiX } from 'react-icons/fi';
import { BACKEND_URL } from '../utils/constants';
import { useToast } from '../contexts/ToastContext';

const ContractorApp = () => {
    const toast = useToast();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploadingId, setUploadingId] = useState(null);

    // Selected job for upload
    const [selectedJob, setSelectedJob] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [useCamera, setUseCamera] = useState(false);
    const [stream, setStream] = useState(null);
    
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const uid = user ? user.uid : '';
            const res = await fetch(`${BACKEND_URL}/contractor/jobs?uid=${uid}`);
            const data = await res.json();
            if (data.jobs) {
                setJobs(data.jobs);
            }
        } catch (e) {
            console.error("Failed to fetch jobs:", e);
            toast.error("Failed to load active jobs. Check connection.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    // Camera Logic
    useEffect(() => { 
        if (useCamera) startCamera(); 
        else stopCamera(); 
    }, [useCamera]);

    const startCamera = async () => {
        try {
            const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            setStream(s);
            if (videoRef.current) videoRef.current.srcObject = s;
        } catch (e) { toast.error('Camera access denied'); setUseCamera(false); }
    };

    const stopCamera = () => { if (stream) stream.getTracks().forEach(t => t.stop()); setStream(null); };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            canvasRef.current.getContext('2d').drawImage(videoRef.current, 0, 0);
            canvasRef.current.toBlob(blob => {
                setImageFile(new File([blob], 'after.jpg', { type: 'image/jpeg' }));
                setImagePreview(URL.createObjectURL(blob));
                setUseCamera(false);
            }, 'image/jpeg', 0.9);
        }
    };

    const handleFileUpload = (e) => {
        if (e.target.files[0]) {
            setImageFile(e.target.files[0]);
            setImagePreview(URL.createObjectURL(e.target.files[0]));
        }
    };

    const resetUpload = () => {
        setSelectedJob(null);
        setImageFile(null);
        setImagePreview(null);
        setUseCamera(false);
    };

    const handleSubmitRepair = async () => {
        if (!selectedJob || !imageFile) return;
        
        setUploadingId(selectedJob.id);
        const jobId = selectedJob.id;
        
        try {
            const fd = new FormData();
            fd.append('file', imageFile);

            const res = await fetch(`${BACKEND_URL}/contractor/resolve/${jobId}`, { 
                method: 'POST', 
                body: fd 
            });
            const data = await res.json();
            
            if (data.status === 'rejected') {
                toast.error(`Verification Failed: ${data.reason}`);
            } else if (data.status === 'success') {
                toast.success('Repair verified and submitted for Admin review!');
                setJobs(jobs.filter(j => j.id !== jobId));
                resetUpload();
            } else {
                toast.error("An unknown error occurred.");
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to upload completion proof.");
        } finally {
            setUploadingId(null);
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 font-sans text-gray-800">
            {/* Header */}
            <div className="bg-slate-900 rounded-3xl p-8 shadow-2xl mb-8 relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="relative z-10">
                    <h1 className="text-3xl font-black text-white flex items-center gap-3">
                        <FiTool className="text-brand-warning" /> Contractor Portal
                    </h1>
                    <p className="text-slate-400 mt-2 font-medium">Active Repair Queue & Verification</p>
                </div>
                <div className="flex items-center gap-4 bg-slate-800 p-4 rounded-2xl relative z-10 border border-slate-700">
                    <div className="bg-slate-700 p-3 rounded-xl text-brand-warning"><FiActivity size={24} /></div>
                    <div>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Active Jobs</p>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-3xl font-black text-white leading-none">{jobs.length}</span>
                            <button onClick={fetchJobs} className="text-slate-500 hover:text-white transition-all"><FiRefreshCw size={14} /></button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            {loading ? (
                <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-warning border-t-transparent"></div></div>
            ) : jobs.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-50 mb-4">
                        <FiCheckCircle className="text-4xl text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-bold text-xl">No active jobs in the queue.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {jobs.map(job => (
                        <div key={job.id} className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden flex flex-col transition-all hover:shadow-xl">
                            {/* Card Image */}
                            <div className="w-full h-48 bg-gray-100 relative group border-b border-gray-100">
                                {(job.images?.before_url || job.imageUrl) ? (
                                    <img src={job.images?.before_url || job.imageUrl} alt="Before" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2"><FiCamera size={32} /><span>No Before Photo</span></div>
                                )}
                                <div className="absolute top-3 left-3">
                                    <span className="bg-slate-900/80 backdrop-blur text-white px-3 py-1.5 rounded-lg text-xs font-black tracking-widest uppercase border border-slate-700/50 flex flex-col shadow-sm">
                                        <span className="text-[9px] text-slate-400">ID</span> {job.issue_id || 'PENDING'}
                                    </span>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-3 gap-4">
                                    <h3 className="font-black text-gray-900 text-lg leading-tight line-clamp-2">{job.category || job.type || 'Unknown Job'}</h3>
                                    <span className="bg-brand-warning/10 text-brand-warning border border-brand-warning/20 px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap">
                                        Sev: {job.severity_score || 1}/10
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 flex items-start gap-1.5 mb-4 line-clamp-2 min-h-[40px]">
                                    <FiMapPin className="shrink-0 mt-0.5 text-gray-400" /> {job.location?.address || 'Unknown Location'}
                                </p>
                                
                                {job.estimated_cost_inr > 0 && (
                                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl mb-4">
                                        <p className="text-[10px] uppercase font-bold text-gray-400">Est. Repair Budget</p>
                                        <p className="font-black text-slate-700">₹{job.estimated_cost_inr.toLocaleString('en-IN')}</p>
                                    </div>
                                )}
                                
                                <div className="mt-auto pt-4 border-t border-gray-100">
                                    <button 
                                        onClick={() => setSelectedJob(job)}
                                        className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-warning hover:text-slate-900 transition-all active:scale-95 border border-transparent shadow-md"
                                    >
                                        <FiUpload /> Upload Completion Fix
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal for "After" Upload */}
            {selectedJob && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h2 className="font-black text-xl text-slate-800 flex items-center gap-2">
                                    <FiCheckCircle className="text-brand-success" /> Upload Proof
                                </h2>
                                <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Job ID: {selectedJob.issue_id}</p>
                            </div>
                            <button onClick={resetUpload} className="p-2 bg-white rounded-full shadow-sm text-gray-500 hover:text-red-500 transition-all active:scale-95"><FiX size={20}/></button>
                        </div>
                        
                        <div className="p-6">
                            {useCamera ? (
                                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video mb-6">
                                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                    <button onClick={capturePhoto} className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 border-4 border-white text-white rounded-full bg-red-500 flex items-center justify-center shadow-2xl active:bg-red-600 transition-transform hover:scale-105"></button>
                                    <button onClick={() => setUseCamera(false)} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/80 transition-colors"><FiX /></button>
                                    <canvas ref={canvasRef} className="hidden" />
                                </div>
                            ) : imagePreview ? (
                                <div className="relative rounded-2xl overflow-hidden shadow-md group mb-6 bg-gray-50 border border-gray-200">
                                    <div className="absolute top-2 left-2 bg-brand-success text-white text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded shadow-md z-10">After Photo</div>
                                    <img src={imagePreview} alt="After" className="w-full h-64 object-contain" />
                                    <button onClick={() => { setImagePreview(null); setImageFile(null); }} className="absolute top-3 right-3 bg-white text-gray-700 p-2 rounded-full shadow-lg hover:text-red-500 transition-colors z-10"><FiX /></button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <button onClick={() => fileInputRef.current?.click()} className="group flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 bg-slate-50 rounded-2xl hover:bg-white hover:border-slate-800 transition-all shadow-sm active:scale-95">
                                        <div className="bg-white p-4 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform"><FiUpload className="text-2xl text-slate-600" /></div>
                                        <span className="font-bold text-slate-700 text-sm">Upload Photo</span>
                                    </button>
                                    <button onClick={() => setUseCamera(true)} className="group flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 bg-slate-50 rounded-2xl hover:bg-white hover:border-slate-800 transition-all shadow-sm active:scale-95">
                                        <div className="bg-white p-4 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform"><FiCamera className="text-2xl text-slate-600" /></div>
                                        <span className="font-bold text-slate-700 text-sm">Take Photo</span>
                                    </button>
                                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                                </div>
                            )}

                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3 mb-6">
                                <FiAlertCircle className="text-blue-500 mt-0.5 shrink-0" />
                                <p className="text-xs text-blue-800 font-medium leading-relaxed">
                                    This image will be analyzed by AI to verify the completed work. Ensure the photo clearly shows the resolved issue matching the reported category.
                                </p>
                            </div>

                            <button 
                                onClick={handleSubmitRepair} 
                                disabled={!imageFile || uploadingId !== null}
                                className={`w-full py-4 rounded-xl font-black text-white flex items-center justify-center gap-2 transition-all ${imageFile && uploadingId === null ? 'bg-brand-success hover:bg-green-600 shadow-xl active:scale-95 hover:-translate-y-0.5' : 'bg-gray-300 cursor-not-allowed border border-gray-200'}`}
                            >
                                {uploadingId === selectedJob.id ? (
                                    <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div> Verifying Image...</>
                                ) : 'Submit for Verification'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContractorApp;

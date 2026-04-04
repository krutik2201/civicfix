import React, { useState, useEffect } from 'react';
import { getAllReports, updateReportStatus as apiUpdateStatus, deleteReport as apiDeleteReport, getContractors, assignReportToContractor } from '../services/api';
import * as XLSX from 'xlsx';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, LayerGroup } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useToast } from '../contexts/ToastContext';
import { 
  FiFilter, FiSearch, FiCheckCircle, FiTrash2, FiMapPin, 
  FiCalendar, FiAlertTriangle, FiLoader, FiDownload, FiEyeOff, FiExternalLink,
  FiDroplet, FiZap, FiTarget, FiAlertCircle, FiList, FiMap, FiPieChart, FiX, FiStar
} from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const mapContainerStyle = { width: '100%', height: '100%', borderRadius: '1rem' };
const defaultCenter = { lat: 22.3, lng: 73.2 };

// Returns a Leaflet divIcon colored by Dynamic Status/Severity Variables
const getCustomMarkerIcon = (report, severity) => {
  let color = '#f97316'; // brand-warning (orange) Default
  if (report.status === 'RESOLVED') color = '#16a34a'; // brand-success (green)
  else if (severity >= 8) color = '#dc2626'; // brand-error (red)

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="%23ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3" fill="%23ffffff"></circle></svg>`;

  return L.divIcon({
    className: "custom-pin",
    iconSize: [44, 44],
    iconAnchor: [22, 44],
    popupAnchor: [0, -40],
    html: `<div style="width: 44px; height: 44px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2));">${svg}</div>`
  });
};

const AdminDashboard = () => {
  const toast = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('OPEN'); 
  const [sortOrder, setSortOrder] = useState('newest'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [contractors, setContractors] = useState([]);
  
  // ⭐ NEW: State to track which pin is clicked
  const [selectedReport, setSelectedReport] = useState(null);

  // Admin Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');



  // --- HELPERS ---
  const parseDate = (val) => {
    if (!val) return new Date(0);
    if (val.toDate) return val.toDate();
    return new Date(val);
  };

  const timeAgo = (dateVal) => {
    if (!dateVal) return 'Unknown';
    const date = parseDate(dateVal);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getReportIcon = (report) => {
    if (report.status === 'RESOLVED') return <FiCheckCircle size={32} className="text-green-500" />;
    const type = (report.category || report.type || '').toLowerCase();
    if (type.includes('water') || type.includes('flood') || type.includes('sanitation')) return <FiDroplet size={32} className="text-blue-400" />;
    if (type.includes('light') || type.includes('electric')) return <FiZap size={32} className="text-yellow-400" />;
    if (type.includes('pothole') || type.includes('road') || type.includes('building')) return <FiTarget size={32} className="text-gray-400" />;
    return <FiAlertCircle size={32} className="text-orange-400" />;
  };

  const formatCoords = (loc) => {
    if (!loc?.coordinates && (!loc?.lat || !loc?.lng)) return '';
    const lat = loc.coordinates?.lat || loc.lat;
    const lng = loc.coordinates?.lng || loc.lng;
    return `(${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)})`;
  };

  const getCoordinates = (report) => {
    const lat = parseFloat(report.location?.coordinates?.lat || report.location?.lat);
    const lng = parseFloat(report.location?.coordinates?.lng || report.location?.lng);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    return null;
  };

  // --- DATA FETCHING ---
  const fetchReports = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await getAllReports();
      const reportsData = data.reports || [];
      reportsData.sort((a, b) => parseDate(b.timestamp) - parseDate(a.timestamp));
      setReports(reportsData);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      if (error.response?.status === 403) {
        setIsAuthenticated(false);
        localStorage.removeItem('adminSecret');
        if (!silent) toast.error('Session expired or unauthorized');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchContractors = async () => {
    try {
      const resp = await getContractors();
      if (resp.contractors) setContractors(resp.contractors);
    } catch (e) { console.error("Failed to fetch contractors"); }
  };

  useEffect(() => {
    let token = localStorage.getItem('adminSecret');
    const userStr = localStorage.getItem('user');
    
    try {
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user && user.role === 'admin') {
           // Auto-inject the admin secret if they logged in via Firebase as an admin
           token = 'hackathon_admin_123';
           localStorage.setItem('adminSecret', token);
        }
      }
    } catch(e) {}

    if (token) {
      setIsAuthenticated(true);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchReports(false);
      fetchContractors();
      const interval = setInterval(() => fetchReports(true), 10000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === 'hackathon_admin_123') {
      localStorage.setItem('adminSecret', passwordInput);
      setIsAuthenticated(true);
      toast.success('Login successful');
    } else {
      toast.error('Invalid Admin Password');
    }
  };

  const getSeverity = (r) => r.severity_score || r.severityScore || 0;
  const validReports = reports.filter(r => getSeverity(r) >= 2);

  const updateStatus = async (id, newStatus) => {
    try { 
      await apiUpdateStatus(id, newStatus);
      toast.success(`Status updated to ${newStatus}`);
      fetchReports();
    } catch (e) { toast.error("Error updating status"); }
  };

  const deleteReport = async (id) => {
    if (window.confirm("Delete permanent?")) {
      try {
        await apiDeleteReport(id);
        toast.success("Report deleted successfully");
        fetchReports();
      } catch (e) { toast.error("Error deleting report"); }
    }
  };

  const handleExport = () => {
    const data = filteredReports.map(r => ({
      "Tracking ID": r.issue_id || "N/A",
      "Category": r.category || r.type, 
      "Severity": getSeverity(r), 
      "Status": r.status,
      "Reporter": r.reporter_info?.name || r.userName || "N/A",
      "Phone": r.reporter_info?.phone || r.userPhone || "N/A",
      "Address": r.location?.address, 
      "Coordinates": formatCoords(r.location)
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reports");
    XLSX.writeFile(wb, `CivicFix_Export.xlsx`);
  };

  const getFilteredReports = () => {
    let result = validReports.filter(report => {
      const score = getSeverity(report);
      if (filter === 'OPEN' && !['OPEN', 'Reported', 'In-Progress'].includes(report.status)) return false;
      if (filter === 'PENDING' && report.status !== 'Pending Verification') return false;
      if (filter === 'RESOLVED' && report.status !== 'RESOLVED') return false;
      if (filter === 'CRITICAL' && score < 8) return false;
      if (searchTerm) {
        const t = searchTerm.toLowerCase();
        const cat = (report.category || report.type || '').toLowerCase();
        const address = (report.location?.address || '').toLowerCase();
        const id = (report.issue_id || '').toLowerCase();
        return cat.includes(t) || address.includes(t) || id.includes(t);
      }
      return true;
    });

    result.sort((a, b) => {
      if (sortOrder === 'severity_desc') return getSeverity(b) - getSeverity(a);
      return sortOrder === 'oldest' ? parseDate(a.createdAt) - parseDate(b.createdAt) : parseDate(b.createdAt) - parseDate(a.createdAt);
    });
    return result;
  };

  const filteredReports = getFilteredReports();

  const getSeverityBadge = (score) => {
    if (score >= 8) return 'bg-red-100 text-red-800 border-red-200';
    if (score >= 5) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 max-w-sm w-full text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Admin Login</h2>
          <form onSubmit={handleLogin}>
            <input 
              type="password" 
              value={passwordInput} 
              onChange={(e) => setPasswordInput(e.target.value)} 
              placeholder="Enter Admin Password" 
              className="w-full pl-4 pr-4 py-3 bg-brand-bg border border-gray-200 rounded-lg text-sm mb-4 focus:ring-2 focus:ring-brand-primary outline-none transition" 
              required
            />
            <button type="submit" className="w-full bg-brand-primary text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition">Login to Dashboard</button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) return <div className="flex justify-center p-20"><FiLoader className="animate-spin text-4xl text-brand-primary" /></div>;

  return (
    <div className="space-y-8 pb-10">
      
      {/* STATS HEADER */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1">
          <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Total</p>
          <p className="text-4xl font-black text-brand-primary mt-2">{validReports.length}</p>
        </div>
        <div className="bg-red-50 p-6 rounded-3xl shadow-lg border border-red-100 hover:shadow-xl transition-all hover:-translate-y-1">
          <p className="text-red-400 text-xs uppercase font-bold tracking-wider">Critical</p>
          <p className="text-4xl font-black text-red-600 mt-2">{validReports.filter(r => getSeverity(r) >= 8 && ['OPEN', 'Reported', 'In-Progress'].includes(r.status)).length}</p>
        </div>
        <div className="bg-blue-50 p-6 rounded-3xl shadow-lg border border-blue-100 hover:shadow-xl transition-all hover:-translate-y-1">
          <p className="text-blue-400 text-xs uppercase font-bold tracking-wider">Active</p>
          <p className="text-4xl font-black text-blue-600 mt-2">{validReports.filter(r => ['OPEN', 'Reported', 'In-Progress'].includes(r.status)).length}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-3xl shadow-lg border border-green-100 hover:shadow-xl transition-all hover:-translate-y-1">
          <p className="text-green-500 text-xs uppercase font-bold tracking-wider">Fixed</p>
          <p className="text-4xl font-black text-green-600 mt-2">{validReports.filter(r => r.status === 'RESOLVED').length}</p>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 flex flex-col lg:flex-row gap-5 justify-between items-center mt-2">
        <div className="flex gap-2 bg-brand-bg p-1.5 rounded-2xl border border-gray-200">
          {['ALL', 'OPEN', 'CRITICAL', 'PENDING', 'RESOLVED'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${filter === f ? 'bg-brand-primary text-white shadow-md' : 'text-gray-500 hover:text-brand-primary hover:bg-white'}`}>{f}</button>
          ))}
        </div>
        
        <div className="flex bg-brand-bg p-1.5 rounded-2xl border border-gray-200">
            <button onClick={() => setViewMode('list')} className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 ${viewMode === 'list' ? 'bg-white shadow-md text-brand-primary' : 'text-gray-500 hover:text-brand-primary hover:bg-white'}`}>
                <FiList size={16} /> List
            </button>
            <button onClick={() => setViewMode('map')} className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 ${viewMode === 'map' ? 'bg-white shadow-md text-brand-primary' : 'text-gray-500 hover:text-brand-primary hover:bg-white'}`}>
                <FiMap size={16} /> Map
            </button>
            <button onClick={() => setViewMode('analytics')} className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 ${viewMode === 'analytics' ? 'bg-white shadow-md text-brand-primary' : 'text-gray-500 hover:text-brand-primary hover:bg-white'}`}>
                <FiPieChart size={16} /> Analytics
            </button>
        </div>

        <div className="flex gap-3 w-full lg:w-auto">
          <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-5 pr-5 py-3 bg-brand-bg border border-gray-200 rounded-2xl text-sm w-full focus:ring-2 focus:ring-brand-primary outline-none transition" />
          <button onClick={handleExport} className="flex items-center gap-2 px-5 py-3 bg-brand-success text-white rounded-2xl hover:bg-green-700 font-bold text-sm transition-all shadow-md active:scale-95"><FiDownload /> Excel</button>
        </div>
      </div>

      {/* VIEW CONTENT */}
      {viewMode === 'analytics' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 animate-fadeIn">
           {/* STATUS DONUT */}
           <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 flex flex-col hover:shadow-2xl transition-all">
              <h3 className="font-black text-brand-primary mb-2 flex items-center gap-2"><FiPieChart /> Fix Rate (Status)</h3>
              <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie data={[
                          { name: 'Open', value: validReports.filter(r => r.status === 'OPEN').length },
                          { name: 'Resolved', value: validReports.filter(r => r.status === 'RESOLVED').length }
                        ]} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={5} dataKey="value">
                           <Cell fill="#f97316" /> {/* brand-warning */}
                           <Cell fill="#16a34a" /> {/* brand-success */}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                     </PieChart>
                  </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-2">
                 <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-brand-warning"></div><span className="text-xs font-black text-gray-500 uppercase tracking-widest">Open</span></div>
                 <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-brand-success"></div><span className="text-xs font-black text-gray-500 uppercase tracking-widest">Resolved</span></div>
              </div>
           </div>

           {/* SEVERITY DISTRIBUTION */}
           <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 flex flex-col hover:shadow-2xl transition-all">
              <h3 className="font-black text-brand-primary mb-2">Severity Distribution</h3>
              <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={[
                        { name: 'Low (1-3)', count: validReports.filter(r => getSeverity(r) <= 3).length },
                        { name: 'Medium (4-7)', count: validReports.filter(r => getSeverity(r) > 3 && getSeverity(r) < 8).length },
                        { name: 'High (8-10)', count: validReports.filter(r => getSeverity(r) >= 8).length }
                     ]} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" tick={{fontSize: 12, fontWeight: 700, fill:'#64748b'}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fontSize: 12, fontWeight: 700, fill:'#64748b'}} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                        <Area type="monotone" dataKey="count" stroke="#dc2626" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
                     </AreaChart>
                  </ResponsiveContainer>
              </div>
           </div>

           {/* CITIZEN SATISFACTION */}
           <div className="bg-gradient-to-br from-brand-primary to-slate-900 rounded-3xl p-6 shadow-xl border border-gray-800 flex flex-col justify-center items-center text-center hover:shadow-2xl transition-all relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full pointer-events-none"></div>
               <h3 className="font-black text-white/80 mb-2 uppercase tracking-widest text-xs">Avg. Citizen Rating</h3>
               <div className="flex flex-col items-center gap-2">
                   {(() => {
                       const rated = validReports.filter(r => r.citizen_rating);
                       const avg = rated.length ? (rated.reduce((a,b) => a + b.citizen_rating, 0) / rated.length).toFixed(1) : 0;
                       return (
                           <>
                               <div className="text-6xl font-black text-white drop-shadow-lg">{avg || "-"}</div>
                               <div className="flex gap-1 mt-2">
                                   {[1,2,3,4,5].map(s => <FiStar key={s} className={`text-2xl ${s <= Math.round(Number(avg)) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} />)}
                               </div>
                               <p className="text-xs font-bold text-white/60 mt-2">{rated.length} Reviews</p>
                           </>
                       );
                   })()}
               </div>
           </div>

           {/* CATEGORIES BAR */}
           <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 flex flex-col hover:shadow-2xl transition-all lg:col-span-3">
              <h3 className="font-black text-brand-primary mb-4">Top Issue Categories</h3>
              <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={Object.entries(validReports.reduce((acc, r) => { const cat = r.category || r.type || 'Other'; acc[cat] = (acc[cat] || 0) + 1; return acc; }, {})).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count).slice(0, 7)} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" tick={{fontSize: 11, fill: '#64748b', fontWeight: 800}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fontSize: 12, fill: '#64748b', fontWeight: 800}} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                        <Bar dataKey="count" fill="#0f172a" radius={[8, 8, 4, 4]} barSize={48} />
                     </BarChart>
                  </ResponsiveContainer>
              </div>
           </div>
        </div>
      ) : viewMode === 'list' ? (
        // --- LIST VIEW ---
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden mt-6">
            {filteredReports.length === 0 ? <div className="text-center py-20 text-gray-400 font-bold">No reports found.</div> : (
            <div className="divide-y divide-gray-100">
                {filteredReports.map((report) => {
                const severity = getSeverity(report);
                return (
                    <div key={report.id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col lg:flex-row gap-6">
                        <div className="flex flex-col gap-2 flex-shrink-0 border border-gray-100 p-2 rounded-xl bg-white shadow-sm w-full lg:w-auto">
                            <div className="flex gap-2 h-full">
                                <div className="w-full lg:w-40 h-32 bg-gray-50 rounded-lg flex flex-col items-center justify-center text-gray-400 overflow-hidden relative group">
                                    <div className="absolute top-1 left-1 bg-black/60 text-white text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shadow-md z-10">Before</div>
                                    {(report.images?.before_url || report.imageUrl) ? (
                                      <>
                                        <img src={report.images?.before_url || report.imageUrl} alt={report.category || report.type} className="absolute inset-0 w-full h-full object-cover" />
                                        <a href={report.images?.before_url || report.imageUrl} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white font-bold transition duration-300 z-20">
                                          <FiExternalLink className="text-xl mb-1" /> View Full
                                        </a>
                                      </>
                                    ) : (
                                      <>
                                        {getReportIcon(report)}
                                        <p className="text-[10px] mt-2 font-medium uppercase tracking-wider text-center">{report.category}</p>
                                      </>
                                    )}
                                </div>

                                {report.images?.after_url && (
                                    <div className="w-full lg:w-40 h-32 bg-gray-50 rounded-lg flex flex-col items-center justify-center text-gray-400 overflow-hidden relative group">
                                        <div className="absolute top-1 right-1 bg-brand-success text-white text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shadow-md z-10">After</div>
                                        <img src={report.images.after_url} alt="After Repair" className="absolute inset-0 w-full h-full object-cover" />
                                        <a href={report.images.after_url} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white font-bold transition duration-300 z-20">
                                            <FiExternalLink className="text-xl mb-1" /> View Proof
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex-grow">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${getSeverityBadge(severity)}`}>Severity: {severity}/10</span>
                            <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${report.status === 'OPEN' || report.status === 'Reported' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-green-50 text-green-700 border-green-100'}`}>{report.status}</span>
                            <span className="text-xs font-mono font-black text-brand-primary tracking-widest bg-brand-bg px-2 py-0.5 rounded border border-brand-primary/10">ID: {report.issue_id || 'PENDING'}</span>
                            <span className="text-xs text-gray-400 font-medium flex items-center gap-1 sm:ml-auto"><FiCalendar /> {timeAgo(report.timestamp)}</span>
                            </div>
                            <h3 className="text-lg font-black text-gray-900 mb-1">{report.category || report.type || 'Unknown Category'}</h3>
                            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 text-sm text-gray-500 mb-4 min-w-0">
                                <div className="flex items-center gap-1 min-w-0"><FiMapPin className="text-red-400 shrink-0" /> <span className="truncate">{report.location?.address || 'Unknown Location'}</span></div>
                                <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 shrink-0">{formatCoords(report.location)}</span>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm mb-3">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Reporter Details</p>
                                    <p className="font-bold text-gray-800">{report.reporter_info?.name || report.userName || 'Citizen'} <span className="text-gray-500 font-medium ml-2">{report.reporter_info?.phone || report.userPhone || ''}</span></p>
                                </div>
                            </div>

                            {report.citizen_rating && (
                                <div className="bg-gradient-to-r from-brand-bg to-white p-3.5 rounded-xl border border-gray-200 flex flex-col gap-1.5 shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Citizen Rating</span>
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <FiStar key={star} className={`text-sm ${star <= report.citizen_rating ? 'fill-yellow-400 text-yellow-400 drop-shadow-sm' : 'text-gray-200'}`} />
                                            ))}
                                        </div>
                                    </div>
                                    {report.citizen_feedback && (
                                        <p className="text-sm italic text-gray-600 font-medium whitespace-break-spaces bg-white p-2.5 rounded-lg shadow-sm border border-gray-50 flex items-start gap-2">
                                            <span className="text-xl text-gray-300 font-serif leading-none">"</span>
                                            <span>{report.citizen_feedback}</span>
                                            <span className="text-xl text-gray-300 font-serif leading-none mt-auto">"</span>
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="flex lg:flex-col justify-end gap-3 lg:border-l lg:border-gray-100 lg:pl-6">
                            {report.status === 'Pending Verification' ? (
                                <>
                                    <button onClick={() => updateStatus(report.id, 'RESOLVED')} className="flex items-center justify-center gap-2 px-4 py-3 bg-brand-success text-white rounded-xl hover:bg-green-700 font-bold text-xs transition-all active:scale-95 shadow-md"><FiCheckCircle size={16} /> Approve Fix</button>
                                    <button onClick={() => updateStatus(report.id, 'In-Progress')} className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 font-bold text-xs transition-all active:scale-95 border border-red-100"><FiX size={16} /> Reject Fix</button>
                                </>
                            ) : (report.status === 'OPEN' || report.status === 'Reported' || report.status === 'In-Progress') ? (
                                <select 
                                    onChange={async (e) => {
                                        if (!e.target.value) return;
                                        try {
                                            await assignReportToContractor(report.id, e.target.value);
                                            toast.success("Job Assigned Successfully!");
                                            fetchReports(true);
                                        } catch(err) { toast.error("Failed to assign job"); }
                                    }}
                                    className="bg-brand-bg border border-gray-200 text-brand-primary text-xs font-bold rounded-xl px-4 py-3 outline-none hover:border-brand-primary transition-all cursor-pointer"
                                    defaultValue={report.assigned_to || ""}
                                >
                                    <option value="" disabled>Assign Contractor...</option>
                                    {contractors.map(c => <option key={c.id} value={c.id}>{c.name ? `${c.name} (${c.email})` : c.email}</option>)}
                                </select>
                            ) : report.status !== 'RESOLVED' && (
                                <button onClick={() => updateStatus(report.id, 'RESOLVED')} className="flex items-center justify-center gap-2 px-5 py-3 bg-brand-success/10 text-brand-success rounded-xl hover:bg-brand-success hover:text-white font-bold text-xs transition-all active:scale-95 shadow-sm"><FiCheckCircle size={16} /> Resolve</button>
                            )}
                            <button onClick={() => deleteReport(report.id)} className="flex items-center justify-center gap-2 px-5 py-3 border-2 border-brand-bg text-gray-500 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-100 font-bold text-xs transition-all active:scale-95"><FiTrash2 size={16} /> Delete</button>
                        </div>
                    </div>
                );
                })}
            </div>
            )}
        </div>
      ) : (
        // --- ⭐ NATIVE LEAFLET MAP VIEW (Fixes Google Billing) ⭐ ---
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden h-[600px] relative z-0 mt-6 group">
            <div className="absolute inset-0 border-[6px] border-white pointer-events-none z-10 rounded-3xl"></div>
            <MapContainer 
                center={[(defaultCenter?.lat || 22.3), (defaultCenter?.lng || 73.1)]} 
                zoom={12} 
                className="w-full h-full z-0"
                zoomControl={false}
            >
                <LayersControl position="topright">
                    <LayersControl.BaseLayer checked name="Satellite Hybrid">
                        <LayerGroup>
                            <TileLayer
                                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                attribution='Tiles &copy; Esri'
                            />
                            <TileLayer
                                url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                                attribution='Reference Labels &copy; Esri'
                            />
                        </LayerGroup>
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Street Layout">
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                    </LayersControl.BaseLayer>
                </LayersControl>
                
                {filteredReports.map((report) => {
                    const coords = getCoordinates(report);
                    if (coords) {
                        return (
                            <Marker 
                                key={report.id} 
                                position={[coords.lat, coords.lng]}
                                icon={getCustomMarkerIcon(report, getSeverity(report))}
                            >
                                <Popup className="civicfix-popup" closeButton={false}>
                                    <div className="p-2 min-w-[220px] font-sans">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest text-white shadow-sm ${getSeverity(report) >= 8 ? 'bg-red-500' : 'bg-orange-500'}`}>
                                                Sev: {getSeverity(report)}/10
                                            </span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${report.status === 'OPEN' ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'}`}>
                                                {report.status}
                                            </span>
                                        </div>
                                        
                                        <h3 className="font-black text-slate-800 text-sm mb-1">{report.category || report.type || 'Unknown Category'}</h3>
                                        <p className="text-xs text-slate-500 mb-3 line-clamp-2">{report.location?.address}</p>
                                        
                                        <button 
                                            onClick={() => window.open(`http://maps.google.com/maps?q=${coords.lat},${coords.lng}`, '_blank')}
                                            className="w-full text-xs bg-slate-50 text-brand-primary font-bold py-2 rounded shadow-sm hover:bg-slate-100 transition-all flex items-center justify-center gap-1"
                                        >
                                            <FiExternalLink /> Open GPS Vector
                                        </button>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    }
                    return null;
                })}
            </MapContainer>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
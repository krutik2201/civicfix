export const API_BASE_URL = "http://localhost:9090";
export const BACKEND_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL) || API_BASE_URL;

export const SEVERITY_COLORS = {
  high: "bg-red-100 text-red-800 border-red-300",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
  low: "bg-green-100 text-green-800 border-green-300"
};

export const STATUS_COLORS = {
  OPEN: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  RESOLVED: "bg-green-100 text-green-800",
  REJECTED: "bg-gray-100 text-gray-800"
};

export const ISSUE_TYPES = [
  "Water Supply", "Traffic Signal", "Swimming Pool", "Street Light", 
  "Stray Dog Sterilization and ARV", "Stray Cattle", "Storm Water Drainage Project", 
  "RRR Collection Van", "Road Project_NEW ABOVE 18 METER", "Road and Footpath", 
  "Regarding Vadodara Smart City", "QRT", "Public Toilet", "Public Health", 
  "Parks_And_Garden", "Open Defecation", "Monsoon Complaints", "Hospital And Dispensary", 
  "Gujarat Rural Urban Housing Scheme", "Gas Line", "Garbage And Cleanliness", 
  "ENCROACHMENT", "Emergency", "E Waste", "Drainage Project", "Drainage And Storm Drain", 
  "Door To Door Garbage Collection", "Dead Animals", "Crematorium Complain", 
  "City Bus Services", "Birth And Death", "Auditorium", "Atithi Gruh", 
  "Assessment_Tax_Rebate", "Arogyam", "Air Quality Mgt", "Suspicious/Fake", "None", "Other"
];
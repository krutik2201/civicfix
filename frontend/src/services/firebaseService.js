import { db } from '../firebase/config';
import { 
  collection, addDoc, getDocs, getDoc, 
  updateDoc, deleteDoc, doc, query, 
  where, orderBy, increment // ⭐ IMPORTED INCREMENT
} from 'firebase/firestore';

// User Management Functions
export const userService = {
  // Create new user
  async createUser(userData) {
    try {
      console.log('🔥 Attempting to create user in Firebase:', userData.email);
      
      const usersRef = collection(db, 'users');
      // We use setDoc in Register.jsx, but if using addDoc here, ensure ID handling matches
      const docRef = await addDoc(usersRef, {
        ...userData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active',
        reportsCount: 0,
        lastLogin: null
      });
      
      console.log('✅ User created with ID:', docRef.id);
      return { id: docRef.id, ...userData };
    } catch (error) {
      console.error('❌ Firebase Error creating user:', error);
      if (error.code === 'permission-denied') {
        throw new Error('Database permissions issue. Please check Firestore rules.');
      }
      throw error;
    }
  },

  // Get user by email
  async getUserByEmail(email) {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  },

  // Get all users
  async getAllUsers() {
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  },

  // Update user
  async updateUser(userId, updateData) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...updateData,
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Get user profile
  async getUserProfile(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return { id: userSnap.id, ...userSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  },

  // Get user statistics
  async getUserStats(userId) {
    try {
      const reportsRef = collection(db, 'reports');
      const q = query(reportsRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      
      return {
        totalReports: querySnapshot.size,
        activeReports: querySnapshot.docs.filter(doc => doc.data().status === 'OPEN').length,
        resolvedReports: querySnapshot.docs.filter(doc => doc.data().status === 'RESOLVED').length
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }
};

// Report Management Functions
export const reportService = {
  async createReport(reportData) {
    try {
      // 1. Create the Report
      const reportsRef = collection(db, 'reports');
      const docRef = await addDoc(reportsRef, {
        ...reportData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'OPEN'
      });
      console.log('✅ Report created with ID:', docRef.id);

      // 2. ⭐ ATOMICALLY INCREMENT USER REPORT COUNT ⭐
      // This ensures the count goes up by 1 in the database, regardless of what the frontend says.
      if (reportData.userId) {
        try {
          const userRef = doc(db, 'users', reportData.userId);
          await updateDoc(userRef, {
            reportsCount: increment(1), // Magic fix: Atomic +1
            lastReportDate: new Date().toISOString()
          });
          console.log('✅ User report count auto-incremented in DB');
        } catch (userError) {
          console.error('⚠️ Failed to increment user count:', userError);
          // Don't fail the whole report creation if just the counter fails
        }
      }

      return { id: docRef.id, ...reportData };
    } catch (error) {
      console.error('❌ Error creating report:', error);
      throw error;
    }
  },

  async getAllReports(filters = {}) {
    try {
      let reportsRef = collection(db, 'reports');
      
      let q = reportsRef;
      if (filters.status) {
        q = query(q, where("status", "==", filters.status));
      }
      if (filters.issueType) {
        q = query(q, where("issueType", "==", filters.issueType));
      }
      if (filters.userId) {
        q = query(q, where("userId", "==", filters.userId));
      }
      
      q = query(q, orderBy("createdAt", "desc"));
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting reports:', error);
      throw error;
    }
  },

  async getReportById(reportId) {
    try {
      const reportRef = doc(db, 'reports', reportId);
      const reportSnap = await getDoc(reportRef);
      
      if (reportSnap.exists()) {
        return { id: reportSnap.id, ...reportSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting report:', error);
      throw error;
    }
  },

  async updateReport(reportId, updateData) {
    try {
      const reportRef = doc(db, 'reports', reportId);
      await updateDoc(reportRef, {
        ...updateData,
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error updating report:', error);
      throw error;
    }
  },

  async deleteReport(reportId) {
    try {
      const reportRef = doc(db, 'reports', reportId);
      await deleteDoc(reportRef);
      return true;
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  },

  async getReportsByUser(userId) {
    try {
      const reportsRef = collection(db, 'reports');
      const q = query(reportsRef, 
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting user reports:', error);
      throw error;
    }
  },

  async getReportsByStatus(status) {
    try {
      const reportsRef = collection(db, 'reports');
      const q = query(reportsRef, 
        where("status", "==", status),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting reports by status:', error);
      throw error;
    }
  },

  async getStats() {
    try {
      const reportsRef = collection(db, 'reports');
      const querySnapshot = await getDocs(reportsRef);
      const reports = querySnapshot.docs.map(doc => doc.data());
      
      const stats = {
        total: reports.length,
        open: reports.filter(r => r.status === 'OPEN').length,
        inProgress: reports.filter(r => r.status === 'IN_PROGRESS').length,
        resolved: reports.filter(r => r.status === 'RESOLVED').length,
        highPriority: reports.filter(r => r.priority === 'HIGH').length,
        mediumPriority: reports.filter(r => r.priority === 'MEDIUM').length,
        lowPriority: reports.filter(r => r.priority === 'LOW').length,
        
        byType: reports.reduce((acc, report) => {
          const type = report.issueType || 'Unknown';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {})
      };
      
      return stats;
    } catch (error) {
      console.error('Error getting stats:', error);
      throw error;
    }
  }
};

export const dashboardService = {
  async getDashboardStats() {
    try {
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      const totalUsers = usersSnapshot.size;
      
      const reportsRef = collection(db, 'reports');
      const reportsSnapshot = await getDocs(reportsRef);
      const reports = reportsSnapshot.docs.map(doc => doc.data());
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayReports = reports.filter(report => {
        const reportDate = new Date(report.createdAt);
        return reportDate >= today;
      });
      
      const severityCounts = { high: 0, medium: 0, low: 0 };
      reports.forEach(report => {
        const score = report.severityScore || 0;
        if (score >= 7) severityCounts.high++;
        else if (score >= 4) severityCounts.medium++;
        else severityCounts.low++;
      });
      
      const totalSeverity = reports.reduce((sum, report) => sum + (report.severityScore || 0), 0);
      const avgSeverity = reports.length > 0 ? (totalSeverity / reports.length) : 0;
      
      return {
        totalUsers,
        totalReports: reports.length,
        todayReports: todayReports.length,
        reportsBySeverity: severityCounts,
        avgSeverityScore: parseFloat(avgSeverity.toFixed(1)),
        reportsByType: reports.reduce((acc, report) => {
          const type = report.issueType || 'Unknown';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
  }
};

export default {
  userService,
  reportService,
  dashboardService
};
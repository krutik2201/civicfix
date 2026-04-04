import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { currentUser, isAdmin } = useAuth();

  return (
    <div className="text-center">
      <div className="max-w-6xl mx-auto">
        {/* Welcome Message */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Welcome back, {currentUser?.email?.split('@')[0] || 'User'}!
          </h2>
          <p className="text-gray-600 text-lg mb-6">
            {isAdmin 
              ? 'Monitor city infrastructure and manage citizen reports' 
              : 'Help improve your city by reporting infrastructure issues'
            }
          </p>
          <div className={`inline-flex items-center px-4 py-2 rounded-full font-medium ${
            isAdmin 
              ? 'bg-purple-100 text-purple-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {isAdmin ? '🏛️ City Official Account' : '👤 Citizen Account'}
          </div>
        </div>

        {/* Role-specific Content */}
        {isAdmin ? (
          // ADMIN VIEW
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-purple-200">
              <div className="text-5xl mb-6">📊</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Analytics Dashboard</h3>
              <p className="text-gray-600 mb-6">
                View real-time statistics and reports from across the city
              </p>
              <Link 
                to="/admin" 
                className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:opacity-90"
              >
                Open Dashboard
              </Link>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-blue-200">
              <div className="text-5xl mb-6">🚨</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Priority Reports</h3>
              <p className="text-gray-600 mb-6">
                Review and assign high-priority infrastructure issues
              </p>
              <Link 
                to="/admin" 
                className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:opacity-90"
              >
                View Reports
              </Link>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-green-200">
              <div className="text-5xl mb-6">⚙️</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">System Settings</h3>
              <p className="text-gray-600 mb-6">
                Configure AI thresholds and notification settings
              </p>
              <button className="inline-block px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:opacity-90">
                Settings
              </button>
            </div>
          </div>
        ) : (
          // USER VIEW
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-blue-200">
              <div className="text-5xl mb-6">📸</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Report an Issue</h3>
              <p className="text-gray-600 mb-6">
                Take a photo of potholes, garbage, or other infrastructure problems
              </p>
              <Link 
                to="/report" 
                className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:opacity-90"
              >
                Report Now
              </Link>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-green-200">
              <div className="text-5xl mb-6">📋</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">My Reports</h3>
              <p className="text-gray-600 mb-6">
                Track the status of your submitted reports and see resolution progress
              </p>
              <Link 
                to="/profile" 
                className="inline-block px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:opacity-90"
              >
                View My Reports
              </Link>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="mt-12 bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Recent Activity</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-6 text-left text-sm font-medium text-gray-500">Date</th>
                  <th className="py-3 px-6 text-left text-sm font-medium text-gray-500">Activity</th>
                  <th className="py-3 px-6 text-left text-sm font-medium text-gray-500">Status</th>
                  <th className="py-3 px-6 text-left text-sm font-medium text-gray-500">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-4 px-6">Today</td>
                  <td className="py-4 px-6">
                    {isAdmin ? 'Reviewed 5 reports' : 'Submitted pothole report'}
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      Completed
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    {isAdmin ? 'Assigned to maintenance' : 'Under review'}
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6">Yesterday</td>
                  <td className="py-4 px-6">
                    {isAdmin ? 'Updated system settings' : 'Reported streetlight issue'}
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      In Progress
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    {isAdmin ? 'AI threshold adjusted' : 'Scheduled for repair'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
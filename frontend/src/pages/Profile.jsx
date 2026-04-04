import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FiUser, FiMail, FiShield, FiCalendar } from 'react-icons/fi';

const Profile = () => {
  const { currentUser, userRole, isAdmin } = useAuth();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
              <FiUser className="text-4xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">User Profile</h1>
              <p className="text-blue-100">Manage your account information</p>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* User Info */}
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FiUser /> Personal Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Email</label>
                    <div className="flex items-center gap-3">
                      <FiMail className="text-gray-400" />
                      <p className="text-gray-800 font-medium">{currentUser?.email}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">User ID</label>
                    <p className="text-gray-800 font-mono text-sm">
                      {currentUser?.uid?.substring(0, 12)}...
                    </p>
                  </div>
                </div>
              </div>

              {/* Role Info */}
              <div className={`p-6 rounded-xl ${
                isAdmin 
                  ? 'bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200' 
                  : 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200'
              }`}>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FiShield /> Account Role
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xl font-bold ${
                      isAdmin ? 'text-purple-700' : 'text-blue-700'
                    }`}>
                      {isAdmin ? 'City Official' : 'Citizen'}
                    </p>
                    <p className="text-gray-600 text-sm mt-1">
                      {isAdmin 
                        ? 'Full access to all reports and admin features' 
                        : 'Can report issues and view personal reports'
                      }
                    </p>
                  </div>
                  <div className={`px-4 py-2 rounded-full ${
                    isAdmin 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  } font-medium`}>
                    {userRole}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats & Actions */}
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FiCalendar /> Account Statistics
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="text-gray-600">Reports Submitted</span>
                    <span className="font-bold text-blue-600">24</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="text-gray-600">Issues Resolved</span>
                    <span className="font-bold text-green-600">18</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="text-gray-600">High Priority</span>
                    <span className="font-bold text-red-600">6</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    Change Password
                  </button>
                  <button className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                    Download My Reports
                  </button>
                  <button className="w-full py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Only Section */}
          {isAdmin && (
            <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
              <h3 className="text-xl font-bold text-purple-800 mb-4">🛡️ Admin Privileges</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg">
                  <p className="font-medium text-gray-800">Manage All Reports</p>
                  <p className="text-sm text-gray-600">View, edit, delete any report</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="font-medium text-gray-800">Access Dashboard</p>
                  <p className="text-sm text-gray-600">Full analytics and insights</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="font-medium text-gray-800">System Settings</p>
                  <p className="text-sm text-gray-600">Configure AI and notifications</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
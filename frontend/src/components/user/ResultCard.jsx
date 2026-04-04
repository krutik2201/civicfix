import React from 'react';
import { motion } from 'framer-motion';
import { FiAlertTriangle, FiCheckCircle, FiClock, FiMapPin } from 'react-icons/fi';
import { SEVERITY_COLORS } from '../../utils/constants';

const ResultCard = ({ result, location }) => {
  if (!result) return null;

  const { issue_detected, type, severity_score, danger_reason, recommended_action } = result;

  const getSeverityLevel = (score) => {
    if (score >= 7) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'Immediate Dispatch':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Schedule Repair':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Ignore':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const severityLevel = getSeverityLevel(severity_score);
  const severityColor = SEVERITY_COLORS[severityLevel];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden"
    >
      {/* Header */}
      <div className={`p-6 ${issue_detected ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-green-500 to-emerald-500'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              {issue_detected ? (
                <FiAlertTriangle className="text-2xl text-white" />
              ) : (
                <FiCheckCircle className="text-2xl text-white" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                {issue_detected ? 'Issue Detected!' : 'No Issues Found'}
              </h3>
              <p className="text-white/80 text-sm">
                {issue_detected ? 'Action Required' : 'Area is safe'}
              </p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-full ${severityColor} font-bold`}>
            Score: {severity_score}/10
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Issue Type */}
        {issue_detected && (
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm text-gray-500">Issue Type</p>
              <p className="text-lg font-semibold text-gray-800">{type}</p>
            </div>
            <div className="text-3xl">
              {type === 'Pothole' && '🕳️'}
              {type === 'Garbage' && '🗑️'}
              {type === 'Streetlight' && '💡'}
              {type === 'Waterlogging' && '🌊'}
              {type === 'Other' && '⚠️'}
            </div>
          </div>
        )}

        {/* Danger Reason */}
        {danger_reason && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
            <div className="flex items-start gap-3">
              <FiAlertTriangle className="text-orange-500 text-xl mt-1" />
              <div>
                <p className="font-medium text-orange-800 mb-1">Risk Assessment</p>
                <p className="text-orange-700">{danger_reason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Recommended Action */}
        {recommended_action && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-start gap-3">
              <FiClock className="text-blue-500 text-xl mt-1" />
              <div>
                <p className="font-medium text-blue-800 mb-1">Recommended Action</p>
                <div className={`inline-block px-3 py-1 rounded-full ${getActionColor(recommended_action)} font-medium`}>
                  {recommended_action}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Location */}
        {location && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-start gap-3">
              <FiMapPin className="text-green-500 text-xl mt-1" />
              <div>
                <p className="font-medium text-green-800 mb-1">Report Location</p>
                <p className="text-green-700 text-sm">
                  Latitude: {location.lat.toFixed(6)}
                </p>
                <p className="text-green-700 text-sm">
                  Longitude: {location.lng.toFixed(6)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Status Message */}
        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-gray-600 text-sm">
            {issue_detected 
              ? 'This report has been logged and will be reviewed by city officials.'
              : 'No immediate action required. Thank you for your vigilance!'
            }
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 p-4 border-t border-gray-200">
        <button
          onClick={() => window.location.reload()}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:opacity-90"
        >
          Report Another Issue
        </button>
      </div>
    </motion.div>
  );
};

export default ResultCard;
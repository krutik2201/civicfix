import React, { useState } from 'react';
import { FiEye, FiEdit, FiTrash2, FiFilter } from 'react-icons/fi';
import StatusBadge from './StatusBadge';
import { SEVERITY_COLORS } from '../../utils/constants';

const ReportTable = ({ reports, onStatusUpdate, filters, onFilterChange }) => {
  const [expandedRow, setExpandedRow] = useState(null);
  const [statusFilter, setStatusFilter] = useState(filters?.status || '');
  const [typeFilter, setTypeFilter] = useState(filters?.type || '');

  const handleStatusChange = async (reportId, newStatus) => {
    if (onStatusUpdate) {
      await onStatusUpdate(reportId, newStatus);
    }
  };

  const handleFilterApply = () => {
    if (onFilterChange) {
      onFilterChange({
        status: statusFilter || undefined,
        type: typeFilter || undefined
      });
    }
  };

  const handleResetFilters = () => {
    setStatusFilter('');
    setTypeFilter('');
    if (onFilterChange) {
      onFilterChange({});
    }
  };

  const getSeverityLevel = (score) => {
    if (score >= 7) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Table Header with Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Reports</h2>
            <p className="text-gray-600">Total: {reports.length} reports</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="Pothole">Pothole</option>
              <option value="Garbage">Garbage</option>
              <option value="Streetlight">Streetlight</option>
              <option value="Waterlogging">Waterlogging</option>
              <option value="Other">Other</option>
            </select>

            <button
              onClick={handleFilterApply}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <FiFilter />
              Apply
            </button>

            <button
              onClick={handleResetFilters}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Issue
              </th>
              <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Severity
              </th>
              <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reported
              </th>
              <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {reports.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-gray-500">
                  No reports found. Try adjusting your filters.
                </td>
              </tr>
            ) : (
              reports.map((report) => (
                <React.Fragment key={report.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">
                            {report.type === 'Pothole' && '🕳️'}
                            {report.type === 'Garbage' && '🗑️'}
                            {report.type === 'Streetlight' && '💡'}
                            {report.type === 'Waterlogging' && '🌊'}
                            {report.type === 'Other' && '⚠️'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{report.type}</p>
                            <p className="text-sm text-gray-500 truncate max-w-xs">
                              {report.danger_reason}
                            </p>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                        ${SEVERITY_COLORS[getSeverityLevel(report.severity_score)]}`}>
                        {report.severity_score}/10
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={report.status} />
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-500">
                      {formatDate(report.timestamp)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setExpandedRow(expandedRow === report.id ? null : report.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="View Details"
                        >
                          <FiEye />
                        </button>
                        <select
                          value={report.status}
                          onChange={(e) => handleStatusChange(report.id, e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="OPEN">Open</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="RESOLVED">Resolved</option>
                          <option value="REJECTED">Rejected</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Expanded Row */}
                  {expandedRow === report.id && (
                    <tr>
                      <td colSpan="5" className="bg-blue-50 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold text-gray-800 mb-2">Issue Details</h4>
                            <p className="text-gray-600">{report.danger_reason}</p>
                            <div className="mt-4">
                              <span className="font-medium text-gray-700">Recommended Action:</span>
                              <span className="ml-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                                {report.recommended_action}
                              </span>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800 mb-2">Metadata</h4>
                            <div className="space-y-2">
                              <p className="text-sm">
                                <span className="font-medium">Report ID:</span> {report.id}
                              </p>
                              <p className="text-sm">
                                <span className="font-medium">AI Used:</span> {report.ai_used ? 'Yes' : 'No'}
                              </p>
                              <p className="text-sm">
                                <span className="font-medium">Issue Detected:</span> {report.issue_detected ? 'Yes' : 'No'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportTable;
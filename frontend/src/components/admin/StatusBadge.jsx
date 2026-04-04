import React from 'react';
import { STATUS_COLORS } from '../../utils/constants';

const StatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'OPEN':
        return {
          color: STATUS_COLORS.OPEN,
          text: 'Open'
        };
      case 'IN_PROGRESS':
        return {
          color: STATUS_COLORS.IN_PROGRESS,
          text: 'In Progress'
        };
      case 'RESOLVED':
        return {
          color: STATUS_COLORS.RESOLVED,
          text: 'Resolved'
        };
      case 'REJECTED':
        return {
          color: STATUS_COLORS.REJECTED,
          text: 'Rejected'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          text: status || 'Unknown'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
      {config.text}
    </span>
  );
};

export default StatusBadge;
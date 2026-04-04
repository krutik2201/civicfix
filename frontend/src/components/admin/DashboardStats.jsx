import React from 'react';
import { FiAlertTriangle, FiTrendingUp, FiClock, FiCheckCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';

const DashboardStats = ({ stats }) => {
  const statCards = [
    {
      title: "Total Reports",
      value: stats?.total_reports || 0,
      icon: <FiAlertTriangle className="text-2xl" />,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700"
    },
    {
      title: "Today's Reports",
      value: stats?.today_reports || 0,
      icon: <FiTrendingUp className="text-2xl" />,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-700"
    },
    {
      title: "High Priority",
      value: stats?.reports_by_severity?.high || 0,
      icon: <FiAlertTriangle className="text-2xl" />,
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-50",
      textColor: "text-red-700"
    },
    {
      title: "Avg. Severity",
      value: stats?.avg_severity_score?.toFixed(1) || "0.0",
      icon: <FiClock className="text-2xl" />,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bgColor} ${stat.textColor}`}>
                {stat.icon}
              </div>
              <div className={`text-lg font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.value}
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {stat.title}
            </h3>
            <p className="text-sm text-gray-500">
              {stat.title === "High Priority" 
                ? "Need immediate attention"
                : `Updated in real-time`
              }
            </p>
          </div>
          <div className={`h-1 bg-gradient-to-r ${stat.color}`} />
        </motion.div>
      ))}
    </div>
  );
};

export default DashboardStats;
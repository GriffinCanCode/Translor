import React from 'react';

const StatsCard = ({ title, value, icon, color = 'primary' }) => {
  const colorClasses = {
    primary: {
      bg: 'bg-primary-50',
      icon: 'text-primary-600',
      text: 'text-primary-700'
    },
    secondary: {
      bg: 'bg-secondary-50',
      icon: 'text-secondary-600',
      text: 'text-secondary-700'
    },
    amber: {
      bg: 'bg-amber-50',
      icon: 'text-amber-600',
      text: 'text-amber-700'
    },
    emerald: {
      bg: 'bg-emerald-50',
      icon: 'text-emerald-600',
      text: 'text-emerald-700'
    },
    rose: {
      bg: 'bg-rose-50',
      icon: 'text-rose-600',
      text: 'text-rose-700'
    }
  };

  const colors = colorClasses[color] || colorClasses.primary;

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${colors.bg} rounded-md p-3`}>
            <div className={colors.icon}>
              {icon}
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-medium text-gray-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCard; 
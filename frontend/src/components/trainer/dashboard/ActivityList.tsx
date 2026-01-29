import React from 'react';
import { Card } from '@/components/ui/Card';

export interface ActivityItem {
  id: string;
  initials: string;
  name: string;
  text: string;
  timeAgo: string;
  colorClass: string;
}

interface ActivityListProps {
  activities: ActivityItem[];
  isLoading?: boolean;
}

export const ActivityList: React.FC<ActivityListProps> = ({ activities, isLoading = false }) => {
  if (isLoading) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Последняя активность</h2>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-gray-200" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Последняя активность</h2>
        <p className="text-gray-500 text-center py-8">Нет данных</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Последняя активность</h2>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3">
            <div
              className={`w-12 h-12 rounded-full ${activity.colorClass} flex items-center justify-center text-white font-semibold flex-shrink-0`}
            >
              {activity.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">
                <span className="font-semibold">{activity.name}</span> {activity.text}
              </p>
              <p className="text-xs text-gray-500 mt-1">{activity.timeAgo}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

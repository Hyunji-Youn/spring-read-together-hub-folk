import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserStatistics } from '@/services/user.service';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface StatisticChartsProps {
  statistics: UserStatistics | undefined;
  isLoading: boolean;
  isError: boolean;
}

const ROLE_COLORS = ['#2563eb', '#10b981', '#f97316', '#ef4444'];
const STATUS_COLORS = {
  approved: '#10b981',
  pending_approval: '#f97316',
  rejected: '#ef4444'
};

export const StatisticCharts: React.FC<StatisticChartsProps> = ({
  statistics,
  isLoading,
  isError
}) => {
  // Transform role distribution data for chart
  const roleData = React.useMemo(() => {
    if (!statistics?.roleDistribution) return [];
    
    return Object.entries(statistics.roleDistribution).map(([name, value]) => ({
      name,
      value
    }));
  }, [statistics]);
  
  // Transform status distribution data for chart
  const statusData = React.useMemo(() => {
    if (!statistics?.applicationStatusDistribution) return [];
    
    return Object.entries(statistics.applicationStatusDistribution).map(([status, count]) => ({
      status: status === 'pending_approval' ? 'Pending' : 
              status === 'approved' ? 'Approved' : 
              status === 'rejected' ? 'Rejected' : status,
      count,
      color: STATUS_COLORS[status] || '#6b7280'
    }));
  }, [statistics]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Role Distribution Chart */}
      <Card className="bg-white border border-bookish-maroon/10 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-bookish-maroon">User Distribution by Role</CardTitle>
          <CardDescription>Number of users per role type</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <Skeleton className="h-64 w-64 rounded-full" />
            </div>
          ) : isError ? (
            <div className="w-full h-full flex items-center justify-center text-red-500">
              An error occurred while loading data.
            </div>
          ) : roleData.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-neutral-500">
              No data to display.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {roleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={ROLE_COLORS[index % ROLE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} users`, 'User Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Application Status Chart */}
      <Card className="bg-white border border-bookish-maroon/10 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-bookish-maroon">Users by Approval Status</CardTitle>
          <CardDescription>User distribution by approval status</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <Skeleton className="h-64 w-full" />
            </div>
          ) : isError ? (
            <div className="w-full h-full flex items-center justify-center text-red-500">
              An error occurred while loading data.
            </div>
          ) : statusData.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-neutral-500">
              No data to display.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={statusData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <XAxis dataKey="status" />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(value) => [`${value} users`, 'User Count']} />
                <Legend />
                <Bar dataKey="count" name="User Count">
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StatisticCharts; 
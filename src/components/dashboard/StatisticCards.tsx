import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserStatistics } from '@/services/user.service';
import { Users, UserCheck, UserX, Calendar } from 'lucide-react';

interface StatisticCardProps {
  statistics: UserStatistics | undefined;
  isLoading: boolean;
  isError: boolean;
}

export const StatisticCards: React.FC<StatisticCardProps> = ({ 
  statistics, 
  isLoading, 
  isError 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {/* Total Users Card */}
      <Card className="bg-white border border-bookish-maroon/10 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-bookish-maroon">Total Users</CardTitle>
          <Users className="h-4 w-4 text-bookish-maroon" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : isError ? (
            <div className="text-2xl font-bold text-red-500">Error</div>
          ) : (
            <div className="text-2xl font-bold">{statistics?.totalUsers || 0}</div>
          )}
          <CardDescription className="text-xs mt-1">Total number of users in the system</CardDescription>
        </CardContent>
      </Card>

      {/* Approved Users Card */}
      <Card className="bg-white border border-bookish-maroon/10 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-green-600">Approved Users</CardTitle>
          <UserCheck className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : isError ? (
            <div className="text-2xl font-bold text-red-500">Error</div>
          ) : (
            <div className="text-2xl font-bold text-green-600">
              {statistics?.applicationStatusDistribution?.approved || 0}
            </div>
          )}
          <CardDescription className="text-xs mt-1">Number of active approved accounts</CardDescription>
        </CardContent>
      </Card>

      {/* Pending Users Card */}
      <Card className="bg-white border border-bookish-maroon/10 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-amber-600">Pending Users</CardTitle>
          <UserX className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : isError ? (
            <div className="text-2xl font-bold text-red-500">Error</div>
          ) : (
            <div className="text-2xl font-bold text-amber-600">
              {statistics?.applicationStatusDistribution?.pending_approval || 0}
            </div>
          )}
          <CardDescription className="text-xs mt-1">Number of accounts pending approval</CardDescription>
        </CardContent>
      </Card>

      {/* Recent Registration Card */}
      <Card className="bg-white border border-bookish-maroon/10 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-blue-600">New Registrations</CardTitle>
          <Calendar className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : isError ? (
            <div className="text-2xl font-bold text-red-500">Error</div>
          ) : (
            <div className="flex flex-row space-x-4">
              <div>
                <div className="text-xl font-bold text-blue-600">
                  {statistics?.recentRegistrations?.today || 0}
                </div>
                <span className="text-xs text-neutral-500">Today</span>
              </div>
              <div>
                <div className="text-xl font-bold text-blue-400">
                  {statistics?.recentRegistrations?.thisWeek || 0}
                </div>
                <span className="text-xs text-neutral-500">This Week</span>
              </div>
              <div>
                <div className="text-xl font-bold text-blue-300">
                  {statistics?.recentRegistrations?.thisMonth || 0}
                </div>
                <span className="text-xs text-neutral-500">This Month</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StatisticCards; 
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  useAdminUsers, 
  useUserStatistics
} from '@/hooks/use-admin-users';
import { 
  StatisticCards, 
  StatisticCharts,
  UserTable
} from '@/components/dashboard';
import { useAuth, UserRole } from '@/contexts/auth-context';

const Admin = () => {
  const { user } = useAuth();
  
  // 사용자 역할 확인
  const userRoleName = typeof user?.role === 'string' ? user.role : user?.role?.role_name;
  const isLibrarian = userRoleName === UserRole.Librarian;
  
  // 사서의 경우 기본 탭을 'users'로 설정, 관리자는 'dashboard'
  const [activeTab, setActiveTab] = useState<string>(isLibrarian ? 'users' : 'dashboard');
  const [userStatusTab, setUserStatusTab] = useState<string>('pending_approval');
  
  // Fetch user statistics for dashboard (관리자만)
  const { 
    data: statistics, 
    isLoading: isLoadingStats, 
    error: statsError 
  } = useUserStatistics();

  // Fetch filtered users for admin review
  const { 
    users, 
    isLoading, 
    error, 
    refetch,
    approveUser, 
    rejectUser, 
    isApproving, 
    isRejecting 
  } = useAdminUsers(userStatusTab === 'all' ? undefined : userStatusTab);

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <Card className="border border-bookish-maroon/20">
          <CardHeader>
            <CardTitle className="text-2xl font-serif text-bookish-maroon">
              {isLibrarian ? 'User Management' : 'Admin Dashboard'}
            </CardTitle>
            <CardDescription>
              {isLibrarian ? 'User Management and Approval' : 'User Management and System Statistics'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                {!isLibrarian && <TabsTrigger value="dashboard">Dashboard</TabsTrigger>}
                <TabsTrigger value="users">User Management</TabsTrigger>
                {!isLibrarian && <TabsTrigger value="logs">Activity Logs</TabsTrigger>}
              </TabsList>
              
              {/* Dashboard Tab - 관리자만 */}
              {!isLibrarian && (
                <TabsContent value="dashboard">
                  <div className="space-y-6">
                    {/* Statistics Cards */}
                    <StatisticCards 
                      statistics={statistics} 
                      isLoading={isLoadingStats} 
                      isError={!!statsError}
                    />
                    
                    {/* Statistics Charts */}
                    <StatisticCharts 
                      statistics={statistics} 
                      isLoading={isLoadingStats} 
                      isError={!!statsError}
                    />
                  </div>
                </TabsContent>
              )}
              
              {/* User Management Tab - 모든 관리자 권한 사용자 */}
              <TabsContent value="users">
                <Tabs defaultValue={userStatusTab} onValueChange={setUserStatusTab}>
                  <TabsList className="mb-6">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="pending_approval">Pending Approval</TabsTrigger>
                    <TabsTrigger value="approved">Approved</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected</TabsTrigger>
                  </TabsList>
                  
                  <UserTable 
                    users={users}
                    isLoading={isLoading}
                    isError={!!error}
                    onApprove={approveUser}
                    onReject={rejectUser}
                    isApproving={isApproving}
                    isRejecting={isRejecting}
                    onRefresh={refetch}
                  />
                </Tabs>
              </TabsContent>
              
              {/* Activity Logs Tab - 관리자만 */}
              {!isLibrarian && (
                <TabsContent value="logs">
                  <Card className="border border-bookish-maroon/20">
                    <CardHeader>
                      <CardTitle>Activity Logs</CardTitle>
                      <CardDescription>System Activity and User Behavior Logs</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="py-8 text-center text-neutral-500">
                        Activity logs feature is currently under development.
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Admin;

import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { UserCheck, UserX, Loader2, RefreshCw } from 'lucide-react';

import Layout from '@/components/Layout';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminUsers } from '@/hooks/use-admin-users';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from 'sonner';

// Map backend status to frontend display status
const mapApplicationStatus = (status: string) => {
  switch(status) {
    case 'pending_approval': return 'pending';
    case 'approved': return 'approved';
    case 'rejected': return 'rejected';
    default: return status;
  }
};

const Admin = () => {
  const [selectedTab, setSelectedTab] = useState<string>('pending_approval');
  const { 
    users, 
    isLoading, 
    error, 
    isRateLimitError,
    retryAfter,
    refetch,
    approveUser, 
    rejectUser, 
    isApproving, 
    isRejecting 
  } = useAdminUsers(selectedTab === 'all' ? undefined : selectedTab);

  // State for countdown timer
  const [countdown, setCountdown] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Set up countdown timer when rate limit error occurs
  useEffect(() => {
    if (isRateLimitError && retryAfter) {
      // Initialize countdown
      setCountdown(Math.ceil(retryAfter / 1000));
      
      // Clear any existing timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Set up the countdown
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            // Clear timer when countdown reaches zero
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    // Cleanup timer on component unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRateLimitError, retryAfter]);

  const handleApprove = (userId: number, requestedLibrarian: boolean) => {
    approveUser({
      userId, 
      role: requestedLibrarian ? 'Librarian' : 'Member'
    });
  };

  const handleReject = (userId: number) => {
    rejectUser(userId);
  };

  const handleRetry = () => {
    if (countdown > 0) {
      toast.error('Please wait before retrying', {
        description: `You can retry in ${countdown} seconds`
      });
      return;
    }
    refetch();
  };

  const getStatusBadge = (status: string) => {
    const displayStatus = mapApplicationStatus(status);
    switch(displayStatus) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy-MM-dd');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <Card className="border border-bookish-maroon/20">
          <CardHeader>
            <CardTitle className="text-2xl font-serif text-bookish-maroon">Admin Dashboard</CardTitle>
            <CardDescription>
              Manage user registration requests and member approvals
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="pending_approval" onValueChange={setSelectedTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending_approval">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>
              
              <TabsContent value={selectedTab}>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-bookish-maroon" />
                  </div>
                ) : isRateLimitError ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="text-red-600 mb-4">
                      Rate limit exceeded. Please try again later.
                    </div>
                    <div className="text-sm text-gray-500 mb-4">
                      {countdown > 0 
                        ? `You can retry in ${countdown} seconds` 
                        : 'You can retry now'}
                    </div>
                    <Button 
                      onClick={handleRetry} 
                      variant="outline" 
                      size="sm" 
                      disabled={countdown > 0}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" /> Retry Request
                    </Button>
                  </div>
                ) : error ? (
                  <div className="text-center py-8 text-red-600">
                    Error loading users. Please try again later.
                  </div>
                ) : (
                  <Table>
                    <TableCaption>User registration requests</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Registered</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users && users.length > 0 ? (
                        users.map(user => (
                          <TableRow key={user.user_id}>
                            <TableCell className="font-medium">{user.username}</TableCell>
                            <TableCell>{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{formatDate(user.created_at)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {user.role.role_name}
                                {user.application_status === 'pending_approval' && user.requested_librarian_role_on_application && (
                                  <span className="ml-1 text-xs">(Requested: Librarian)</span>
                                )}
                              </Badge>
                            </TableCell>
                            <TableCell>{getStatusBadge(user.application_status)}</TableCell>
                            <TableCell className="text-right">
                              {user.application_status === 'pending_approval' && (
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    onClick={() => handleApprove(user.user_id, user.requested_librarian_role_on_application)} 
                                    variant="outline" 
                                    size="sm"
                                    className="text-green-600 border-green-600 hover:bg-green-50"
                                    disabled={isApproving || isRejecting}
                                  >
                                    {isApproving ? (
                                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                    ) : (
                                      <UserCheck className="mr-1 h-4 w-4" />
                                    )}
                                    Approve
                                  </Button>
                                  <Button 
                                    onClick={() => handleReject(user.user_id)} 
                                    variant="outline" 
                                    size="sm"
                                    className="text-red-600 border-red-600 hover:bg-red-50"
                                    disabled={isApproving || isRejecting}
                                  >
                                    {isRejecting ? (
                                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                    ) : (
                                      <UserX className="mr-1 h-4 w-4" />
                                    )}
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No users found matching the selected filter.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Admin;

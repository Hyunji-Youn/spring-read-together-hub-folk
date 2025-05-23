import React, { useState } from 'react';
import { format } from 'date-fns';
import { UserCheck, UserX, ChevronDown, Search, Filter, RotateCw } from 'lucide-react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserProfile } from '@/services/user.service';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface UserTableProps {
  users: UserProfile[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onApprove: (arg: { userId: number; role: 'Member' | 'Librarian' }) => void;
  onReject: (userId: number) => void;
  isApproving: boolean;
  isRejecting: boolean;
  onRefresh: () => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  isLoading,
  isError,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  const [selectedUser, setSelectedUser] = useState<{ id: number, name: string, requested: boolean } | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState<boolean>(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<'Member' | 'Librarian' | null>(null);

  // Filter users based on search term and filters
  const filteredUsers = React.useMemo(() => {
    if (!users) return [];
    
    return users.filter(user => {
      // Search term filter
      const matchesSearch = 
        searchTerm === '' || 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const matchesStatus = 
        statusFilter === 'all' || 
        user.application_status === statusFilter;
      
      // Role filter
      const matchesRole = 
        roleFilter === 'all' || 
        user.role.role_name === roleFilter;
      
      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [users, searchTerm, statusFilter, roleFilter]);

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy-MM-dd');
    } catch (e) {
      return dateString;
    }
  };

  // Status badge
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending_approval':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending Approval</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Role badge
  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'Admin':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Admin</Badge>;
      case 'Librarian':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Librarian</Badge>;
      case 'Member':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Member</Badge>;
      case 'PotentialMember':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Potential Member</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  // Handle approve click
  const handleApproveClick = (userId: number, name: string, requestedLibrarian: boolean) => {
    setSelectedUser({ id: userId, name, requested: requestedLibrarian });
    setSelectedRole(requestedLibrarian ? 'Librarian' : 'Member');
    setApproveDialogOpen(true);
  };

  // Handle reject click
  const handleRejectClick = (userId: number, name: string) => {
    setSelectedUser({ id: userId, name, requested: false });
    setRejectDialogOpen(true);
  };

  // Handle approve confirm
  const handleApproveConfirm = () => {
    if (selectedUser && selectedRole) {
      onApprove({
        userId: selectedUser.id, 
        role: selectedRole
      });
      setApproveDialogOpen(false);
      setSelectedUser(null);
    }
  };

  // Handle reject confirm
  const handleRejectConfirm = () => {
    if (selectedUser) {
      onReject(selectedUser.id);
      setRejectDialogOpen(false);
      setSelectedUser(null);
    }
  };

  return (
    <Card className="border border-bookish-maroon/20">
      <CardContent className="p-6">
        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row justify-between mb-4 gap-2">
          <div className="flex-1 flex gap-2 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-2 top-3 h-4 w-4 text-neutral-500" />
              <Input
                placeholder="Search by name, username, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-neutral-500" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending_approval">Pending Approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Librarian">Librarian</SelectItem>
                  <SelectItem value="Member">Member</SelectItem>
                  <SelectItem value="PotentialMember">Potential Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button variant="outline" size="icon" onClick={onRefresh} title="Refresh">
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Users Table */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : isError ? (
          <div className="py-8 text-center text-red-500">
            An error occurred while loading user data.
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-8 text-center text-neutral-500">
            {users?.length === 0 ? 'No registered users.' : 'No users matching your search criteria.'}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-neutral-500">@{user.username}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role.role_name)}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getStatusBadge(user.application_status)}</TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    <TableCell className="text-right">
                      {user.application_status === 'pending_approval' && (
                        <div className="flex justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                            onClick={() => handleApproveClick(
                              user.user_id, 
                              user.name,
                              user.requested_librarian_role_on_application
                            )}
                            disabled={isApproving || isRejecting}
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                            onClick={() => handleRejectClick(user.user_id, user.name)}
                            disabled={isApproving || isRejecting}
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      
      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve User</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve {selectedUser?.name}'s account?
              {selectedUser?.requested && ' This user requested a Librarian role.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <label className="text-sm font-medium">Assign Role:</label>
              <Select 
                value={selectedRole || ''} 
                onValueChange={(value) => setSelectedRole(value as 'Member' | 'Librarian')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Member">Member</SelectItem>
                  <SelectItem value="Librarian">Librarian</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleApproveConfirm} 
              disabled={!selectedRole || isApproving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isApproving ? 'Processing...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Reject Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm User Rejection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject {selectedUser?.name}'s account application? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectConfirm}
              disabled={isRejecting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isRejecting ? 'Processing...' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default UserTable; 
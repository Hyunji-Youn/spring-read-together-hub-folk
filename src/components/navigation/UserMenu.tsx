import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  LogOut, 
  Settings, 
  BookUser,
  LayoutDashboard
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth, UserRole } from '@/contexts/auth-context';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface UserMenuProps {
  setIsLoggedIn?: React.Dispatch<React.SetStateAction<boolean>>;
}

const UserMenu: React.FC<UserMenuProps> = ({ setIsLoggedIn }) => {
  const navigate = useNavigate();
  const { user, logout: authLogout, isAuthenticated } = useAuth();

  // 로그인하지 않은 경우 렌더링하지 않음
  if (!isAuthenticated || !user) {
    return null;
  }

  // 관리자 권한 체크 (Admin 또는 Librarian) - role이 문자열이거나 객체일 수 있음
  const userRoleName = typeof user?.role === 'string' ? user.role : user?.role?.role_name;
  const hasAdminAccess = userRoleName === UserRole.Admin || userRoleName === UserRole.Librarian;

  // 아바타 표시 텍스트 결정 - 역할 기반 및 영어 이니셜
  const getAvatarText = () => {
    switch (userRoleName) {
      case UserRole.Admin:
        return 'AD';
      case UserRole.Librarian:
        return 'LB';
      default:
        // 일반 사용자의 경우 username의 첫 2글자 사용 (영어 이니셜 가정)
        const username = user.username || 'Reader';
        return username.slice(0, 2).toUpperCase();
    }
  };

  const handleLogout = async () => {
    try {
      // Call the logout API service
      await authLogout();
      
      // Update login state if provided
      if (setIsLoggedIn) {
        setIsLoggedIn(false);
      }
      
      // Show toast message
      toast.success("Logged out successfully");
      
      // Navigate to home page
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error("Error occurred during logout");
    }
  };

  const displayName = user.name || user.username || 'Reader';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full text-bookish-maroon hover:bg-bookish-maroon/10 focus:ring-bookish-maroon"
        >
          <Avatar className="h-8 w-8 border border-bookish-maroon/30">
            <AvatarFallback className="bg-bookish-light text-bookish-maroon">
              {getAvatarText()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel className="font-serif text-bookish-maroon">
          My Account
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="cursor-pointer" asChild>
          <Link to="/profile" className="flex w-full items-center">
            <User className="mr-2 h-4 w-4 text-bookish-maroon" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem className="cursor-pointer" asChild>
          <Link to="/mybookclub" className="flex w-full items-center">
            <BookUser className="mr-2 h-4 w-4 text-bookish-maroon" />
            <span>My Book Club</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem className="cursor-pointer" asChild>
          <Link to="/settings" className="flex w-full items-center">
            <Settings className="mr-2 h-4 w-4 text-bookish-maroon" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        
        {hasAdminAccess && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" asChild>
              <Link to="/admin" className="flex w-full items-center">
                <LayoutDashboard className="mr-2 h-4 w-4 text-bookish-maroon" />
                <span>Admin Dashboard</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          className="cursor-pointer text-bookish-maroon hover:text-bookish-maroon/90"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu; 
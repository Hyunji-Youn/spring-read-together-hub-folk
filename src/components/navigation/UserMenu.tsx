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
import { logout } from '@/services/auth.service';
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
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  username?: string;
  role?: string;
}

const UserMenu: React.FC<UserMenuProps> = ({ 
  setIsLoggedIn, 
  username = 'Reader', 
  role = 'Member' 
}) => {
  const navigate = useNavigate();
  
  const isAdmin = role === 'Admin' || role === 'Librarian';

  const handleLogout = async () => {
    try {
      // Call the logout API service
      await logout();
      
      // Update login state
      setIsLoggedIn(false);
      
      // Show toast message
      toast.success("Logged out successfully");
      
      // Navigate to home page
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error("Error occurred during logout");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full text-bookish-maroon hover:bg-bookish-maroon/10 focus:ring-bookish-maroon"
        >
          <Avatar className="h-8 w-8 border border-bookish-maroon/30">
            <AvatarFallback className="bg-bookish-light text-bookish-maroon">
              {username.slice(0, 2).toUpperCase()}
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
        
        {isAdmin && (
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
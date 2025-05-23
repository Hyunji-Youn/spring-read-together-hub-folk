import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { User } from '@/services/auth.service';
import { useAuth } from '@/contexts/auth-context';
import UserMenu from './UserMenu';

interface AuthButtonsProps {
  isMobile: boolean;
  isLoggedIn: boolean;
  setIsLoggedIn?: React.Dispatch<React.SetStateAction<boolean>>;
  currentUser?: User | null;
}

const AuthButtons: React.FC<AuthButtonsProps> = ({ 
  isMobile, 
  isLoggedIn, 
  setIsLoggedIn, 
  currentUser 
}) => {
  const navigate = useNavigate();
  const { logout: authLogout } = useAuth();

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

  // On mobile, render logout as a button
  if (isMobile && isLoggedIn) {
    return (
      <div className="flex flex-col space-y-2 mt-4">
        <span className="text-bookish-maroon font-medium px-3">
          Welcome, {currentUser?.username || 'User'}!
        </span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleLogout}
          className="flex items-center justify-start text-bookish-maroon hover:bg-bookish-maroon/10 px-3"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    );
  }

  // On mobile, render login/signup as buttons
  if (isMobile && !isLoggedIn) {
    return (
      <div className="flex flex-col space-y-2 mt-4">
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center justify-start text-bookish-maroon hover:bg-bookish-maroon/10 px-3" 
          asChild
        >
          <Link to="/login">
            <LogIn className="h-4 w-4 mr-2" />
            Login
          </Link>
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center justify-start text-bookish-maroon hover:bg-bookish-maroon/10 px-3" 
          asChild
        >
          <Link to="/signup">
            <UserPlus className="h-4 w-4 mr-2" />
            Sign Up
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      {!isLoggedIn ? (
        <>
          <Button 
            variant="ghost" 
            size="sm" 
            className="hidden sm:flex items-center text-bookish-maroon hover:bg-bookish-maroon/10" 
            asChild
          >
            <Link to="/login">
              <LogIn className="h-4 w-4 mr-1" />
              Login
            </Link>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="hidden sm:flex items-center text-bookish-maroon hover:bg-bookish-maroon/10" 
            asChild
          >
            <Link to="/signup">
              <UserPlus className="h-4 w-4 mr-1" />
              Sign Up
            </Link>
          </Button>
        </>
      ) : (
        <UserMenu setIsLoggedIn={setIsLoggedIn} />
      )}
    </>
  );
};

export default AuthButtons;

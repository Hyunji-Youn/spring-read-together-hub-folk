import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { logout, User } from '@/services/auth.service';
import UserMenu from './UserMenu';

interface AuthButtonsProps {
  isMobile: boolean;
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  currentUser?: User | null;
}

const AuthButtons: React.FC<AuthButtonsProps> = ({ 
  isMobile, 
  isLoggedIn, 
  setIsLoggedIn,
  currentUser 
}) => {
  const navigate = useNavigate();

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

  if (isMobile) {
    return (
      <div className="fixed bottom-4 right-4 z-10 flex flex-col gap-2">
        {!isLoggedIn ? (
          <>
            <Button 
              className="bg-bookish-maroon hover:bg-bookish-dark shadow-lg rounded-full"
              asChild
            >
              <Link to="/login">
                <LogIn className="h-4 w-4 mr-1" />
                Login
              </Link>
            </Button>
            <Button 
              className="bg-bookish-maroon hover:bg-bookish-dark shadow-lg rounded-full"
              asChild
            >
              <Link to="/signup">
                <UserPlus className="h-4 w-4 mr-1" />
                Sign Up
              </Link>
            </Button>
          </>
        ) : (
          <Button 
            className="bg-bookish-maroon hover:bg-bookish-dark shadow-lg rounded-full"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-1" />
            Logout
          </Button>
        )}
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
        <UserMenu 
          setIsLoggedIn={setIsLoggedIn} 
          username={currentUser?.username}
          role={currentUser?.role}
        />
      )}
    </>
  );
};

export default AuthButtons;

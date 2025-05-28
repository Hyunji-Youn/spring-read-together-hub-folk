import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { User, Lock, UserRound, KeyRound, AlertCircle, ShieldCheck } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import api from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { login, adminLogin } from '../services/auth.service';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// Regular login form schema
const formSchema = z.object({
  username: z.string().min(1, { message: 'Please enter your username' }),
  password: z.string().min(1, { message: 'Please enter your registration code' }),
});

// Admin login form schema (same structure but can have different validations)
const adminFormSchema = z.object({
  username: z.string().min(1, { message: 'Please enter admin ID' }),
  password: z.string().min(1, { message: 'Please enter admin password' }),
});

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('user');
  const { login: authLogin, isAuthenticated } = useAuth();
  
  // Check if user is already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [navigate, isAuthenticated]);

  // Regular user login form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // Admin login form
  const adminForm = useForm<z.infer<typeof adminFormSchema>>({
    resolver: zodResolver(adminFormSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // Handle user login
  const onUserSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      await authLogin(values.username, values.password);
      
      toast.success('Login Successful', {
        description: 'Welcome!',
        duration: 3000,
      });
    } catch (error) {
      toast.error('Login Failed', {
        description: error.message || 'An error occurred during login.',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle admin login
  const onAdminSubmit = async (values: z.infer<typeof adminFormSchema>) => {
    setIsLoading(true);
    try {
      console.log('Attempting admin login...', values.username);
      
      const result = await adminLogin({
        username: values.username,
        password: values.password
      });
      
      console.log('Admin login result:', result);
      
      // Check if login was actually successful
      if (result.success) {
        toast.success('Admin Login Successful', {
          description: 'Welcome to the admin dashboard!',
          duration: 3000,
        });
        window.location.href = '/admin';
        return;
      } else {
        // Login failed, show error message
        toast.error('Admin Login Failed', {
          description: result.message || 'Invalid admin credentials.',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Admin login failed:', error);
      
      toast.error('Admin Login Failed', {
        description: error.response?.data?.message || error.message || 'An error occurred during admin login.',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto flex items-center justify-center min-h-[70vh] py-8">
        <Card className="w-full max-w-md border border-bookish-maroon/20">
          <Tabs defaultValue="user" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="user">Member Login</TabsTrigger>
              <TabsTrigger value="admin">Admin Login</TabsTrigger>
            </TabsList>
            
            {/* User Login Tab */}
            <TabsContent value="user">
              <CardHeader>
                <CardTitle className="text-xl font-serif text-bookish-maroon">Login</CardTitle>
                <CardDescription>
                  Please login to use the Spring Reading Club service.
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onUserSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <div className="flex">
                              <UserRound className="mr-2 h-4 w-4 text-neutral-500 mt-3" />
                              <Input placeholder="Enter your username" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Registration Code</FormLabel>
                          <FormControl>
                            <div className="flex">
                              <KeyRound className="mr-2 h-4 w-4 text-neutral-500 mt-3" />
                              <Input
                                type="password"
                                placeholder="Enter your registration code"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        'Login'
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
              
              <CardFooter className="flex flex-col space-y-4">
                <div className="flex items-center space-x-1 text-sm text-neutral-500">
                  <AlertCircle className="h-4 w-4" />
                  <span>Don't have an account?</span>
                  <Button variant="link" className="px-0 h-auto" onClick={() => navigate('/signup')}>
                    Sign up
                  </Button>
                </div>
              </CardFooter>
            </TabsContent>
            
            {/* Admin Login Tab */}
            <TabsContent value="admin">
              <CardHeader>
                <CardTitle className="text-xl font-serif text-bookish-maroon">Admin Login</CardTitle>
                <CardDescription>
                  Login with an admin account to access the dashboard.
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <Form {...adminForm}>
                  <form onSubmit={adminForm.handleSubmit(onAdminSubmit)} className="space-y-6">
                    <FormField
                      control={adminForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Admin ID</FormLabel>
                          <FormControl>
                            <div className="flex">
                              <ShieldCheck className="mr-2 h-4 w-4 text-neutral-500 mt-3" />
                              <Input placeholder="Enter admin ID" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={adminForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Admin Password</FormLabel>
                          <FormControl>
                            <div className="flex">
                              <KeyRound className="mr-2 h-4 w-4 text-neutral-500 mt-3" />
                              <Input
                                type="password"
                                placeholder="Enter admin password"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Add CORS test button for debugging */}
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full" 
                      onClick={async () => {
                        try {
                          const response = await fetch('https://localhost:3000/api/cors-test', {
                            method: 'GET',
                            credentials: 'include'
                          });
                          const data = await response.json();
                          console.log('CORS test successful:', data);
                          toast.success('CORS test successful!');
                        } catch (error) {
                          console.error('CORS test failed:', error);
                          toast.error('CORS test failed: ' + error.message);
                        }
                      }}
                    >
                      Test CORS Connection
                    </Button>
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        'Admin Login'
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
              
              <CardFooter className="flex flex-col space-y-4">
                <div className="flex items-center space-x-1 text-sm text-neutral-500">
                  <AlertCircle className="h-4 w-4" />
                  <span>Default admin credentials: ID: admin / PW: admin</span>
                </div>
              </CardFooter>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </Layout>
  );
};

export default Login;
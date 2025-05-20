import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { User, Lock } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MemberType } from './Signup';
import { login, LoginRequest, isAuthenticated } from '@/services/auth.service';

// Define login form schema
const loginFormSchema = z.object({
  username: z.string().min(1, {
    message: "Please enter your username."
  }),
  password: z.string().min(1, {
    message: "Please enter your password."
  })
});
type LoginFormValues = z.infer<typeof loginFormSchema>;

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  // Check if user is already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/');
    }
  }, [navigate]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: "",
      password: ""
    }
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    
    try {
      // Use the login service
      const loginData: LoginRequest = {
        username: values.username,
        password: values.password
      };
      
      // Call the authentication service
      const user = await login(loginData);
      
      // Show success message
      toast.success(`Login successful!`, {
        description: `Welcome to Spring Book Club, ${user.name}!`
      });
      
      // Redirect to homepage after successful login
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (error: any) {
      // Handle different types of errors
      const errorMessage = error.response?.data?.message || 'Invalid username or password';
      const errorStatus = error.response?.status;
      
      if (errorStatus === 401) {
        toast.error("Login failed", {
          description: errorMessage
        });
      } else if (errorStatus === 403) {
        toast.error("Account pending approval", {
          description: "Your account is awaiting administrator approval."
        });
      } else {
        toast.error("Login failed", {
          description: "An error occurred during login. Please try again."
        });
      }
      
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return <Layout>
      <div className="container max-w-md mx-auto py-8">
        <Card className="border border-bookish-maroon/20">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-serif text-bookish-maroon">Login</CardTitle>
            <CardDescription>
              Sign in to Spring Book Club
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="username" render={({
                field
              }) => <FormItem>
                      <FormLabel>User ID</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-bookish-maroon/70" />
                          <Input placeholder="Enter your username" className="pl-10" {...field} disabled={isLoading} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
                
                <FormField control={form.control} name="password" render={({
                field
              }) => <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-bookish-maroon/70" />
                          <Input placeholder="Enter password" className="pl-10" type="password" {...field} disabled={isLoading} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
                
                <div className="flex justify-end">
                  <Link to="/forgot-password" className="text-sm text-bookish-maroon hover:underline">
                    Forgot your password?
                  </Link>
                </div>
                
                <Button type="submit" className="w-full bg-bookish-maroon hover:bg-bookish-dark" disabled={isLoading}>
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            </Form>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-sm text-center">
              Don't have an account?{" "}
              <Link to="/signup" className="text-bookish-maroon hover:underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </Layout>;
};
export default Login;
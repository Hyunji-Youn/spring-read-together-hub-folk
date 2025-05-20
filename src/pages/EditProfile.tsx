import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../hooks/use-profile';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { UserProfile } from '@/services/user.service';

// Define our form schema with Zod
const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone_number: z.string().min(10, 'Phone number must be at least 10 digits'),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditProfile() {
  const { profile, isLoading, isError, updateProfile, isUpdating } = useProfile();
  const [updateError, setUpdateError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Initialize form with react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone_number: '',
    },
  });

  // Set default values once profile data is loaded
  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name,
        email: profile.email,
        phone_number: profile.phone_number,
      });
    }
  }, [profile, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      setUpdateError(null);
      await updateProfile(data as Partial<UserProfile>);
      navigate('/profile');
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : 'Failed to update profile');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Edit Profile</h1>
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </Layout>
    );
  }

  if (isError || !profile) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Edit Profile</h1>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Unable to load your profile information. Please try again later.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button variant="outline" onClick={() => navigate('/profile')}>
              Return to Profile
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Edit Profile</h1>
        
        {updateError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{updateError}</AlertDescription>
          </Alert>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Update Your Information</CardTitle>
            <CardDescription>
              Make changes to your profile information below. You cannot change your username or password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <FormLabel className="text-muted-foreground">Username (ID)</FormLabel>
                      <Input 
                        value={profile.username} 
                        disabled
                        className="bg-muted"
                      />
                      <FormDescription>
                        Your username cannot be changed
                      </FormDescription>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                  <Button 
                    variant="outline" 
                    type="button" 
                    onClick={() => navigate('/profile')}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
} 
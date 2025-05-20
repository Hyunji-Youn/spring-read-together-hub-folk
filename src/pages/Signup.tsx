import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Mail, User, Lock, Phone, CheckCheck } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { register as registerService, RegisterRequest } from '@/services/auth.service';

// Define the member types
export type MemberType = 'Member' | 'Librarian';

// Define our signup form schema
const signupFormSchema = z.object({
  username: z.string().min(4, {
    message: "Username must be at least 4 characters."
  }).max(100, "Username must be at most 100 characters."),
  name: z.string().min(2, {
    message: "Name must be at least 2 characters."
  }).max(100, "Name must be at most 100 characters."),
  email: z.string().email({
    message: "Please enter a valid email address."
  }),
  phone_number: z.string().regex(/^\d{10,11}$/, 'Please enter a 10-11 digit phone number.'),
  password: z.string().min(1, { message: "Registration code is required." }), // General validation, specific check in service
  memberType: z.enum(['Member', 'Librarian'], {
    required_error: "Please select a member type."
  }),
  agreeTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to our terms and conditions."
  })
});

type SignupFormValues = z.infer<typeof signupFormSchema>;

const Signup = () => {
  const navigate = useNavigate();
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      username: "",
      name: "",
      email: "",
      phone_number: "",
      password: "", // User will type the registration code here
      memberType: "Member",
      agreeTerms: false
    }
  });

  const onSubmit = async (values: SignupFormValues) => {
    try {
      const payload: RegisterRequest = {
        username: values.username,
        name: values.name,
        email: values.email,
        phone_number: values.phone_number,
        password: values.password, // This is the registration code entered by user
        requested_librarian_role: values.memberType === 'Librarian',
      };

      const response = await registerService(payload);

      if (response.success || response.id) {
        toast.success("Registration request submitted!", {
          description: "Your account will be active after admin approval."
        });
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        toast.error("Registration failed", {
          description: response.message || "An unknown error occurred."
        });
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      const errorMessage = error.response?.data?.message || error.message || "An error occurred during registration.";
      toast.error("Registration failed", {
        description: errorMessage
      });
    }
  };

  return <Layout>
      <div className="container max-w-md mx-auto py-8">
        <Card className="border border-bookish-maroon/20">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-serif text-bookish-maroon">Create an Account</CardTitle>
            <CardDescription>
              Join our book-loving community today
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="username" render={({
                field
              }) => <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-bookish-maroon/70" />
                          <Input placeholder="Choose a username" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
                
                <FormField control={form.control} name="name" render={({
                field
              }) => <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-bookish-maroon/70" />
                          <Input placeholder="Enter your full name" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
                
                <FormField control={form.control} name="email" render={({
                field
              }) => <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-bookish-maroon/70" />
                          <Input placeholder="email@example.com" className="pl-10" type="email" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={form.control} name="phone_number" render={({
                field
              }) => <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-bookish-maroon/70" />
                          <Input placeholder="Enter numbers only" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
                
                <FormField control={form.control} name="memberType" render={({
                field
              }) => <FormItem>
                      <FormLabel>Member Type</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Member" id="member" />
                            <FormLabel htmlFor="member" className="font-normal cursor-pointer">
                              Member
                            </FormLabel>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Librarian" id="librarian" />
                            <FormLabel htmlFor="librarian" className="font-normal cursor-pointer">
                              Librarian (Request)
                            </FormLabel>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
                
                <FormField control={form.control} name="password" render={({
                field
              }) => <FormItem>
                      <FormLabel>Registration Code</FormLabel> {/* Changed from Password to Registration Code */}
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-bookish-maroon/70" />
                          <Input 
                            placeholder="Enter the registration code" 
                            className="pl-10" 
                            type="password" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
                                
                <FormField control={form.control} name="agreeTerms" render={({
                field
              }) => <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal">
                          I agree to the{" "}
                          <Link to="/terms" className="text-bookish-maroon hover:underline">
                            terms of service
                          </Link>{" "}
                          and{" "}
                          <Link to="/privacy" className="text-bookish-maroon hover:underline">
                            privacy policy
                          </Link>
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>} />
                
                <Button type="submit" className="w-full bg-bookish-maroon hover:bg-bookish-dark">
                  Create Account
                </Button>
              </form>
            </Form>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-sm text-center">
              Already have an account?{" "}
              <Link to="/login" className="text-bookish-maroon hover:underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </Layout>;
};
export default Signup;
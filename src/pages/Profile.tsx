import { useProfile } from '../hooks/use-profile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { Calendar, User, Mail, Phone, AlertTriangle, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { AxiosError } from 'axios';
import { Button } from '../components/ui/button';
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useNavigate } from 'react-router-dom';

const ApplicationStatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'approved':
      return <Badge className="bg-green-500">Approved</Badge>;
    case 'rejected':
      return <Badge className="bg-red-500">Rejected</Badge>;
    case 'pending_approval':
      return <Badge className="bg-yellow-500">Pending Approval</Badge>;
    default:
      return <Badge className="bg-gray-500">{status}</Badge>;
  }
};

export default function Profile() {
  const { profile, isLoading, isError, error, updateProfile } = useProfile();
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const navigate = useNavigate();

  // Set up countdown timer if we hit a rate limit
  useEffect(() => {
    if (rateLimitCountdown > 0) {
      const timer = setTimeout(() => {
        setRateLimitCountdown(count => Math.max(0, count - 1));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [rateLimitCountdown]);

  // Check if error is rate limiting (429)
  const isRateLimited = error instanceof AxiosError && error.response?.status === 429;
  
  // Set rate limit countdown if needed
  useEffect(() => {
    if (isRateLimited) {
      // Parse retry-after header or default to 60 seconds
      const retryAfter = error?.response?.headers?.['retry-after'] 
        ? parseInt(error.response.headers['retry-after'])
        : 60;
      setRateLimitCountdown(retryAfter);
    }
  }, [error, isRateLimited]);

  const renderProfileContent = () => {
    if (isLoading) {
      return (
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">My Profile</h1>
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-40 mb-2" />
              <Skeleton className="h-4 w-60" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-60" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-60" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-60" />
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (isRateLimited) {
      return (
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">My Profile</h1>
          <Card className="p-6 bg-yellow-50 border-yellow-200">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <CardTitle className="text-yellow-800 mb-2">Rate Limit Exceeded</CardTitle>
                <CardDescription className="text-yellow-700 mb-6">
                  We've received too many requests. Please wait {rateLimitCountdown} {rateLimitCountdown === 1 ? 'second' : 'seconds'} before trying again.
                </CardDescription>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()} 
                  disabled={rateLimitCountdown > 0}
                >
                  {rateLimitCountdown > 0 ? `Please wait (${rateLimitCountdown}s)` : 'Try Again'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    if (isError || !profile) {
      return (
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">My Profile</h1>
          <Card className="p-6 bg-red-50 border-red-200">
            <CardTitle className="text-red-600 mb-2">Unable to load profile</CardTitle>
            <CardDescription className="mb-4">
              An error occurred while fetching your profile information. Please refresh or try again later.
            </CardDescription>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh
            </Button>
          </Card>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <Button 
            onClick={() => navigate('/edit-profile')} 
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit Profile
          </Button>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{profile.name}</CardTitle>
                <CardDescription className="flex items-center mt-1">
                  <User className="h-4 w-4 mr-1" />
                  {profile.username}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <ApplicationStatusBadge status={profile.application_status} />
                <Badge>{profile.role.role_name}</Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-muted-foreground block mb-2">Email</Label>
                <div className="flex items-center text-lg">
                  <Mail className="h-5 w-5 mr-2 text-primary" />
                  {profile.email}
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground block mb-2">Phone Number</Label>
                <div className="flex items-center text-lg">
                  <Phone className="h-5 w-5 mr-2 text-primary" />
                  {profile.phone_number}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-muted-foreground block mb-2">Registration Date</Label>
                <div className="flex items-center text-lg">
                  <Calendar className="h-5 w-5 mr-2 text-primary" />
                  {format(new Date(profile.created_at), 'MMMM dd, yyyy')}
                </div>
              </div>

              {profile.requested_librarian_role_on_application && (
                <div>
                  <Badge className="bg-blue-500">Librarian Role Requested</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <Layout>
      {renderProfileContent()}
    </Layout>
  );
} 
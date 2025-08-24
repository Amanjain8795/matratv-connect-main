import React from 'react';
import { useAuth } from '@/context/NewAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const AuthDebugger: React.FC = () => {
  const { user, profile, loading, retry, signOut } = useAuth();
  const isAuthenticated = !!user;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Authentication Debug Panel</CardTitle>
        <CardDescription>
          Debug authentication state and session restoration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium">Authentication Status:</p>
            <Badge variant={isAuthenticated ? "default" : "secondary"}>
              {isAuthenticated ? "Authenticated" : "Not Authenticated"}
            </Badge>
          </div>
          <div>
            <p className="text-sm font-medium">Loading State:</p>
            <Badge variant={loading ? "destructive" : "default"}>
              {loading ? "Loading..." : "Loaded"}
            </Badge>
          </div>
        </div>

        {user && (
          <div className="space-y-2">
            <p className="text-sm font-medium">User Data:</p>
            <div className="bg-muted p-3 rounded text-xs">
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Created:</strong> {new Date(user.created_at).toLocaleString()}</p>
              <p><strong>Email Confirmed:</strong> {user.email_confirmed_at ? 'Yes' : 'No'}</p>
            </div>
          </div>
        )}

        {profile && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Profile Data:</p>
            <div className="bg-muted p-3 rounded text-xs">
              <p><strong>Full Name:</strong> {profile.full_name || 'Not set'}</p>
              <p><strong>Phone:</strong> {profile.phone || 'Not set'}</p>
              <p><strong>Referral Code:</strong> {profile.referral_code}</p>
              <p><strong>Total Earnings:</strong> ₹{profile.total_earnings}</p>
              <p><strong>Available Balance:</strong> ₹{profile.available_balance}</p>
            </div>
          </div>
        )}

        {!user && !loading && (
          <div className="text-center text-muted-foreground">
            No user authenticated. Please login to test session restoration.
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={retry} variant="outline" size="sm">
            Retry Auth
          </Button>
          {isAuthenticated && (
            <Button onClick={signOut} variant="destructive" size="sm">
              Sign Out
            </Button>
          )}
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            size="sm"
          >
            Test Page Refresh
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <p><strong>Session Storage:</strong> {sessionStorage.getItem('authSession') ? 'Has cached data' : 'No cached data'}</p>
          <p><strong>Local Storage (Mock):</strong> {localStorage.getItem('mockUser') ? 'Has mock data' : 'No mock data'}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuthDebugger;

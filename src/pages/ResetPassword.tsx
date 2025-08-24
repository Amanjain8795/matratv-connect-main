import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Shield,
  ArrowLeft 
} from "lucide-react";
import { useAuth } from "@/context/NewAuthContext";

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { resetPassword, loading } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Get tokens from URL
  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');
  const type = searchParams.get('type');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError: setFormError,
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const password = watch('password');

  // Calculate password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;
    
    // Character type checks
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^A-Za-z0-9]/.test(password)) strength += 15;
    
    setPasswordStrength(Math.min(strength, 100));
  }, [password]);

  // Check if we have valid reset tokens
  useEffect(() => {
    if (!accessToken || !refreshToken || type !== 'recovery') {
      setError('Invalid or expired reset link. Please request a new password reset.');
    }
  }, [accessToken, refreshToken, type]);

  const getStrengthLabel = (strength: number) => {
    if (strength < 30) return { label: 'Weak', color: 'bg-red-500' };
    if (strength < 60) return { label: 'Fair', color: 'bg-yellow-500' };
    if (strength < 80) return { label: 'Good', color: 'bg-blue-500' };
    return { label: 'Strong', color: 'bg-green-500' };
  };

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!accessToken || !refreshToken) {
      setFormError('password', {
        type: 'manual',
        message: 'Invalid reset link. Please request a new password reset.'
      });
      return;
    }

    try {
      await resetPassword(accessToken, data.password);
      setResetSuccess(true);
      
      // Redirect to login after success
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Password reset successful. Please log in with your new password.' 
          }
        });
      }, 3000);
    } catch (error: any) {
      if (error.message?.includes('expired') || error.message?.includes('invalid')) {
        setFormError('password', {
          type: 'manual',
          message: 'Reset link has expired. Please request a new password reset.'
        });
      } else if (error.message?.includes('weak') || error.message?.includes('common')) {
        setFormError('password', {
          type: 'manual',
          message: 'Password is too weak. Please choose a stronger password.'
        });
      } else {
        setFormError('password', {
          type: 'manual',
          message: error.message || 'Failed to reset password. Please try again.'
        });
      }
    }
  };

  if (error) {
    return (
      <>
        <Seo 
          title="Invalid Reset Link"
          description="The password reset link is invalid or expired"
        />
        
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-2xl">Invalid Reset Link</CardTitle>
              <CardDescription>
                This password reset link is invalid or has expired.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              
              <div className="flex flex-col gap-2">
                <Button asChild className="w-full">
                  <Link to="/forgot-password">
                    Request New Reset Link
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="w-full">
                  <Link to="/login">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (resetSuccess) {
    return (
      <>
        <Seo 
          title="Password Reset Successful"
          description="Your password has been reset successfully"
        />
        
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <CardTitle className="text-2xl">Password Reset Successful!</CardTitle>
              <CardDescription>
                Your password has been updated successfully.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  You can now log in with your new password. Redirecting to login page...
                </AlertDescription>
              </Alert>
              
              <Button asChild className="w-full">
                <Link to="/login">
                  Continue to Login
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const strengthInfo = getStrengthLabel(passwordStrength);

  return (
    <>
      <Seo 
        title={t("auth.resetPasswordTitle")}
        description="Set a new password for your MATRATV CARE account"
      />
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">{t("auth.resetPasswordTitle")}</CardTitle>
            <CardDescription>
              {t("auth.resetPasswordDescription")}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your new password"
                    {...register("password")}
                    className={errors.password ? "border-destructive pr-10" : "pr-10"}
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                {password && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Password strength:</span>
                      <span className={`font-medium ${
                        strengthInfo.label === 'Weak' ? 'text-red-500' :
                        strengthInfo.label === 'Fair' ? 'text-yellow-500' :
                        strengthInfo.label === 'Good' ? 'text-blue-500' :
                        'text-green-500'
                      }`}>
                        {strengthInfo.label}
                      </span>
                    </div>
                    <Progress 
                      value={passwordStrength} 
                      className="h-2"
                    />
                  </div>
                )}
                
                {errors.password && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {errors.password.message}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    {...register("confirmPassword")}
                    className={errors.confirmPassword ? "border-destructive pr-10" : "pr-10"}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {errors.confirmPassword.message}
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={loading || passwordStrength < 60}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Update Password
                  </>
                )}
              </Button>

              <div className="text-center">
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ResetPassword;

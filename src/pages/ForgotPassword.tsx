import { useState } from "react";
import { Link } from "react-router-dom";
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
import { Mail, ArrowLeft, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/NewAuthContext";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword = () => {
  const [emailSent, setEmailSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const { requestPasswordReset, loading } = useAuth();
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      await requestPasswordReset(data.email);
      setSubmittedEmail(data.email);
      setEmailSent(true);
    } catch (error: any) {
      // Handle specific error cases
      if (error.message?.includes('not found') || error.message?.includes('Invalid')) {
        setError('email', {
          type: 'manual',
          message: 'No account found with this email address'
        });
      } else if (error.message?.includes('rate limit') || error.message?.includes('too many')) {
        setError('email', {
          type: 'manual',
          message: 'Too many reset attempts. Please wait before trying again.'
        });
      } else {
        setError('email', {
          type: 'manual',
          message: error.message || 'Failed to send reset email. Please try again.'
        });
      }
    }
  };

  const resendEmail = async () => {
    if (submittedEmail) {
      try {
        await requestPasswordReset(submittedEmail);
      } catch (error) {
        console.error('Failed to resend email:', error);
      }
    }
  };

  return (
    <>
      <Seo 
        title={t("auth.forgotPasswordTitle")}
        description="Reset your password to regain access to your MATRATV CARE account"
      />
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              {emailSent ? (
                <CheckCircle className="h-6 w-6 text-primary" />
              ) : (
                <Mail className="h-6 w-6 text-primary" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {emailSent ? t("auth.checkYourEmail") : t("auth.forgotPasswordTitle")}
            </CardTitle>
            <CardDescription>
              {emailSent 
                ? t("auth.passwordResetSent")
                : t("auth.forgotPasswordDescription")
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {emailSent ? (
              <div className="space-y-4">
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    We've sent a password reset link to <strong>{submittedEmail}</strong>
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <p className="mb-2">Please check your email and follow the instructions to reset your password.</p>
                    <p>If you don't see the email, check your spam folder.</p>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={resendEmail}
                      variant="outline"
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Resend Email
                        </>
                      )}
                    </Button>
                    
                    <Button asChild variant="ghost" className="w-full">
                      <Link to="/login">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Login
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("auth.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    {...register("email")}
                    className={errors.email ? "border-destructive" : ""}
                    autoFocus
                    autoComplete="email"
                  />
                  {errors.email && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      {errors.email.message}
                    </div>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Reset Link...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Reset Link
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
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ForgotPassword;

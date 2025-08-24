import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Check if using placeholder credentials
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const isPlaceholder = supabaseUrl === 'https://your-project.supabase.co' || 
                             supabaseAnonKey === 'your-anon-key-here';

        if (isPlaceholder) {
          // Mock verification for development
          console.warn('Using mock verification - Supabase not configured');
          setStatus('success');
          return;
        }

        // Get token parameters (Supabase uses different parameter names)
        const token = searchParams.get('token');
        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type');

        console.log('Verification URL params:', {
          token,
          tokenHash,
          type,
          allParams: Object.fromEntries(searchParams.entries())
        });

        // Use token_hash if available, otherwise try token
        const verificationToken = tokenHash || token;

        if (!verificationToken || type !== 'email') {
          setStatus('error');
          setErrorMessage(`Invalid verification link. Missing token or incorrect type. Type: ${type}, Token: ${!!verificationToken}`);
          return;
        }

        // Verify the email using Supabase
        const { error } = await supabase.auth.verifyOtp({
          token_hash: verificationToken,
          type: 'email'
        });

        if (error) {
          setStatus('error');
          setErrorMessage(error.message);
        } else {
          setStatus('success');
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/login?message=verified');
          }, 3000);
        }
      } catch (error: any) {
        setStatus('error');
        setErrorMessage(error.message || 'Verification failed');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="container py-10 max-w-lg mx-auto">
      <Seo title={t("auth.emailVerification")} description="Verify your email address" />
      <div className="bg-card rounded-lg shadow-sm border p-8 text-center">
        {status === 'verifying' && (
          <>
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h1 className="text-2xl font-semibold mb-4">{t("auth.verifyingEmail")}</h1>
            <p className="text-muted-foreground">
              {t("auth.pleaseWait")}
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold mb-4">{t("auth.emailVerified")}</h1>
            <p className="text-muted-foreground mb-6">
              {t("auth.emailVerifiedMessage")}
            </p>
            <Alert className="mb-4 bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                {t("auth.redirectingToLogin")}
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => navigate('/login?message=verified')}
              variant="hero"
              className="w-full"
            >
              {t("auth.continueToLogin")}
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold mb-4">{t("auth.verificationFailed")}</h1>
            <p className="text-muted-foreground mb-6">
              {errorMessage || t("auth.verificationFailedMessage")}
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => navigate('/register')} 
                variant="outline" 
                className="w-full"
              >
                {t("auth.backToRegister")}
              </Button>
              <Button 
                onClick={() => navigate('/login')} 
                variant="hero" 
                className="w-full"
              >
                {t("auth.backToLogin")}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;

import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/NewAuthContext";

const Register = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [emailAlreadyVerified, setEmailAlreadyVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const { signUp, user } = useAuth();
  const isAuthenticated = !!user;
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Pre-fill referral code from URL if present
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setReferralCode(refCode.toUpperCase());
    }
  }, [searchParams]);

  // Redirect if already authenticated - use useEffect to avoid setState during render
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  // Don't render register form if user is already authenticated
  if (isAuthenticated) {
    return null;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      await signUp({ email, password, fullName, phone, referralCode: referralCode || undefined });
      setVerificationSent(true);
    } catch (error: any) {
      // Check for different error types
      if (error.message === t('auth.emailAlreadyRegistered')) {
        setAlreadyRegistered(true);
      } else if (error.message === t('auth.emailAlreadyVerified')) {
        setEmailAlreadyVerified(true);
      }
      // Other errors handled in auth context
    } finally {
      setIsLoading(false);
    }
  };

  if (emailAlreadyVerified) {
    return (
      <div className="container py-10 max-w-lg mx-auto">
        <Seo title={t("auth.emailAlreadyVerified")} description="This email is already verified" />
        <div className="bg-card rounded-lg shadow-sm border p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-semibold mb-4">{t("auth.emailAlreadyVerified")}</h1>
          <p className="text-muted-foreground mb-6">
            {t("auth.emailAlreadyVerifiedMessage")}
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => navigate("/login")}
              variant="hero"
              className="w-full"
            >
              {t("auth.login")}
            </Button>
            <Button
              onClick={() => {
                setEmailAlreadyVerified(false);
                setEmail("");
              }}
              variant="outline"
              className="w-full"
            >
              Try Different Email
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (alreadyRegistered) {
    return (
      <div className="container py-10 max-w-lg mx-auto">
        <Seo title={t("auth.emailAlreadyRegistered")} description="This email is already registered" />
        <div className="bg-card rounded-lg shadow-sm border p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-semibold mb-4">{t("auth.emailAlreadyRegistered")}</h1>
          <p className="text-muted-foreground mb-6">
            If this is your account, please sign in using your existing credentials.
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => navigate("/login")}
              variant="hero"
              className="w-full"
            >
              {t("auth.login")}
            </Button>
            <Button
              onClick={() => {
                setAlreadyRegistered(false);
                setEmail("");
              }}
              variant="outline"
              className="w-full"
            >
              Try Different Email
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (verificationSent) {
    return (
      <div className="container py-10 max-w-lg mx-auto">
        <Seo title={t("auth.verificationSent")} description="Please check your email to verify your account" />
        <div className="bg-card rounded-lg shadow-sm border p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-semibold mb-4">{t("auth.verificationSent")}</h1>
          <p className="text-muted-foreground mb-6">
            {t("auth.verificationEmailMessage")}
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            {t("auth.checkSpamFolder")}
          </p>
          <Button
            onClick={() => navigate("/login")}
            variant="outline"
            className="w-full"
          >
            {t("auth.backToLogin")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10 max-w-lg mx-auto">
      <Seo title={t("auth.register")} description="Create your matratvcare account and start earning via referrals" />
      <div className="bg-card rounded-lg shadow-sm border p-8">
        <h1 className="text-3xl font-semibold mb-6 text-center">{t("auth.register")}</h1>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="fullName">{t("auth.fullName")}</Label>
            <Input 
              id="fullName" 
              type="text" 
              placeholder="Your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{t("auth.phone")}</Label>
            <Input 
              id="phone" 
              type="tel" 
              placeholder="+91-"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
            <Input 
              id="confirmPassword" 
              type="password" 
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="referralCode">{t("auth.referralCode")}</Label>
            <Input 
              id="referralCode" 
              type="text" 
              placeholder="ABC123"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
            />
          </div>
          <Button type="submit" variant="hero" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating account..." : t("auth.register")}
          </Button>
        </form>
        <div className="mt-6 text-center text-sm text-muted-foreground">
          {t("auth.alreadyHaveAccount")}{" "}
          <Link to="/login" className="text-primary underline-offset-4 hover:underline">
            {t("auth.signInHere")}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;

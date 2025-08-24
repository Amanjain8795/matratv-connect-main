import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/context/NewAuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const [showVerificationSuccess, setShowVerificationSuccess] = useState(false);
  const { signIn, user } = useAuth();
  const isAuthenticated = !!user;
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Check if user just verified their email
  useEffect(() => {
    if (searchParams.get('message') === 'verified') {
      setShowVerificationSuccess(true);
      // Remove the message parameter from URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('message');
      window.history.replaceState({}, '', `${window.location.pathname}${newSearchParams.toString() ? '?' + newSearchParams.toString() : ''}`);
    }
  }, [searchParams]);

  // Redirect if already authenticated - use useEffect to avoid setState during render
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  // Don't render login form if user is already authenticated
  if (isAuthenticated) {
    return null;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(email, password);
      navigate("/");
    } catch (error) {
      // Error handled in auth context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-10 max-w-lg mx-auto">
      <Seo title={t("auth.login")} description="Login to your matratvcare account" />
      <div className="bg-card rounded-lg shadow-sm border p-8">
        <h1 className="text-3xl font-semibold mb-6 text-center">{t("auth.login")}</h1>

        {showVerificationSuccess && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">
              {t("auth.emailVerificationSuccess")}
            </AlertDescription>
          </Alert>
        )}

        <form className="space-y-4" onSubmit={onSubmit}>
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
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="•••��••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <Link to="/forgot-password" className="text-sm text-primary underline-offset-4 hover:underline">
              {t("auth.forgotPassword")}
            </Link>
          </div>
          <Button type="submit" variant="hero" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : t("auth.login")}
          </Button>
        </form>
        <div className="mt-6 text-center text-sm text-muted-foreground">
          {t("auth.dontHaveAccount")}{" "}
          <Link to="/register" className="text-primary underline-offset-4 hover:underline">
            {t("auth.registerHere")}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;

import { useState, useEffect } from 'react';
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Footer } from "@/components/layout/Footer";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Truck, User, Shield, AlertCircle, Loader2, Zap, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const nameSchema = z.string().min(2, 'Name must be at least 2 characters');

const DEMO_ACCOUNTS = [
  { label: 'Admin', sublabel: 'Super access — edit all data', email: 'admin@smartfleet.demo', password: 'demo123456', name: 'Admin User', role: 'admin' as const, icon: Crown, color: 'from-red-500 to-rose-600' },
  { label: 'Fleet Owner', sublabel: 'Full fleet access', email: 'owner@truckpulse.demo', password: 'demo123456', name: 'Rajesh Sharma', role: 'owner' as const, icon: Shield, color: 'from-amber-500 to-orange-600' },
  { label: 'Driver 1 — Tata Prima', sublabel: 'MH-12-AB-1234', email: 'driver1@truckpulse.demo', password: 'demo123456', name: 'Suresh Kumar', role: 'driver' as const, icon: Truck, color: 'from-blue-500 to-cyan-600' },
  { label: 'Driver 2 — Ashok Leyland', sublabel: 'GJ-05-CD-5678', email: 'driver2@truckpulse.demo', password: 'demo123456', name: 'Amit Patel', role: 'driver' as const, icon: Truck, color: 'from-emerald-500 to-teal-600' },
  { label: 'Driver 3 — Mahindra Blazo', sublabel: 'RJ-14-EF-9012', email: 'driver3@truckpulse.demo', password: 'demo123456', name: 'Vikram Singh', role: 'driver' as const, icon: Truck, color: 'from-violet-500 to-purple-600' },
  { label: 'Driver 4 — BharatBenz', sublabel: 'KA-01-GH-3456', email: 'driver4@truckpulse.demo', password: 'demo123456', name: 'Venkatesh Rao', role: 'driver' as const, icon: Truck, color: 'from-rose-500 to-pink-600' },
  { label: 'Driver 5 — Eicher Pro', sublabel: 'TN-09-IJ-7890', email: 'driver5@truckpulse.demo', password: 'demo123456', name: 'Murugan Selvam', role: 'driver' as const, icon: Truck, color: 'from-orange-500 to-amber-600' },
  { label: 'Driver 6 — Tata Signa', sublabel: 'DL-01-KL-2345', email: 'driver6@truckpulse.demo', password: 'demo123456', name: 'Harpreet Singh', role: 'driver' as const, icon: Truck, color: 'from-sky-500 to-indigo-600' },
];

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading, signIn, signUp } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [quickLoginId, setQuickLoginId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState<'owner' | 'driver'>('driver');
  const [signupError, setSignupError] = useState('');

  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleQuickLogin = async (index: number) => {
    const account = DEMO_ACCOUNTS[index];
    setQuickLoginId(index);

    const { error: signInError } = await signIn(account.email, account.password);
    
    if (signInError) {
      const { error: signUpError } = await signUp(account.email, account.password, account.name, account.role);
      if (signUpError) {
        toast.error('Quick login failed: ' + signUpError.message);
        setQuickLoginId(null);
        return;
      }
      const { error: retryError } = await signIn(account.email, account.password);
      if (retryError) {
        toast.error('Created account but sign-in failed. Try again.');
        setQuickLoginId(null);
        return;
      }
    }

    toast.success(`Welcome, ${account.name}!`);
    setQuickLoginId(null);
    navigate('/');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setLoginError(err.errors[0].message);
        return;
      }
    }

    setIsLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setIsLoading(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setLoginError('Invalid email or password. Please try again.');
      } else {
        setLoginError(error.message);
      }
      return;
    }

    toast.success('Welcome back!');
    navigate('/');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    
    try {
      nameSchema.parse(signupName);
      emailSchema.parse(signupEmail);
      passwordSchema.parse(signupPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setSignupError(err.errors[0].message);
        return;
      }
    }

    setIsLoading(true);
    const { error } = await signUp(signupEmail, signupPassword, signupName, signupRole);
    setIsLoading(false);

    if (error) {
      if (error.message.includes('already registered')) {
        setSignupError('This email is already registered. Please log in instead.');
      } else {
        setSignupError(error.message);
      }
      return;
    }

    toast.success('Account created successfully!');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
          <img src="/webwheels-logo.png" alt="SmartFleet AI" className="w-12 h-12 rounded-xl" />
        <div>
          <h1 className="font-display font-semibold text-2xl text-foreground tracking-tight">SmartFleet AI</h1>
          <p className="text-sm text-muted-foreground font-medium">Intelligent Infrastructure for Modern Logistics</p>
        </div>
      </div>


      {/* Quick Demo Login */}
      <Card className="w-full max-w-md glass-card-elevated mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-warning" />
            <CardTitle className="text-base">Quick Demo Login</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Instantly access the dashboard as different roles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {DEMO_ACCOUNTS.map((account, i) => (
            <button
              key={i}
              onClick={() => handleQuickLogin(i)}
              disabled={quickLoginId !== null}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all disabled:opacity-50"
            >
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${account.color} flex items-center justify-center shrink-0`}>
                <account.icon className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground">{account.label}</p>
                <p className="text-xs text-muted-foreground truncate">{account.sublabel}</p>
              </div>
              {quickLoginId === i ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
              ) : (
                <span className="text-xs text-muted-foreground shrink-0">→</span>
              )}
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Standard Auth */}
      <Card className="w-full max-w-md glass-card-elevated">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl">Welcome to SmartFleet AI</CardTitle>
          <CardDescription>
            Sign in to manage your fleet or create an account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Create Account</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" placeholder="you@company.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input id="login-password" type="password" placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} disabled={isLoading} />
                </div>
                {loginError && (
                  <div className="flex items-center gap-2 text-sm text-danger">
                    <AlertCircle className="w-4 h-4" />
                    {loginError}
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</>) : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input id="signup-name" type="text" placeholder="John Anderson" value={signupName} onChange={(e) => setSignupName(e.target.value)} disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" placeholder="you@company.com" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input id="signup-password" type="password" placeholder="••••••••" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} disabled={isLoading} />
                </div>
                <div className="space-y-3">
                  <Label>Account Type</Label>
                  <RadioGroup value={signupRole} onValueChange={(v) => setSignupRole(v as 'owner' | 'driver')} className="grid grid-cols-2 gap-4">
                    <Label htmlFor="role-owner" className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${signupRole === 'owner' ? 'border-primary bg-primary/10' : 'border-border hover:border-muted-foreground'}`}>
                      <RadioGroupItem value="owner" id="role-owner" className="sr-only" />
                      <Shield className="w-6 h-6 text-primary" />
                      <span className="font-medium">Fleet Owner</span>
                      <span className="text-xs text-muted-foreground text-center">Full access to all vehicles & analytics</span>
                    </Label>
                    <Label htmlFor="role-driver" className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${signupRole === 'driver' ? 'border-primary bg-primary/10' : 'border-border hover:border-muted-foreground'}`}>
                      <RadioGroupItem value="driver" id="role-driver" className="sr-only" />
                      <User className="w-6 h-6 text-primary" />
                      <span className="font-medium">Driver</span>
                      <span className="text-xs text-muted-foreground text-center">View assigned vehicles & trips</span>
                    </Label>
                  </RadioGroup>
                </div>
                {signupError && (
                  <div className="flex items-center gap-2 text-sm text-danger">
                    <AlertCircle className="w-4 h-4" />
                    {signupError}
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account...</>) : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <p className="mt-6 text-sm text-muted-foreground text-center max-w-md">
        By signing up, you agree to our Terms of Service and Privacy Policy.
      </p>
      <Footer className="w-full mt-auto" />
    </div>
  );
}

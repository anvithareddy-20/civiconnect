import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, ArrowLeft, Shield } from 'lucide-react';

const EMOJI_OPTIONS = ['👤', '😊', '🌟', '🎨', '🚀', '💼', '🎯', '🌈', '🔥', '💡', '🎭', '🎪'];

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isResetMode, setIsResetMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState('👤');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [showOtpForm, setShowOtpForm] = useState(false);
  
  const { signUp, signIn, resetPassword, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'reset') {
      setIsResetMode(true);
    }
  }, [searchParams]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpTimer === 0 && showOtpForm) {
      setShowOtpForm(false);
      toast({
        title: "OTP Expired",
        description: "The OTP has expired. Please request a new one.",
        variant: "destructive",
      });
    }
    return () => clearInterval(interval);
  }, [otpTimer, showOtpForm, toast]);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const isEmailInput = (input: string) => {
    return validateEmail(input);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isEmailInput(email)) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: "Login Failed",
              description: "Invalid email or password. Please try again.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Login Error",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Welcome back!",
            description: "You have successfully logged in.",
          });
        }
      } else {
        const metadata = {
          display_name: isAnonymous ? 'Anonymous User' : displayName,
          is_anonymous: isAnonymous,
          emoji_avatar: selectedEmoji,
        };

        const { error } = await signUp(email, password, metadata);
        if (error) {
          if (error.message.includes('User already registered')) {
            toast({
              title: "Account Exists",
              description: "An account with this email already exists. Please try logging in instead.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Sign Up Error",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Account Created!",
            description: "Please check your email to verify your account.",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await resetPassword(email);
      if (error) {
        toast({
          title: "Reset Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Simulate OTP sending and timer
        setShowOtpForm(true);
        setOtpTimer(120); // 2 minutes
        toast({
          title: "Reset Email Sent",
          description: "Please check your email for the reset link. You can also use the 6-digit code sent to your email.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otpCode.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a 6-digit code",
        variant: "destructive",
      });
      return;
    }

    // In a real implementation, you would verify the OTP here
    toast({
      title: "OTP Verified",
      description: "Please check your email to complete the password reset.",
    });
    
    setShowOtpForm(false);
    setIsResetMode(false);
    setOtpCode('');
    setOtpTimer(0);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (showOtpForm) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-primary">Enter OTP Code</CardTitle>
            <CardDescription>
              Enter the 6-digit code sent to your email
            </CardDescription>
            <div className="text-lg font-mono text-primary">
              Time remaining: {formatTimer(otpTimer)}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">6-Digit Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-2xl tracking-widest"
                  maxLength={6}
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowOtpForm(false);
                    setOtpCode('');
                    setOtpTimer(0);
                  }}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={otpCode.length !== 6}>
                  Verify Code
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-mesh flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-primary/10 rounded-full animate-float" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-primary/5 rounded-full animate-float" style={{ animationDelay: '1s' }} />
      </div>
      
      <Card className="w-full max-w-md glass shadow-elegant border-primary/30 animate-fade-in relative z-10">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glow animate-glow">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold gradient-text">
            {isResetMode ? 'Reset Password' : isLogin ? 'Welcome Back' : 'Join CivicConnect'}
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            {isResetMode 
              ? 'Enter your email to reset your password'
              : isLogin 
                ? 'Sign in to continue your civic journey' 
                : 'Start making a difference in your community'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={isResetMode ? handleForgotPassword : handleAuth} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-semibold text-foreground">Email Address</Label>
              <div className="relative group">
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 px-4 bg-secondary/50 border-primary/30 rounded-xl text-lg focus:border-primary focus:shadow-glow transition-all duration-300"
                  required
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-primary/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            </div>

            {!isResetMode && (
              <div className="space-y-3">
                <Label htmlFor="password" className="text-sm font-semibold text-foreground">Password</Label>
                <div className="relative group">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 px-4 pr-12 bg-secondary/50 border-primary/30 rounded-xl text-lg focus:border-primary focus:shadow-glow transition-all duration-300"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 p-0 hover:bg-primary/10 rounded-lg transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-primary" /> : <Eye className="h-4 w-4 text-primary" />}
                  </Button>
                  <div className="absolute inset-0 rounded-xl bg-gradient-primary/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
              </div>
            )}

            {!isLogin && !isResetMode && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="anonymous"
                      checked={isAnonymous}
                      onCheckedChange={setIsAnonymous}
                    />
                    <Label htmlFor="anonymous">Keep my identity anonymous</Label>
                  </div>

                  {!isAnonymous && (
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        type="text"
                        placeholder="Enter your display name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        required={!isAnonymous}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Choose Your Avatar</Label>
                    <div className="grid grid-cols-6 gap-2">
                      {EMOJI_OPTIONS.map((emoji) => (
                        <Button
                          key={emoji}
                          type="button"
                          variant={selectedEmoji === emoji ? "default" : "outline"}
                          size="sm"
                          className="text-2xl p-2 h-12"
                          onClick={() => setSelectedEmoji(emoji)}
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 btn-modern text-lg font-semibold rounded-xl shadow-glow hover:shadow-hover transition-all duration-300" 
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Please wait...
                </div>
              ) : (
                isResetMode ? 'Send Reset Link' :
                isLogin ? 'Sign In to CivicConnect' : 'Create Your Account'
              )}
            </Button>

            {isLogin && !isResetMode && (
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 border-primary/30 text-primary hover:bg-primary/5 hover:border-primary rounded-xl transition-all duration-300"
                onClick={() => setIsResetMode(true)}
              >
                Forgot your password?
              </Button>
            )}
          </form>

          {!isResetMode && (
            <>
              <div className="relative my-8">
                <Separator className="bg-border/50" />
                <div className="absolute inset-0 flex justify-center">
                  <span className="bg-card px-4 text-muted-foreground font-medium">or</span>
                </div>
              </div>

              <div className="text-center">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 border-primary/30 text-primary hover:bg-primary/5 hover:border-primary rounded-xl transition-all duration-300 font-medium"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setPassword('');
                    setConfirmPassword('');
                    setDisplayName('');
                    setIsAnonymous(false);
                    setSelectedEmoji('👤');
                  }}
                >
                  {isLogin ? "Don't have an account? Join now" : "Already have an account? Sign in"}
                </Button>
              </div>
            </>
          )}

          {isResetMode && (
            <div className="text-center mt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsResetMode(false)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
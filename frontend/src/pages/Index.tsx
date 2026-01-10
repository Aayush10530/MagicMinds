import { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { DavidAvatar } from '@/components/DavidAvatar';
import { VoiceChat } from '@/components/VoiceChat';
import { RoleplayScenarios } from '@/components/RoleplayScenarios';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ProgressTracker } from '@/components/ProgressTracker';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, MessageCircle, Drama, X, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { User } from '@/components/User';
import RotatingText from '@/components/RotatingText';

export type AppMode = 'welcome' | 'chat' | 'roleplay';
export type Language = 'en' | 'hi' | 'mr' | 'gu' | 'ta';

type AuthStep = 'email' | 'login' | 'register';

const Index = () => {
  const [currentMode, setCurrentMode] = useState<AppMode>('welcome');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');
  const [userProgress, setUserProgress] = useState({
    chatSessions: 0,
    roleplayCompleted: 0,
    streak: 0,
    badges: [] as string[]
  });

  // Auth State
  const [showAuth, setShowAuth] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string>('');

  const [authStep, setAuthStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  // Data Persistence Helper
  const getUserData = (userEmail: string) => {
    return JSON.parse(localStorage.getItem(`magic_minds_progress_${userEmail}`) || '{"chatSessions": 0, "roleplayCompleted": 0, "streak": 0, "badges": []}');
  };

  const saveUserData = (userEmail: string, data: any) => {
    localStorage.setItem(`magic_minds_progress_${userEmail}`, JSON.stringify(data));
  };

  // Mock DB helper
  const getUsers = () => JSON.parse(localStorage.getItem('magic_minds_users') || '{}');
  const saveUser = (email: string, data: any) => {
    const users = getUsers();
    users[email] = data;
    localStorage.setItem('magic_minds_users', JSON.stringify(users));
  };
  // Check for existing token
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await fetch('http://localhost:3000/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const user = await res.json();
            setIsLoggedIn(true);
            setUserName(user.name);
            setEmail(user.email);
          } else {
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('Auth verification failed', error);
          localStorage.removeItem('token');
        }
      }
    };
    checkAuth();
  }, []);

  const resetAuth = () => {
    setAuthStep('email');
    setEmail('');
    setPassword('');
    setCountry('');
    setUserName('');
    setAuthError('');
    setShowPassword(false);
    setIsLoading(false);
  };

  const checkUserExists = async (email: string) => {
    // In a real flow, we might check availability, but for now we'll just proceed to login or register
    // This part wraps into the UI logic below
    return false; // Helper not strictly needed in new flow
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // Simplification: We don't check existence first in this UI flow without an endpoint.
    // We will assume "Login" first, user can switch to "Register".
    // Or we can try to Login, if 404/400 then switch?
    // Let's keep the UI simple: Default to Login step.
    setAuthStep('login');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setIsLoading(true);
    setAuthError('');

    try {
      const res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.error || 'Login failed');
      } else {
        localStorage.setItem('token', data.token);
        completeLogin(data.user.name, data.user.email);
      }
    } catch (error) {
      setAuthError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setAuthError('Please fill all fields');
      return;
    }

    setIsLoading(true);
    setAuthError('');

    try {
      const res = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: userName || email.split('@')[0], country })
      });

      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.error || 'Registration failed');
      } else {
        localStorage.setItem('token', data.token);
        completeLogin(data.user.name, data.user.email);
      }
    } catch (error) {
      setAuthError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const completeLogin = (name: string, emailStr: string) => {
    setIsLoggedIn(true);
    setUserName(name);
    setEmail(emailStr);
    setShowAuth(false);
    // Refresh progress from server would go here
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log('Google Auth Response:', tokenResponse);
      setIsLoading(true);
      setAuthError("");

      try {
        // Phase 2: Send token to Backend to verify and login/signup
        const res = await fetch('http://localhost:3000/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenResponse.access_token })
        });

        const data = await res.json();

        if (!res.ok) {
          setAuthError(data.error || 'Google Login failed');
        } else {
          localStorage.setItem('token', data.token);
          completeLogin(data.user.name, data.user.email);
        }
      } catch (error) {
        console.error("Google verify error:", error);
        setAuthError('Connection error. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    onError: error => {
      console.error('Google Login Error:', error);
      setAuthError("Google Login failed. Please try again.");
    }
  });

  const handleGoogleLogin = () => {
    googleLogin();
  };

  const updateProgress = (type: 'chat' | 'roleplay') => {
    setUserProgress(prev => {
      const updated = {
        ...prev,
        chatSessions: type === 'chat' ? prev.chatSessions + 1 : prev.chatSessions,
        roleplayCompleted: type === 'roleplay' ? prev.roleplayCompleted + 1 : prev.roleplayCompleted,
      };

      if (updated.chatSessions === 5 && !updated.badges.includes('chatter')) updated.badges.push('chatter');
      if (updated.roleplayCompleted === 3 && !updated.badges.includes('actor')) updated.badges.push('actor');

      localStorage.setItem('david-progress', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-16 h-16 bg-gradient-to-r from-yellow-300 to-orange-300 rounded-full opacity-20 animate-float"></div>
        <div className="absolute top-40 right-20 w-12 h-12 bg-gradient-to-r from-pink-300 to-purple-300 rounded-full opacity-30 animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-gradient-to-r from-blue-300 to-green-300 rounded-full opacity-25 animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 p-4 flex justify-between items-start">
        <div className="flex items-center gap-4">
          <DavidAvatar size="small" isActive={currentMode !== 'welcome'} />
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Magic Minds
            </h1>
            <p className="text-lg text-purple-600 font-medium">Your magical learning companion! ✨</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <LanguageSelector selectedLanguage={selectedLanguage} onLanguageChange={setSelectedLanguage} />
          <ProgressTracker progress={userProgress} />
          <User
            isLoggedIn={isLoggedIn}
            onClick={() => setShowAuth(!showAuth)}
            width={24} height={24} strokeWidth={2} stroke="#8b5cf6"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6">
        {currentMode === 'welcome' && (
          <div className="max-w-4xl mx-auto text-center py-12">
            <div className="mb-8">
              <DavidAvatar size="large" isActive={true} />
              <h2 className="text-6xl font-bold mb-4 leading-tight">
                Hello,{' '}
                <RotatingText
                  texts={isLoggedIn && userName ? [userName] : ['smart friend', 'little explorer', 'wonder seeker']}
                  className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent"
                  interval={2000}
                />
                ! 👋
              </h2>
              <p className="text-2xl text-purple-700 mb-8 max-w-2xl mx-auto leading-relaxed">
                I'm your magical AI tutor David! Let's learn together! 🌟
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto mb-12">
              <Card
                className="p-8 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0 relative overflow-hidden"
                onClick={() => {
                  if (!isLoggedIn) setShowAuth(true);
                  else setCurrentMode('chat');
                }}
              >
                <div className="relative z-10">
                  <MessageCircle className="h-16 w-16 mb-4 mx-auto animate-float" />
                  <h3 className="text-2xl font-bold mb-3">Free Chat Mode</h3>
                  <p className="text-purple-100 text-lg">Ask me anything! 🗣️</p>
                  {!isLoggedIn && <span className="inline-block mt-2 text-sm bg-white/20 px-2 py-1 rounded">Login Required</span>}
                </div>
              </Card>

              <Card
                className="p-8 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl bg-gradient-to-br from-blue-500 to-green-500 text-white border-0 relative overflow-hidden"
                onClick={() => {
                  if (!isLoggedIn) setShowAuth(true);
                  else setCurrentMode('roleplay');
                }}
              >
                <div className="relative z-10">
                  <Drama className="h-16 w-16 mb-4 mx-auto animate-float" style={{ animationDelay: '0.5s' }} />
                  <h3 className="text-2xl font-bold mb-3">Roleplay Adventures</h3>
                  <p className="text-blue-100 text-lg">Practice real-life conversations! 🎭</p>
                  {!isLoggedIn && <span className="inline-block mt-2 text-sm bg-white/20 px-2 py-1 rounded">Login Required</span>}
                </div>
              </Card>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={() => {
                  if (!isLoggedIn) setShowAuth(true);
                  else setCurrentMode('chat');
                }}
                className="btn-magical text-xl px-12 py-6"
              >
                <Mic className="mr-3 h-6 w-6" />
                {isLoggedIn ? "Start Learning Now!" : "Login to Start"}
              </Button>
            </div>
          </div>
        )}

        {currentMode === 'chat' && (
          <div className="max-w-4xl mx-auto">
            <Button variant="outline" onClick={() => setCurrentMode('welcome')} className="mb-4">← Home</Button>
            <VoiceChat language={selectedLanguage} onSessionComplete={() => updateProgress('chat')} />
          </div>
        )}

        {currentMode === 'roleplay' && (
          <div className="max-w-4xl mx-auto">
            <Button variant="outline" onClick={() => setCurrentMode('welcome')} className="mb-4">← Home</Button>
            <RoleplayScenarios language={selectedLanguage} onScenarioComplete={() => updateProgress('roleplay')} />
          </div>
        )}
      </main>

      {/* Authentication Modal */}
      {showAuth && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-[400px] bg-white border-0 shadow-2xl overflow-hidden relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { setShowAuth(false); resetAuth(); }}
              className="absolute top-2 right-2 hover:bg-gray-100 rounded-full z-10"
            >
              <X className="h-5 w-5 text-gray-500" />
            </Button>

            {/* Auth Content */}
            <div className="p-8">
              {/* Header Icon */}
              <div className="flex justify-center mb-6">
                <div className="bg-purple-100 p-3 rounded-2xl">
                  <User className="h-8 w-8 text-purple-600" />
                </div>
              </div>

              {isLoggedIn ? (
                <div className="text-center space-y-6">
                  <h2 className="text-2xl font-bold text-gray-800">Account</h2>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Signed in as</p>
                    <p className="font-semibold text-gray-800">{userName || email}</p>
                  </div>
                  <Button
                    onClick={() => {
                      setIsLoggedIn(false);
                      setUserName('');
                      localStorage.removeItem('token');
                      resetAuth();
                    }}
                    className="w-full bg-red-50 text-red-600 hover:bg-red-100 border-0"
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <>
                  {/* Step 1: Email */}
                  {authStep === 'email' && (
                    <form onSubmit={handleEmailSubmit} className="space-y-6">
                      <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Welcome</h2>
                        <p className="text-gray-500 mt-2">Log in to Magic Minds to continue.</p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Parent's Email Address <span className="text-red-500">*</span></Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="h-12 border-gray-300 focus:border-purple-500 focus:ring-purple-500 transition-all"
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-lg transition-colors"
                          disabled={isLoading}
                        >
                          {isLoading ? <Loader2 className="animate-spin" /> : "Continue"}
                        </Button>
                      </div>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200"></span></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-500">Or</span></div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleGoogleLogin}
                        className="w-full h-12 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium flex items-center justify-center gap-2"
                        disabled={isLoading}
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26s.01 0 .01-.01z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                      </Button>

                      <div className="text-center pt-2">
                        <p className="text-sm text-gray-500">
                          Don't have an account?{' '}
                          <button
                            type="button"
                            onClick={() => setAuthStep('register')}
                            className="text-indigo-600 font-semibold hover:underline"
                          >
                            Sign up
                          </button>
                        </p>
                      </div>
                    </form>
                  )}

                  {/* Step 2: Login */}
                  {authStep === 'login' && (
                    <form onSubmit={handleLogin} className="space-y-6 animate-in slide-in-from-right-8 fade-in-20 duration-300">
                      <div className="mb-6">
                        <button
                          type='button'
                          onClick={() => setAuthStep('email')}
                          className="text-gray-400 hover:text-gray-600 flex items-center gap-1 text-sm mb-4 transition-colors"
                        >
                          <ArrowLeft className="w-4 h-4" /> Change email
                        </button>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h2>
                        <div className="p-3 bg-gray-50 rounded border border-gray-200 text-sm text-gray-600 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                            {email[0].toUpperCase()}
                          </div>
                          {email}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
                          <div className="relative">
                            <Input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className={`h-12 border-gray-300 pr-10 ${authError ? 'border-red-500 focus:ring-red-500' : ''}`}
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {authError && <p className="text-sm text-red-500">{authError}</p>}
                        </div>
                        <Button
                          type="submit"
                          className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-lg"
                          disabled={isLoading}
                        >
                          {isLoading ? <Loader2 className="animate-spin" /> : "Log in"}
                        </Button>

                        <div className="relative my-4">
                          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200"></span></div>
                          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-500">Or</span></div>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleGoogleLogin}
                          className="w-full h-12 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium flex items-center justify-center gap-2"
                          disabled={isLoading}
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26s.01 0 .01-.01z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                          </svg>
                          Continue with Google
                        </Button>
                        <div className="text-center">
                          <button type="button" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Forgot password?</button>
                        </div>
                      </div>
                    </form>
                  )}

                  {/* Step 3: Register */}
                  {authStep === 'register' && (
                    <form onSubmit={handleRegister} className="space-y-6 animate-in slide-in-from-right-8 fade-in-20 duration-300">
                      <div className="mb-6">
                        <button
                          type='button'
                          onClick={() => setAuthStep('email')}
                          className="text-gray-400 hover:text-gray-600 flex items-center gap-1 text-sm mb-4"
                        >
                          <ArrowLeft className="w-4 h-4" /> Change email
                        </button>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign up</h2>
                        <p className="text-gray-500 text-sm">Create a new account</p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="reg-email">Email Address <span className="text-red-500">*</span></Label>
                          <Input
                            id="reg-email"
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-12 border-gray-300"
                            autoFocus
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                          <Input
                            id="name"
                            type="text"
                            placeholder="e.g. John Doe"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            className="h-12 border-gray-300"
                            autoFocus
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="reg-password">Password <span className="text-red-500">*</span></Label>
                          <div className="relative">
                            <Input
                              id="reg-password"
                              type={showPassword ? "text" : "password"}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="h-12 border-gray-300 pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="country">Country</Label>
                          <Select value={country} onValueChange={setCountry}>
                            <SelectTrigger className="h-12 border-gray-300">
                              <SelectValue placeholder="Select Country" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="in">India 🇮🇳</SelectItem>
                              <SelectItem value="us">United States 🇺🇸</SelectItem>
                              <SelectItem value="uk">United Kingdom 🇬🇧</SelectItem>
                              <SelectItem value="ca">Canada 🇨🇦</SelectItem>
                              <SelectItem value="au">Australia 🇦🇺</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {authError && <p className="text-sm text-red-500">{authError}</p>}

                        <div className="text-xs text-gray-500">
                          By continuing, you agree to our Terms of Service and Privacy Policy.
                        </div>

                        <Button
                          type="submit"
                          className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-lg"
                          disabled={isLoading}
                        >
                          {isLoading ? <Loader2 className="animate-spin" /> : "Continue"}
                        </Button>

                        <div className="relative my-4">
                          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200"></span></div>
                          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-500">Or</span></div>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleGoogleLogin}
                          className="w-full h-12 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium flex items-center justify-center gap-2"
                          disabled={isLoading}
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26s.01 0 .01-.01z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                          </svg>
                          Continue with Google
                        </Button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Index;
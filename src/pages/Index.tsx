import { useState, useEffect } from 'react';
import { GenieAvatar } from '@/components/GenieAvatar';
import { VoiceChat } from '@/components/VoiceChat';
import { RoleplayScenarios } from '@/components/RoleplayScenarios';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ProgressTracker } from '@/components/ProgressTracker';
import { WelcomeAnimation } from '@/components/WelcomeAnimation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MessageCircle, Drama, Star, Settings } from 'lucide-react';

export type AppMode = 'welcome' | 'chat' | 'roleplay';
export type Language = 'en' | 'hi' | 'mr' | 'gu' | 'ta';

const Index = () => {
  const [currentMode, setCurrentMode] = useState<AppMode>('welcome');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');
  const [userProgress, setUserProgress] = useState({
    chatSessions: 0,
    roleplayCompleted: 0,
    streak: 0,
    badges: [] as string[]
  });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Load user progress from localStorage
    const savedProgress = localStorage.getItem('genie-progress');
    if (savedProgress) {
      setUserProgress(JSON.parse(savedProgress));
    }
  }, []);

  const updateProgress = (type: 'chat' | 'roleplay') => {
    setUserProgress(prev => {
      const updated = {
        ...prev,
        chatSessions: type === 'chat' ? prev.chatSessions + 1 : prev.chatSessions,
        roleplayCompleted: type === 'roleplay' ? prev.roleplayCompleted + 1 : prev.roleplayCompleted,
      };
      
      // Add badges based on milestones
      if (updated.chatSessions === 5 && !updated.badges.includes('chatter')) {
        updated.badges.push('chatter');
      }
      if (updated.roleplayCompleted === 3 && !updated.badges.includes('actor')) {
        updated.badges.push('actor');
      }
      
      localStorage.setItem('genie-progress', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 relative overflow-hidden">
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-16 h-16 bg-gradient-to-r from-yellow-300 to-orange-300 rounded-full opacity-20 animate-float"></div>
        <div className="absolute top-40 right-20 w-12 h-12 bg-gradient-to-r from-pink-300 to-purple-300 rounded-full opacity-30 animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-gradient-to-r from-blue-300 to-green-300 rounded-full opacity-25 animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-60 left-1/2 w-8 h-8 bg-gradient-to-r from-green-300 to-blue-300 rounded-full opacity-40 animate-float" style={{animationDelay: '3s'}}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 p-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <GenieAvatar size="small" isActive={currentMode !== 'welcome'} />
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Genie Voice Tutor
            </h1>
            <p className="text-purple-600 font-medium">Your magical learning companion! ✨</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <LanguageSelector 
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
          />
          <ProgressTracker progress={userProgress} />
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            className="hover:bg-purple-50 border-purple-200"
          >
            <Settings className="h-5 w-5 text-purple-600" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6">
        {currentMode === 'welcome' && (
          <div className="max-w-4xl mx-auto text-center py-20">
            <div className="mb-12">
              <GenieAvatar size="large" isActive={true} />
              <h2 className="text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent animate-bounce-in">
                Hello, young learner! 👋
              </h2>
              <p className="text-2xl text-purple-700 mb-8 max-w-2xl mx-auto leading-relaxed">
                I'm your magical AI tutor Genie! Let's learn together through fun conversations and exciting role-playing adventures! 🌟
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto mb-12">
              <Card 
                className="p-8 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0 relative overflow-hidden"
                onClick={() => setCurrentMode('chat')}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="relative z-10">
                  <MessageCircle className="h-16 w-16 mb-4 mx-auto animate-float" />
                  <h3 className="text-2xl font-bold mb-3">Free Chat Mode</h3>
                  <p className="text-purple-100 text-lg">
                    Ask me anything! Practice speaking and get answers to all your questions! 🗣️
                  </p>
                </div>
              </Card>

              <Card 
                className="p-8 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl bg-gradient-to-br from-blue-500 to-green-500 text-white border-0 relative overflow-hidden"
                onClick={() => setCurrentMode('roleplay')}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="relative z-10">
                  <Drama className="h-16 w-16 mb-4 mx-auto animate-float" style={{animationDelay: '0.5s'}} />
                  <h3 className="text-2xl font-bold mb-3">Roleplay Adventures</h3>
                  <p className="text-blue-100 text-lg">
                    Practice real-life conversations! School, store, home and more! 🎭
                  </p>
                </div>
              </Card>
            </div>

            <div className="flex justify-center">
              <Button 
                onClick={() => setCurrentMode('chat')}
                className="btn-magical text-xl px-12 py-6"
              >
                <Mic className="mr-3 h-6 w-6" />
                Start Learning Now!
              </Button>
            </div>
            
            {/* Language Demo Section */}
            <div className="mt-12 p-6 bg-white/80 backdrop-blur rounded-2xl border border-purple-200">
              <h3 className="text-xl font-bold text-purple-800 mb-4">✨ Try Different Languages!</h3>
              <p className="text-purple-600 mb-4">Click on a language to hear how Genie sounds in different languages:</p>
              <div className="flex justify-center gap-3 flex-wrap">
                {['en', 'hi', 'mr', 'gu', 'ta'].map((lang) => (
                  <Button
                    key={lang}
                    onClick={() => {
                      setSelectedLanguage(lang as Language);
                      // Demo TTS in selected language
                      const demoText = lang === 'en' ? 'Hello! I am Genie, your learning friend!' :
                                     lang === 'hi' ? 'नमस्ते! मैं जीनी हूं, आपका सीखने वाला मित्र!' :
                                     lang === 'mr' ? 'नमस्कार! मी जीनी आहे, तुमचा शिकण्याचा मित्र!' :
                                     lang === 'gu' ? 'નમસ્તે! હું જીની છું, તમારો શીખવાનો મિત્र!' :
                                     'வணக்கம்! நான் ஜீனி, உங்கள் கற்றல் நண்பன்!';
                      
                       if ('speechSynthesis' in window) {
                         const utterance = new SpeechSynthesisUtterance(demoText);
                         utterance.rate = 0.8;
                         utterance.pitch = 1.1;
                         
                         // Set proper language codes for better pronunciation
                         const languageMap = {
                           'en': 'en-US',
                           'hi': 'hi-IN',
                           'mr': 'mr-IN', 
                           'gu': 'gu-IN',
                           'ta': 'ta-IN'
                         };
                         utterance.lang = languageMap[lang as keyof typeof languageMap] || 'en-US';
                         
                         window.speechSynthesis.speak(utterance);
                       }
                    }}
                    variant={selectedLanguage === lang ? "default" : "outline"}
                    className={`transition-all duration-300 hover:scale-105 ${
                      selectedLanguage === lang 
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 animate-pulse-glow" 
                        : "hover:bg-purple-50 hover:shadow-md"
                    }`}
                  >
                    {lang === 'en' ? '🇺🇸 English' :
                     lang === 'hi' ? '🇮🇳 हिंदी' :
                     lang === 'mr' ? '🇮🇳 मराठी' :
                     lang === 'gu' ? '🇮🇳 ગુજરાતી' :
                     '🇮🇳 தமிழ்'}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentMode === 'chat' && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <Button
                variant="outline"
                onClick={() => setCurrentMode('welcome')}
                className="mb-4 hover:bg-purple-50"
              >
                ← Back to Home
              </Button>
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Chat with Genie! 💬
              </h2>
              <p className="text-purple-700 text-lg">
                Ask me anything and practice your speaking skills!
              </p>
            </div>
            <VoiceChat 
              language={selectedLanguage}
              onSessionComplete={() => updateProgress('chat')}
            />
          </div>
        )}

        {currentMode === 'roleplay' && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <Button
                variant="outline"
                onClick={() => setCurrentMode('welcome')}
                className="mb-4 hover:bg-purple-50"
              >
                ← Back to Home
              </Button>
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                Roleplay Adventures! 🎭
              </h2>
              <p className="text-blue-700 text-lg">
                Practice conversations in different real-life situations!
              </p>
            </div>
            <RoleplayScenarios 
              language={selectedLanguage}
              onScenarioComplete={() => updateProgress('roleplay')}
            />
          </div>
        )}
      </main>

      {/* Mode switcher floating buttons */}
      {currentMode !== 'welcome' && (
        <div className="fixed bottom-8 right-8 flex flex-col gap-4">
          <Button
            onClick={() => setCurrentMode(currentMode === 'chat' ? 'roleplay' : 'chat')}
            className="btn-magical rounded-full w-16 h-16 p-0 shadow-lg"
            title={currentMode === 'chat' ? 'Switch to Roleplay' : 'Switch to Chat'}
          >
            {currentMode === 'chat' ? <Drama className="h-8 w-8" /> : <MessageCircle className="h-8 w-8" />}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Index;
import { useState, useEffect } from 'react';
import { DavidAvatar } from '@/components/DavidAvatar';
import { VoiceChat } from '@/components/VoiceChat';
import { RoleplayScenarios } from '@/components/RoleplayScenarios';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ProgressTracker } from '@/components/ProgressTracker';
import { WelcomeAnimation } from '@/components/WelcomeAnimation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MessageCircle, Drama, Star, X, Lightbulb } from 'lucide-react';
import { User } from '@/components/User';
import RotatingText from '@/components/RotatingText';
import { SmartTips } from '@/components/SmartTips';

export type AppMode = 'welcome' | 'chat' | 'roleplay' | 'knowledge';
export type Language = 'en' | 'hi' | 'mr' | 'gu' | 'ta';

// Function to get random insightful knowledge tips for children
const getRandomKnowledgeTip = (language: Language): string => {
  const knowledgeTips = {
    'en': [
      "Did you know? Octopuses have three hearts and blue blood! 🐙",
      "The Earth is about 4.5 billion years old, that's really, really old! 🌍",
      "A group of flamingos is called a 'flamboyance'! How fancy! 💖",
      "Stars twinkle because their light bends when it passes through Earth's atmosphere! ✨",
      "Your brain is more active when you're sleeping than when you're watching TV! 🧠",
      "Butterflies taste with their feet! Imagine tasting your food by walking on it! 🦋",
      "The Great Wall of China is so long it would take about 18 months to walk its entire length! 🧱",
      "A day on Venus is longer than a year on Venus! That's because Venus spins very slowly! 🪐",
      "Honey never spoils! Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old! 🍯",
      "Your fingernails grow faster on your dominant hand! Check it out! 💅"
    ],
    'hi': [
      "क्या आप जानते हैं? ऑक्टोपस के तीन दिल और नीला खून होता है! 🐙",
      "पृथ्वी लगभग 4.5 अरब वर्ष पुरानी है, यह वास्तव में बहुत पुरानी है! 🌍",
      "फ्लेमिंगो के समूह को 'फ्लैम्बोयंस' कहा जाता है! कितना शानदार! 💖",
      "तारे टिमटिमाते हैं क्योंकि उनका प्रकाश पृथ्वी के वायुमंडल से गुजरने पर मुड़ जाता है! ✨",
      "जब आप सोते हैं तो आपका मस्तिष्क टीवी देखने की तुलना में अधिक सक्रिय होता है! 🧠"
    ],
    'mr': [
      "तुम्हाला माहित आहे का? ऑक्टोपसला तीन हृदये आणि निळे रक्त असते! 🐙",
      "पृथ्वी सुमारे 4.5 अब्ज वर्षे जुनी आहे, ती खरंच खूप जुनी आहे! 🌍",
      "फ्लेमिंगोच्या समूहाला 'फ्लैम्बोयन्स' म्हणतात! किती छान! 💖",
      "तारे टिमटिमतात कारण त्यांचा प्रकाश पृथ्वीच्या वातावरणातून जाताना वाकतो! ✨",
      "तुम्ही झोपलेले असताना तुमचे मेंदू टीव्ही पाहण्यापेक्षा जास्त सक्रिय असते! 🧠"
    ],
    'gu': [
      "શું તમે જાણો છો? ઓક્ટોપસને ત્રણ હૃદય અને વાદળી રક્ત હોય છે! 🐙",
      "પૃથ્વી લગભગ 4.5 અબજ વર્ષ જૂની છે, તે ખરેખર ખૂબ જૂની છે! 🌍",
      "ફ્લેમિંગોના સમૂહને 'ફ્લેમ્બોયન્સ' કહેવામાં આવે છે! કેટલું ભવ્ય! 💖",
      "તારાઓ ટમટમે છે કારણ કે તેમનો પ્રકાશ પૃથ્વીના વાતાવરણમાંથી પસાર થતી વખતે વળે છે! ✨",
      "જ્યારે તમે ઊંઘી રહ્યા હોવ ત્યારે તમારું મગજ ટીવી જોવા કરતાં વધુ સક્રિય હોય છે! 🧠"
    ],
    'ta': [
      "உங்களுக்குத் தெரியுமா? ஆக்டோபஸுக்கு மூன்று இதயங்களும் நீல இரத்தமும் உள்ளது! 🐙",
      "பூமி சுமார் 4.5 பில்லியன் ஆண்டுகள் பழமையானது, அது உண்மையிலேயே மிகவும் பழமையானது! 🌍",
      "ஃப்ளெமிங்கோக்களின் குழுவை 'ஃப்ளாம்பாயன்ஸ்' என்று அழைக்கிறார்கள்! எவ்வளவு அழகானது! 💖",
      "நட்சத்திரங்கள் மின்னுகின்றன ஏனெனில் அவற்றின் ஒளி பூமியின் வளிமண்டலத்தின் வழியாக செல்லும்போது வளைகிறது! ✨",
      "நீங்கள் தூங்கும்போது உங்கள் மூளை டிவி பார்ப்பதை விட அதிகமாக செயல்படுகிறது! 🧠"
    ]
  };

  const tips = knowledgeTips[language] || knowledgeTips['en'];
  return tips[Math.floor(Math.random() * tips.length)];
};

const Index = () => {
  const [currentMode, setCurrentMode] = useState<AppMode>('welcome');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');
  const [currentTip, setCurrentTip] = useState<string>(getRandomKnowledgeTip('en'));
  const [userProgress, setUserProgress] = useState({
    chatSessions: 0,
    roleplayCompleted: 0,
    streak: 0,
    badges: [] as string[]
  });
  const [showAuth, setShowAuth] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // This will be replaced with actual auth state
  const [userName, setUserName] = useState<string>(''); // User's name from authentication

  useEffect(() => {
    // Load user progress from localStorage
    const savedProgress = localStorage.getItem('david-progress');
    if (savedProgress) {
      setUserProgress(JSON.parse(savedProgress));
    }
  }, []);

  // Update the current tip when language changes
  useEffect(() => {
    setCurrentTip(getRandomKnowledgeTip(selectedLanguage));
  }, [selectedLanguage]);

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
      
      localStorage.setItem('david-progress', JSON.stringify(updated));
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
          <LanguageSelector 
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
          />
          <ProgressTracker progress={userProgress} />
          <User 
            isLoggedIn={isLoggedIn}
            onClick={() => setShowAuth(!showAuth)}
            width={24}
            height={24}
            strokeWidth={2}
            stroke="#8b5cf6"
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
                  texts={
                    isLoggedIn && userName 
                      ? [userName, 'smart friend', 'little explorer', 'wonder seeker', 'clever kid', userName]
                      : userName === 'Guest'
                      ? ['Guest']
                      : ['smart friend', 'little explorer', 'wonder seeker', 'clever kid']
                  }
                  className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent"
                  interval={2000}
                  shouldStop={isLoggedIn && userName && userName !== 'Guest'}
                />
                ! 👋
              </h2>
              <p className="text-2xl text-purple-700 mb-8 max-w-2xl mx-auto leading-relaxed">
                I'm your magical AI tutor David! Let's learn together through fun conversations and exciting role-playing adventures! 🌟
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-8">
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

              <Card 
                className="p-8 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl bg-gradient-to-br from-yellow-500 to-orange-500 text-white border-0 relative overflow-hidden"
                onClick={() => setCurrentMode('knowledge')}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="relative z-10">
                  <Lightbulb className="h-16 w-16 mb-4 mx-auto animate-float" style={{animationDelay: '1s'}} />
                  <h3 className="text-2xl font-bold mb-3">Knowledge Explorer</h3>
                  <p className="text-yellow-100 text-lg">
                    Discover amazing facts and expand your knowledge about our wonderful world! 🌟
                  </p>
                </div>
              </Card>
            </div>

            <div className="mt-4 mb-12">
              <div className="relative">
                <SmartTips 
                  tip={currentTip} 
                  type="general" 
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 bg-white/30 hover:bg-white/50 rounded-full p-1"
                  onClick={() => setCurrentTip(getRandomKnowledgeTip(selectedLanguage))}
                >
                  <Star className="h-4 w-4" />
                </Button>
              </div>
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
              <p className="text-purple-600 mb-4">Click on a language to hear how David sounds in different languages:</p>
              <div className="flex justify-center gap-3 flex-wrap">
                {['en', 'hi', 'mr', 'gu', 'ta'].map((lang) => (
                  <Button
                    key={lang}
                    onClick={() => {
                      setSelectedLanguage(lang as Language);
                      // Update knowledge tip for the new language
                      setCurrentTip(getRandomKnowledgeTip(lang as Language));
                      
                      // Demo TTS in selected language
                      const demoText = lang === 'en' ? 'Hello! I am David, your learning friend!' :
                                     lang === 'hi' ? 'नमस्ते! मैं डेविड हूं, आपका सीखने वाला मित्र!' :
                                     lang === 'mr' ? 'नमस्कार! मी डेविड आहे, तुमचा शिकण्याचा मित्र!' :
                                     lang === 'gu' ? 'નમસ્તે! હું ડેવિડ છું, તમારો શીખવાનો મિત્ર!' :
                                     'வணக்கம்! நான் டேவிட், உங்கள் கற்றல் நண்பன்!';
                      
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
                Chat with David! 💬
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

        {currentMode === 'knowledge' && (
          <div className="max-w-4xl mx-auto py-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-purple-700">Knowledge Explorer</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setCurrentMode('welcome')}
                className="flex items-center gap-1"
              >
                <X size={16} />
                Close
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {['en', 'hi', 'mr', 'gu', 'ta'].map((lang) => (
                <SmartTips 
                  key={lang}
                  tip={getRandomKnowledgeTip(lang as Language)} 
                  type={Math.random() > 0.5 ? 'general' : 'encouragement'}
                />
              ))}
            </div>
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

      {/* Authentication Modal */}
      {showAuth && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="p-8 bg-white/95 backdrop-blur border-purple-200 max-w-md w-full mx-4 relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowAuth(false)}
              className="absolute top-4 right-4 hover:bg-purple-50"
            >
              <X className="h-5 w-5 text-purple-600" />
            </Button>
            
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <User 
                  isLoggedIn={isLoggedIn}
                  width={48}
                  height={48}
                  strokeWidth={2.5}
                  stroke="#8b5cf6"
                />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  {isLoggedIn ? 'Account Settings' : 'Welcome to Magic Minds'}
                </h2>
                <p className="text-purple-600">
                  {isLoggedIn ? 'Manage your account and preferences' : 'Sign in to save your progress and personalize your learning experience'}
                </p>
              </div>

              {!isLoggedIn ? (
                <div className="space-y-4">
                  <Button 
                    onClick={() => {
                      setIsLoggedIn(true);
                      setUserName('Parent'); // Extract name from email or use a proper name
                      setShowAuth(false);
                    }}
                    className="w-full bg-transparent text-purple-600 border-2 border-purple-300 hover:bg-purple-50 hover:border-purple-400"
                  >
                    Sign In with Google
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setIsLoggedIn(true);
                      setUserName('Guest'); // Guest user name
                      setShowAuth(false);
                    }}
                    className="w-full border-purple-200 text-purple-600 hover:bg-purple-50"
                  >
                    Continue as Guest
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-purple-700 font-medium">Logged in as:</p>
                    <p className="text-purple-600">{userName}</p>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setIsLoggedIn(false);
                      setUserName('');
                    }}
                    className="w-full border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Sign Out
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Index;
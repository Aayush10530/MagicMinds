import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DavidAvatar } from './DavidAvatar';
import { EmojiReactions } from './EmojiReactions';
import { SmartTips } from './SmartTips';
import { Mic, MicOff, Play, ArrowLeft, ArrowRight, Home, ShoppingCart, School, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RoleplayScenario {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  background: string;
  steps: {
    id: string;
    aiPrompt: string;
    expectedResponse?: string;
    tips: string;
  }[];
}

interface RoleplayScenariosProps {
  language: string;
  onScenarioComplete: () => void;
}

const scenarios: RoleplayScenario[] = [
  {
    id: 'school',
    title: 'At School',
    icon: <School className="w-8 h-8" />,
    description: 'Practice conversations with teachers and classmates!',
    background: 'from-blue-400 to-blue-600',
    steps: [
      {
        id: '1',
        aiPrompt: "Good morning! Welcome to our classroom! What's your name?",
        tips: "Say your name clearly and add 'Good morning' to be polite!"
      },
      {
        id: '2',
        aiPrompt: "Nice to meet you! Do you like coming to school?",
        tips: "You can say 'Yes, I like school' or 'School is fun!'"
      },
      {
        id: '3',
        aiPrompt: "That's wonderful! What's your favorite subject?",
        tips: "Think about subjects like Math, English, Art, or Science!"
      }
    ]
  },
  {
    id: 'store',
    title: 'At the Store',
    icon: <ShoppingCart className="w-8 h-8" />,
    description: 'Learn to shop and talk to shopkeepers!',
    background: 'from-green-400 to-green-600',
    steps: [
      {
        id: '1',
        aiPrompt: "Welcome to our store! How can I help you today?",
        tips: "Say 'I want to buy...' followed by what you need!"
      },
      {
        id: '2',
        aiPrompt: "That's a great choice! How many would you like?",
        tips: "Use numbers: 'I want one apple' or 'I need two bananas'"
      },
      {
        id: '3',
        aiPrompt: "Perfect! Here's your order. Have a great day!",
        tips: "Remember to say 'Thank you' to be polite!"
      }
    ]
  },
  {
    id: 'home',
    title: 'At Home',
    icon: <Home className="w-8 h-8" />,
    description: 'Practice family conversations and daily activities!',
    background: 'from-orange-400 to-orange-600',
    steps: [
      {
        id: '1',
        aiPrompt: "Hi there! Who do you live with at home?",
        tips: "You can say 'I live with my mom and dad' or mention your family!"
      },
      {
        id: '2',
        aiPrompt: "That sounds lovely! Do you help your family at home?",
        tips: "Talk about chores like 'I help wash dishes' or 'I clean my room'"
      },
      {
        id: '3',
        aiPrompt: "You're such a good helper! What's your favorite thing to do at home?",
        tips: "Share activities like 'I like to read books' or 'I play games'"
      }
    ]
  }
];

export const RoleplayScenarios = ({ language, onScenarioComplete }: RoleplayScenariosProps) => {
  const [selectedScenario, setSelectedScenario] = useState<RoleplayScenario | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userResponses, setUserResponses] = useState<string[]>([]);
  const { toast } = useToast();
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = async () => {
    try {
      setIsRecording(true);
      // Simulate recording
      await new Promise(resolve => setTimeout(resolve, 3000));
      setIsRecording(false);
      setIsProcessing(true);
      
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockResponses = [
        "My name is Sarah",
        "Yes, I love school!",
        "I like art class",
        "I want to buy apples",
        "I want three apples",
        "Thank you very much!",
        "I live with my mom and dad",
        "Yes, I help clean my room",
        "I like reading books"
      ];
      
      const response = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      setUserResponses(prev => [...prev, response]);
      setIsProcessing(false);
      
      // Move to next step after a delay
      setTimeout(() => {
        if (selectedScenario && currentStep < selectedScenario.steps.length - 1) {
          setCurrentStep(prev => prev + 1);
        } else {
          // Scenario complete
          toast({
            title: "Scenario Complete! 🎉",
            description: "Great job! You completed the roleplay successfully!",
          });
          onScenarioComplete();
        }
      }, 1500);
      
    } catch (error) {
      setIsRecording(false);
      setIsProcessing(false);
      toast({
        title: "Recording Error",
        description: "Something went wrong. Let's try again!",
        variant: "destructive"
      });
    }
  };

  const playAIPrompt = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const resetScenario = () => {
    setSelectedScenario(null);
    setCurrentStep(0);
    setUserResponses([]);
  };

  const nextStep = () => {
    if (selectedScenario && currentStep < selectedScenario.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (!selectedScenario) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6">
          {scenarios.map((scenario) => (
            <Card
              key={scenario.id}
              className={`p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl bg-gradient-to-br ${scenario.background} text-white border-0 relative overflow-hidden`}
              onClick={() => setSelectedScenario(scenario)}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative z-10 text-center space-y-4">
                <div className="flex justify-center">
                  {scenario.icon}
                </div>
                <h3 className="text-2xl font-bold">{scenario.title}</h3>
                <p className="text-white/90">{scenario.description}</p>
                <Button 
                  variant="outline" 
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30 w-full"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Adventure
                </Button>
              </div>
            </Card>
          ))}
        </div>
        
        <Card className="mt-8 p-6 bg-gradient-to-r from-purple-100 to-pink-100 border-purple-200">
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold text-purple-800">Choose Your Adventure! 🗺️</h3>
            <p className="text-purple-600">
              Pick a scenario and practice real-life conversations with David!
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const currentStepData = selectedScenario.steps[currentStep];
  const progress = ((currentStep + 1) / selectedScenario.steps.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Scenario Header */}
      <Card className={`p-6 bg-gradient-to-r ${selectedScenario.background} text-white border-0`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-full">
              {selectedScenario.icon}
            </div>
            <div>
              <h2 className="text-3xl font-bold">{selectedScenario.title}</h2>
              <p className="text-white/90">Step {currentStep + 1} of {selectedScenario.steps.length}</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={resetScenario}
            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Scenarios
          </Button>
        </div>
        
        <div className="mt-4">
          <Progress value={progress} className="h-3 bg-white/20" />
        </div>
      </Card>

      {/* Conversation Area */}
      <Card className="p-8 bg-white/90 backdrop-blur border-purple-200">
        <div className="space-y-6">
          {/* AI Prompt */}
          <div className="flex items-start gap-4">
            <DavidAvatar size="medium" isActive={true} mood="happy" />
            <div className="flex-1">
              <div className="chat-bubble chat-bubble-ai text-xl">
                {currentStepData.aiPrompt}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => playAIPrompt(currentStepData.aiPrompt)}
                className="mt-2 text-purple-600 hover:text-purple-800"
              >
                <Play className="w-4 h-4 mr-2" />
                Hear David Speak
              </Button>
            </div>
          </div>

          {/* User Response */}
          {userResponses[currentStep] && (
            <div className="flex items-start gap-4 justify-end">
              <div className="chat-bubble chat-bubble-user text-xl">
                {userResponses[currentStep]}
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-green-400 flex items-center justify-center text-white font-bold">
                👤
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Voice Controls */}
      <Card className={`p-8 bg-gradient-to-r ${selectedScenario.background} text-white border-0`}>
        <div className="text-center space-y-6">
          <Button
            onClick={startRecording}
            disabled={isProcessing || Boolean(userResponses[currentStep])}
            className={`w-24 h-24 rounded-full text-white border-4 border-white transition-all duration-300 ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse-glow' 
                : 'bg-green-500 hover:bg-green-600 hover:scale-110'
            }`}
          >
            {isRecording ? (
              <MicOff className="w-12 h-12" />
            ) : (
              <Mic className="w-12 h-12" />
            )}
          </Button>
          
          <div className="space-y-2">
            <p className="text-xl font-bold">
              {isRecording ? '🎤 Recording your response...' : 
               isProcessing ? '⚡ Processing...' : 
               userResponses[currentStep] ? '✅ Great response!' : '🎙️ Your turn to speak!'}
            </p>
            <p className="text-white/90">
              {userResponses[currentStep] ? 'Ready for the next step!' : 'Click the microphone and respond to David!'}
            </p>
          </div>

          {/* Navigation */}
          {userResponses[currentStep] && (
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={nextStep}
                disabled={currentStep >= selectedScenario.steps.length - 1}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Smart Tips */}
      <SmartTips tip={currentStepData.tips} type="encouragement" />

      {/* Emoji Reactions */}
      {userResponses[currentStep] && (
        <EmojiReactions onReaction={(emoji) => 
          toast({
            title: `Thanks for the ${emoji}!`,
            description: "Your feedback helps me improve!",
          })
        } />
      )}
    </div>
  );
};
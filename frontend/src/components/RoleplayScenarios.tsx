import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { DavidAvatar } from './DavidAvatar';
import { EmojiReactions } from './EmojiReactions';
import { SmartTips } from './SmartTips';
import { Mic, MicOff, Play, ArrowLeft, ArrowRight, Home, ShoppingCart, School } from 'lucide-react';
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
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [textInput, setTextInput] = useState('');

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;

    const message = textInput;
    setTextInput('');
    setIsProcessing(true);

    // Add user response
    setUserResponses(prev => [...prev, message]);

    // Send to backend for AI response
    try {
      const response = await fetch('http://localhost:3000/api/voice/roleplay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userMessage: message,
          language: language,
          scenarioId: selectedScenario?.id,
          scenarioContext: selectedScenario?.title,
          currentPrompt: selectedScenario?.steps[currentStep]?.aiPrompt
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // Play AI response
        playAIPrompt(result.aiMessage);
      }
    } catch (error) {
      console.error('Roleplay API error:', error);
      // Continue with scenario even if API fails
      toast({
        title: "AI Response Error",
        description: "Could not get a response from David, but let's continue!",
        variant: "default"
      });
    }

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
    }, 2000);
  };

  // Use refs for recording to match VoiceChat implementation
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      if (!navigator.onLine) {
        toast({
          title: "You are offline",
          description: "Voice recognition requires an internet connection. Try using the keyboard!",
          variant: "destructive"
        });
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

        try {
          // 1. Transcribe
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');
          formData.append('language', language);

          const transResponse = await fetch('http://localhost:3000/api/voice/transcribe', {
            method: 'POST',
            body: formData
          });

          if (!transResponse.ok) throw new Error("Transcription failed");
          const transResult = await transResponse.json();

          if (!transResult.success || !transResult.transcript) throw new Error("No transcript");

          const transcript = transResult.transcript;
          console.log('Roleplay transcript:', transcript);

          // 2. Process Response (Roleplay Logic)
          setUserResponses(prev => [...prev, transcript]);

          const rpResponse = await fetch('http://localhost:3000/api/voice/roleplay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userMessage: transcript,
              language: language,
              scenarioId: selectedScenario?.id,
              scenarioContext: selectedScenario?.title,
              currentPrompt: selectedScenario?.steps[currentStep]?.aiPrompt
            })
          });

          if (rpResponse.ok) {
            const rpResult = await rpResponse.json();
            if (rpResult.success && rpResult.aiMessage) {
              playAIPrompt(rpResult.aiMessage);
            }
          }

          // Advance Step
          setTimeout(() => {
            if (selectedScenario && currentStep < selectedScenario.steps.length - 1) {
              setCurrentStep(prev => prev + 1);
            } else {
              toast({
                title: "Scenario Complete! 🎉",
                description: "Great job! You completed the roleplay successfully!",
              });
              onScenarioComplete();
            }
          }, 2000);

        } catch (error) {
          console.error("Processing error:", error);
          toast({
            title: "Voice Error",
            description: "Could not understand speech. Please try Text Mode.",
            variant: "destructive"
          });
        } finally {
          setIsProcessing(false);
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);

      // Auto-stop after 10s
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          setIsRecording(false);
        }
      }, 10000);

    } catch (error) {
      console.error("Start recording error:", error);
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access to use voice.",
        variant: "destructive"
      });
    }
  };



  const getLanguageCode = (language: string): string => {
    const languageMap: { [key: string]: string } = {
      'en': 'en-US',
      'hi': 'hi-IN',
      'mr': 'mr-IN',
      'gu': 'gu-IN',
      'ta': 'ta-IN'
    };
    return languageMap[language] || 'en-US';
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

      {/* Interaction Controls */}
      <Card className={`p-8 bg-gradient-to-r ${selectedScenario.background} text-white border-0`}>
        <div className="text-center space-y-6">

          {/* Default to Voice, but allow keyboard toggle */}
          {!userResponses[currentStep] && (
            <div className="flex flex-col items-center gap-4">

              {showKeyboard ? (
                <div className="w-full max-w-lg space-y-4 animate-in fade-in zoom-in duration-300">
                  <Textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full p-4 rounded-xl text-gray-800 text-lg min-h-[120px] focus:ring-4 focus:ring-white/50 border-none"
                    autoFocus
                  />
                  <div className="flex gap-4 justify-center">
                    <Button
                      onClick={handleTextSubmit}
                      disabled={!textInput.trim() || isProcessing}
                      className="bg-white text-purple-600 hover:bg-white/90 font-bold px-8 py-4 rounded-full text-lg"
                    >
                      Send Answer 🚀
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowKeyboard(false)}
                      className="bg-transparent border-white text-white hover:bg-white/20 rounded-full"
                    >
                      <Mic className="w-4 h-4 mr-2" />
                      Use Voice
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Button
                    onClick={startRecording}
                    disabled={isProcessing}
                    className={`w-24 h-24 rounded-full text-white border-4 border-white transition-all duration-300 ${isRecording
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
                          '🎙️ Your turn to speak!'}
                    </p>
                    <button
                      onClick={() => setShowKeyboard(true)}
                      className="text-white/80 hover:text-white underline text-sm transition-colors"
                    >
                      Can't speak right now? Use keyboard ⌨️
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Post-response Navigation */}
          {userResponses[currentStep] && (
            <div className="space-y-4">
              <p className="text-xl font-bold">✅ Great response!</p>
              <p className="text-white/90">Ready for the next step!</p>

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
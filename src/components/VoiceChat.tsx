import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GenieAvatar } from './GenieAvatar';
import { EmojiReactions } from './EmojiReactions';
import { SmartTips } from './SmartTips';
import { Mic, MicOff, Volume2, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VoiceChatProps {
  language: string;
  onSessionComplete: () => void;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  text: string;
  timestamp: Date;
  audioUrl?: string;
}

export const VoiceChat = ({ language, onSessionComplete }: VoiceChatProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      text: "Hello there! I'm Genie, your magical voice tutor! 🧞‍♂️ Ask me anything - what would you like to learn today?",
      timestamp: new Date()
    }
  ]);
  const [currentTip, setCurrentTip] = useState("Click the microphone and start speaking! I can hear you perfectly!");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Request microphone permissions on component mount
    requestMicrophonePermission();
  }, []);

  const requestMicrophonePermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      toast({
        title: "Microphone Access Needed",
        description: "Please allow microphone access to use voice chat!",
        variant: "destructive"
      });
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setCurrentTip("Great! I'm listening carefully. Speak clearly and take your time!");

      // Auto-stop after 30 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          stopRecording();
        }
      }, 30000);

    } catch (error) {
      toast({
        title: "Recording Error",
        description: "Couldn't start recording. Please check your microphone!",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
      setCurrentTip("Processing your voice... This might take a moment! ✨");
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      // Simulate AI processing (replace with actual API calls)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock transcription
      const mockTranscriptions = [
        "Hi Genie, what is a noun?",
        "Can you help me with math?",
        "Tell me about animals",
        "What is the weather like?",
        "How do I make friends?"
      ];
      
      const userMessage = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
      
      // Add user message
      const userMsgId = Date.now().toString();
      setMessages(prev => [...prev, {
        id: userMsgId,
        type: 'user',
        text: userMessage,
        timestamp: new Date()
      }]);

      // Generate AI response
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const aiResponses = [
        "A noun is a word that names a person, place, or thing! Like 'cat', 'school', or 'friend'. Can you tell me a noun? 😊",
        "I'd love to help with math! What would you like to learn? Addition, subtraction, or something else? 🔢",
        "Animals are amazing! Did you know dolphins can recognize themselves in mirrors? What's your favorite animal? 🐬",
        "I can't check the weather, but I can help you learn weather words! Sunny ☀️, rainy 🌧️, cloudy ☁️. Which weather do you like?",
        "Making friends is special! Try being kind, sharing, and asking others to play. Friendship is like a beautiful flower that grows! 🌸"
      ];
      
      const aiResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'ai',
        text: aiResponse,
        timestamp: new Date()
      }]);

      setCurrentTip("Fantastic! Try asking another question or tell me what you think!");
      onSessionComplete();

    } catch (error) {
      toast({
        title: "Processing Error",
        description: "Something went wrong. Let's try again!",
        variant: "destructive"
      });
      setCurrentTip("Oops! Let's try that again. Click the microphone when you're ready!");
    } finally {
      setIsProcessing(false);
    }
  };

  const playAIResponse = (text: string) => {
    // Enhanced TTS with language support
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1.1;
      
      // Try to set language based on selected language
      const languageMap = {
        'en': 'en-US',
        'hi': 'hi-IN',
        'mr': 'mr-IN', 
        'gu': 'gu-IN',
        'ta': 'ta-IN'
      };
      
      utterance.lang = languageMap[language as keyof typeof languageMap] || 'en-US';
      
      // Add visual feedback
      setCurrentTip(`🔊 Speaking in ${language === 'en' ? 'English' : language === 'hi' ? 'Hindi' : language === 'mr' ? 'Marathi' : language === 'gu' ? 'Gujarati' : 'Tamil'}!`);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const clearChat = () => {
    setMessages([{
      id: '1',
      type: 'ai',
      text: "Hello there! I'm Genie, your magical voice tutor! 🧞‍♂️ Ask me anything - what would you like to learn today?",
      timestamp: new Date()
    }]);
    setCurrentTip("Ready for a fresh start! What would you like to learn?");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Chat Header */}
      <Card className="p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <GenieAvatar 
              size="medium" 
              isActive={true} 
              mood={isRecording ? 'listening' : isProcessing ? 'thinking' : 'happy'} 
            />
            <div>
              <h3 className="text-2xl font-bold">Chat with Genie!</h3>
              <p className="text-purple-100">
                {isRecording ? "I'm listening..." : isProcessing ? "Thinking..." : "Ready to chat!"}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearChat}
            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>
      </Card>

      {/* Chat Messages */}
      <Card className="p-6 bg-white/90 backdrop-blur border-purple-200 min-h-[400px]">
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type === 'ai' && (
                <GenieAvatar size="small" isActive={true} />
              )}
              
              <div className={`chat-bubble ${
                message.type === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'
              }`}>
                <p className="text-lg leading-relaxed">{message.text}</p>
                {message.type === 'ai' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => playAIResponse(message.text)}
                    className="mt-2 text-xs opacity-70 hover:opacity-100"
                  >
                    <Volume2 className="w-3 h-3 mr-1" />
                    Play Voice
                  </Button>
                )}
              </div>
              
              {message.type === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-green-400 flex items-center justify-center text-white font-bold">
                  👤
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Voice Controls */}
      <Card className="p-8 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
        <div className="text-center space-y-6">
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
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
              {isRecording ? '🎤 Recording...' : isProcessing ? '⚡ Processing...' : '🎙️ Tap to Speak'}
            </p>
            <p className="text-blue-100">
              {isRecording ? 'Speak clearly and tap the button when done!' : 'Click the microphone and ask me anything!'}
            </p>
          </div>
        </div>
      </Card>

      {/* Smart Tips */}
      <SmartTips tip={currentTip} />

      {/* Emoji Reactions */}
      <EmojiReactions onReaction={(emoji) => setCurrentTip(`Thanks for the ${emoji}! How else can I help?`)} />
    </div>
  );
};
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DavidAvatar } from './DavidAvatar';
import { EmojiReactions } from './EmojiReactions';
import { SmartTips } from './SmartTips';
import { Mic, MicOff, Volume2, RotateCcw, Send, MessageSquare } from 'lucide-react';
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentTip, setCurrentTip] = useState("Click the microphone and start speaking! I can hear you perfectly!");
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [speechRecognitionAvailable, setSpeechRecognitionAvailable] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);

  // Initialize messages based on language
  useEffect(() => {
    const greetings = {
      'en': "Hello there! I'm David, your magical voice tutor! 👨‍🏫 Ask me anything - what would you like to learn today?",
      'hi': "नमस्ते! मैं डेविड हूं, आपका जादुई आवाज ट्यूटर! 👨‍🏫 मुझसे कुछ भी पूछें - आप आज क्या सीखना चाहते हैं?",
      'mr': "नमस्कार! मी डेविड आहे, तुमचा जादुई आवाज शिक्षक! 👨‍🏫 मला काहीही विचारा - तुम्हाला आज काय शिकायचे आहे?",
      'gu': "નમસ્તે! હું ડેવિડ છું, તમારો જાદુઈ અવાજ શિક્ષક! 👨‍🏫 મને કંઈપણ પૂછો - તમે આજે શું શીખવા માંગો છો?",
      'ta': "வணக்கம்! நான் டேவிட், உங்கள் மந்திர குரல் ஆசிரியர்! 👨‍🏫 என்னிடம் எதையும் கேள்வி கேளுங்கள் - நீங்கள் இன்று என்ன கற்க விரும்புகிறீர்கள்?"
    };
    
    const tips = {
      'en': "Click the microphone and start speaking! I can hear you perfectly!",
      'hi': "माइक्रोफोन पर क्लिक करें और बोलना शुरू करें! मैं आपको पूरी तरह से सुन सकता हूं!",
      'mr': "मायक्रोफोनवर क्लिक करा आणि बोलणे सुरू करा! मी तुम्हाला पूर्णपणे ऐकू शकतो!",
      'gu': "માઇક્રોફોન પર ક્લિક કરો અને બોલવાનું શરૂ કરો! હું તમને સંપૂર્ણપણે સાંભળી શકું છું!",
      'ta': "மைக்ரோஃபோனில் கிளிக் செய்து பேசத் தொடங்குங்கள்! நான் உங்களை சரியாகக் கேட்க முடியும்!"
    };

    setMessages([{
      id: '1',
      type: 'ai',
      text: greetings[language as keyof typeof greetings] || greetings['en'],
      timestamp: new Date()
    }]);
    
    setCurrentTip(tips[language as keyof typeof tips] || tips['en']);
    
    // Check if speech recognition is available
    setSpeechRecognitionAvailable('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  }, [language]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const textInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Request microphone permissions on component mount
    requestMicrophonePermission();
    
    // Check browser compatibility
    checkBrowserCompatibility();
  }, []);

  const checkBrowserCompatibility = () => {
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    const isEdge = /Edg/.test(navigator.userAgent);
    const isFirefox = /Firefox/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    
    console.log('Browser detected:', { isChrome, isEdge, isFirefox, isSafari });
    
    // Show browser-specific tips
    if (isEdge) {
      setCurrentTip("Using Edge? Make sure to allow microphone access in site permissions!");
    } else if (isChrome) {
      setCurrentTip("Chrome detected! Speech recognition should work perfectly!");
    } else if (isFirefox) {
      setCurrentTip("Firefox detected! Speech recognition may have limited support.");
    } else if (isSafari) {
      setCurrentTip("Safari detected! Speech recognition support may vary.");
    }
  };

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
      // If already recording, stop recording
      if (isRecording) {
        stopRecording();
        return;
      }

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });
      
      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      const audioChunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        setCurrentTip("Processing your voice...");
        
        // Create audio blob
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        
        // Send to backend for transcription
        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');
          formData.append('language', language);
          
          const response = await fetch('http://localhost:3000/api/voice/transcribe', {
            method: 'POST',
            body: formData
          });
          
          if (!response.ok) {
            throw new Error(`Transcription failed: ${response.status}`);
          }
          
          const result = await response.json();
          
          if (result.success && result.transcript) {
            console.log('Real transcript:', result.transcript);
            processTranscript(result.transcript);
          } else {
            throw new Error('No transcript received');
          }
          
        } catch (error) {
          console.error('Transcription error:', error);
          toast({
            title: "Transcription Failed",
            description: "Could not understand your speech. Please try again.",
            variant: "destructive"
          });
          setCurrentTip("I couldn't understand. Please try speaking again!");
        }
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Store mediaRecorder reference for stopping
      mediaRecorderRef.current = mediaRecorder;
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      setCurrentTip("🎤 Recording... Click again to stop!");
      
    } catch (error) {
      console.error('Recording setup error:', error);
      setIsRecording(false);
      setIsProcessing(false);
      toast({
        title: "Recording Error",
        description: "Couldn't start recording. Please check your microphone permissions!",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setCurrentTip("Processing your voice...");
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    
    const message = textInput.trim();
    setTextInput('');
    await processTranscript(message);
  };

  const toggleTextInput = () => {
    setShowTextInput(!showTextInput);
    if (!showTextInput && textInputRef.current) {
      textInputRef.current.focus();
    }
  };

  const processTranscript = async (transcript: string) => {
    try {
      setIsProcessing(true);
      setCurrentTip("Processing your message...");
      
      if (!transcript || transcript.trim() === '') {
        throw new Error('Could not understand your speech. Please try speaking more clearly.');
      }
      
      // Add user message (transcribed from speech)
      const userMsgId = Date.now().toString();
      setMessages(prev => [...prev, {
        id: userMsgId,
        type: 'user',
        text: transcript,
        timestamp: new Date()
      }]);

      // Prepare conversation history for AI
      const conversationHistory = messages
        .filter(msg => msg.type === 'user' || msg.type === 'ai')
        .map(msg => ({
          type: msg.type,
          text: msg.text
        }));

      // Call backend API for AI response only
      const response = await fetch('http://localhost:3000/api/voice/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userMessage: transcript,
          language: language,
          history: conversationHistory
        })
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get AI response');
      }
      
      // Add AI response
      const aiMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: aiMsgId,
        type: 'ai',
        text: result.aiMessage,
        timestamp: new Date(),
        audioUrl: result.audio ? `data:audio/mpeg;base64,${result.audio}` : undefined
      }]);
      
      // Play AI response audio if available
      if (result.audio) {
        playAIResponse(result.aiMessage);
      }
      
      setCurrentTip("Great! I heard you clearly. What would you like to learn next?");
      
    } catch (error) {
      console.error('Voice processing error:', error);
      toast({
        title: "Voice Processing Error",
        description: error instanceof Error ? error.message : "Failed to process your voice. Please try again.",
        variant: "destructive"
      });
      
      setCurrentTip("I had trouble understanding. Please try speaking again!");
    } finally {
      setIsProcessing(false);
    }
  };

  const testSpeechRecognition = () => {
    // Demo mode test
    toast({
      title: "Demo Voice Test",
      description: "Voice recognition is in demo mode. Click the microphone to test!",
      variant: "default"
    });
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
    const greetings = {
      'en': "Hello there! I'm David, your magical voice tutor! 👨‍🏫 Ask me anything - what would you like to learn today?",
      'hi': "नमस्ते! मैं डेविड हूं, आपका जादुई आवाज ट्यूटर! 👨‍🏫 मुझसे कुछ भी पूछें - आप आज क्या सीखना चाहते हैं?",
      'mr': "नमस्कार! मी डेविड आहे, तुमचा जादुई आवाज शिक्षक! 👨‍🏫 मला काहीही विचारा - तुम्हाला आज काय शिकायचे आहे?",
      'gu': "નમસ્તે! હું ડેવિડ છું, તમારો જાદુઈ અવાજ શિક્ષક! 👨‍🏫 મને કંઈપણ પૂછો - તમે આજે શું શીખવા માંગો છો?",
      'ta': "வணக்கம்! நான் டேவிட், உங்கள் மந்திர குரல் ஆசிரியர்! 👨‍🏫 என்னிடம் எதையும் கேள்வி கேளுங்கள் - நீங்கள் இன்று என்ன கற்க விரும்புகிறீர்கள்?"
    };
    
    const tips = {
      'en': "Ready for a fresh start! What would you like to learn?",
      'hi': "एक नई शुरुआत के लिए तैयार! आप क्या सीखना चाहते हैं?",
      'mr': "नवीन सुरुवातीसाठी तयार! तुम्हाला काय शिकायचे आहे?",
      'gu': "નવી શરૂઆત માટે તૈયાર! તમે શું શીખવા માંગો છો?",
      'ta': "புதிய தொடக்கத்திற்கு தயாராக! நீங்கள் என்ன கற்க விரும்புகிறீர்கள்?"
    };

    setMessages([{
      id: '1',
      type: 'ai',
      text: greetings[language as keyof typeof greetings] || greetings['en'],
      timestamp: new Date()
    }]);
    setCurrentTip(tips[language as keyof typeof tips] || tips['en']);
  };

  const stopRetries = () => {
    setIsRetrying(false);
    setIsRecording(false);
    setIsProcessing(false);
    setShowTextInput(true);
    setCurrentTip("Switched to text mode. You can still chat with David!");
    toast({
      title: "Switched to Text Mode",
      description: "Voice recognition disabled. Use text input to chat with David!",
      variant: "default"
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Chat Header */}
      <Card className="p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <DavidAvatar 
              size="medium" 
              isActive={true} 
              mood={isRecording ? 'listening' : isProcessing ? 'thinking' : 'happy'} 
            />
            <div>
              <h3 className="text-2xl font-bold">
                {language === 'en' ? 'Chat with David!' :
                 language === 'hi' ? 'डेविड के साथ चैट करें!' :
                 language === 'mr' ? 'डेविडसोबत चॅट करा!' :
                 language === 'gu' ? 'ડેવિડ સાથે ચેટ કરો!' :
                 'டேவிட் உடன் அரட்டையடிக்கவும்!'}
              </h3>
              <p className="text-purple-100">
                {isRecording ? 
                  (language === 'en' ? "I'm listening..." :
                   language === 'hi' ? "मैं सुन रहा हूं..." :
                   language === 'mr' ? "मी ऐकत आहे..." :
                   language === 'gu' ? "હું સાંભળી રહ્યો છું..." :
                   "நான் கேட்கிறேன்...") :
                 isProcessing ? 
                  (language === 'en' ? "Thinking..." :
                   language === 'hi' ? "सोच रहा हूं..." :
                   language === 'mr' ? "विचार करत आहे..." :
                   language === 'gu' ? "વિચારી રહ્યો છું..." :
                   "சிந்திக்கிறேன்...") :
                  (language === 'en' ? "Ready to chat!" :
                   language === 'hi' ? "चैट के लिए तैयार!" :
                   language === 'mr' ? "चॅटसाठी तयार!" :
                   language === 'gu' ? "ચેટ માટે તૈયાર!" :
                   "அரட்டைக்கு தயாராக!")}
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
            {language === 'en' ? 'New Chat' :
             language === 'hi' ? 'नई चैट' :
             language === 'mr' ? 'नवीन चॅट' :
             language === 'gu' ? 'નવી ચેટ' :
             'புதிய அரட்டை'}
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
                <DavidAvatar size="small" isActive={true} />
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
                    {language === 'en' ? 'Play Voice' :
                     language === 'hi' ? 'आवाज सुनें' :
                     language === 'mr' ? 'आवाज ऐका' :
                     language === 'gu' ? 'આવાજ સાંભળો' :
                     'குரலை இயக்கவும்'}
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
          {/* Mode Toggle Button */}
          <div className="flex justify-center gap-4 mb-4">
            <Button
              onClick={toggleTextInput}
              variant={showTextInput ? "secondary" : "ghost"}
              className={`px-4 py-2 rounded-full transition-all duration-300 ${
                showTextInput 
                  ? 'bg-white text-blue-600 hover:bg-gray-100' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              {language === 'en' ? 'Text Mode' :
               language === 'hi' ? 'टेक्स्ट मोड' :
               language === 'mr' ? 'टेक्स्ट मोड' :
               language === 'gu' ? 'ટેક્સ્ટ મોડ' :
               'உரை பயன்முறை'}
            </Button>
            
            <Button
              onClick={testSpeechRecognition}
              variant="ghost"
              className="px-4 py-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all duration-300"
            >
              🎤 Test Voice
            </Button>
            
            {isRetrying && (
              <Button
                onClick={stopRetries}
                variant="ghost"
                className="px-4 py-2 rounded-full bg-red-500/20 text-red-200 hover:bg-red-500/30 transition-all duration-300"
              >
                ⏹️ Stop Retries
              </Button>
            )}
          </div>

          {/* Text Input Mode */}
          {showTextInput && (
            <div className="space-y-4">
              <form onSubmit={handleTextSubmit} className="flex gap-2">
                <Input
                  ref={textInputRef}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={
                    language === 'en' ? 'Type your message here...' :
                    language === 'hi' ? 'यहां अपना संदेश टाइप करें...' :
                    language === 'mr' ? 'येथे तुमचा संदेश टाइप करा...' :
                    language === 'gu' ? 'અહીં તમારો સંદેશ ટાઇપ કરો...' :
                    'இங்கே உங்கள் செய்தியை தட்டச்சு செய்யவும்...'
                  }
                  className="flex-1 bg-white/90 text-gray-800 placeholder-gray-500 border-0 rounded-full px-4 py-3"
                  disabled={isProcessing}
                />
                <Button
                  type="submit"
                  disabled={!textInput.trim() || isProcessing}
                  className="bg-white text-blue-600 hover:bg-gray-100 rounded-full px-6 py-3"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </form>
              <p className="text-blue-100 text-sm">
                {language === 'en' ? 'Type your question and press Enter or click Send!' :
                 language === 'hi' ? 'अपना प्रश्न टाइप करें और Enter दबाएं या Send पर क्लिक करें!' :
                 language === 'mr' ? 'तुमचा प्रश्न टाइप करा आणि Enter दाबा किंवा Send वर क्लिक करा!' :
                 language === 'gu' ? 'તમારો પ્રશ્ન ટાઇપ કરો અને Enter દબાવો અથવા Send પર ક્લિક કરો!' :
                 'உங்கள் கேள்வியை தட்டச்சு செய்து Enter அழுத்தவும் அல்லது Send கிளிக் செய்யவும்!'}
              </p>
            </div>
          )}

          {/* Voice Mode */}
          {!showTextInput && (
            <>
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
                  {isRecording ? 
                    (language === 'en' ? '🎤 Recording...' :
                     language === 'hi' ? '🎤 रिकॉर्डिंग...' :
                     language === 'mr' ? '🎤 रेकॉर्डिंग...' :
                     language === 'gu' ? '🎤 રેકોર્ડિંગ...' :
                     '🎤 பதிவு செய்கிறது...') :
                   isProcessing ? 
                    (language === 'en' ? '⚡ Processing...' :
                     language === 'hi' ? '⚡ प्रोसेसिंग...' :
                     language === 'mr' ? '⚡ प्रक्रिया...' :
                     language === 'gu' ? '⚡ પ્રક્રિયા...' :
                     '⚡ செயலாக்குகிறது...') :
                    (language === 'en' ? '🎙️ Tap to Speak' :
                     language === 'hi' ? '🎙️ बोलने के लिए टैप करें' :
                     language === 'mr' ? '🎙️ बोलण्यासाठी टॅप करा' :
                     language === 'gu' ? '🎙️ બોલવા માટે ટેપ કરો' :
                     '🎙️ பேச டேப் செய்யவும்')}
                </p>
                <p className="text-blue-100">
                  {isRecording ? 
                    (language === 'en' ? 'Speak clearly and tap the button when done!' :
                     language === 'hi' ? 'स्पष्ट बोलें और जब हो जाए तो बटन टैप करें!' :
                     language === 'mr' ? 'स्पष्ट बोला आणि झाल्यावर बटण टॅप करा!' :
                     language === 'gu' ? 'સ્પષ્ટ બોલો અને થઈ જાય ત્યારે બટન ટેપ કરો!' :
                     'தெளிவாக பேசுங்கள் மற்றும் முடிந்ததும் பொத்தானை டேப் செய்யவும்!') :
                    (language === 'en' ? 'Click the microphone and ask me anything!' :
                     language === 'hi' ? 'माइक्रोफोन पर क्लिक करें और मुझसे कुछ भी पूछें!' :
                     language === 'mr' ? 'मायक्रोफोनवर क्लिक करा आणि मला काहीही विचारा!' :
                     language === 'gu' ? 'માઇક્રોફોન પર ક્લિક કરો અને મને કંઈપણ પૂછો!' :
                     'மைக்ரோஃபோனில் கிளிக் செய்து என்னிடம் எதையும் கேள்வி கேளுங்கள்!')}
                </p>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Smart Tips */}
      <SmartTips tip={currentTip} />

      {/* Emoji Reactions */}
      <EmojiReactions onReaction={(emoji) => setCurrentTip(`Thanks for the ${emoji}! How else can I help?`)} />
    </div>
  );
};
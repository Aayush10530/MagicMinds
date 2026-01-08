import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DavidAvatar } from './DavidAvatar';
import { EmojiReactions } from './EmojiReactions';
import { SmartTips } from './SmartTips';
import { Mic, MicOff, Volume2, RotateCcw, Send, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createAudioRecorder, AudioRecorder } from '@/lib/audioUtils';

interface VoiceChatProps {
  language: string;
  onSessionComplete: () => void;
  scenarioContext?: string; // "School", "Store", "Home"
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  text: string;
  timestamp: Date;
  audioUrl?: string;
}

// Strict State Machine
type ConversationState = 'IDLE' | 'GREETING' | 'LISTENING' | 'PROCESSING' | 'SPEAKING';

export const VoiceChat = ({ language, onSessionComplete, scenarioContext = "Home" }: VoiceChatProps) => {
  const [currentState, setCurrentState] = useState<ConversationState>('IDLE');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentTip, setCurrentTip] = useState("Initializing...");
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState('');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // --- Constants & Config ---

  const getLanguageName = (lang: string) => {
    const names: Record<string, string> = { 'en': 'English', 'hi': 'Hindi', 'mr': 'Marathi', 'gu': 'Gujarati', 'ta': 'Tamil' };
    return names[lang] || 'English';
  };

  const getSystemConfig = () => {
    // This allows backend to know which system prompt to use
    // Using simple mapping for now, backend will handle the prompt text
    return {
      language,
      role: scenarioContext.toLowerCase() // "school", "store", "home"
    };
  };

  // --- Audio Playback Control ---

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  }, []);

  const playAudio = useCallback((base64Audio: string): Promise<void> => {
    return new Promise((resolve) => {
      stopAudio();
      const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
      audioRef.current = audio;

      setCurrentState('SPEAKING');

      audio.onended = () => {
        resolve();
      };

      audio.onerror = (e) => {
        console.error("Audio playback error", e);
        resolve(); // Continue even if audio fails
      };

      audio.play().catch(e => {
        console.error("Audio play failed", e);
        resolve();
      });
    });
  }, [stopAudio]);

  // --- API Interactions ---

  const fetchTTS = async (text: string): Promise<string | null> => {
    try {
      const token = localStorage.getItem('token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('http://localhost:3000/api/voice/tts', {
        method: 'POST',
        headers,
        body: JSON.stringify({ text, language })
      });

      const data = await res.json();
      if (data.success && data.audio) {
        return data.audio;
      }
      return null;
    } catch (err) {
      console.error("TTS fetch failed", err);
      return null;
    }
  };

  const sendAudioToBackend = async (audioBlob: Blob): Promise<{ text: string }> => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');
    formData.append('language', language);

    const token = localStorage.getItem('token');
    const headers: any = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('http://localhost:3000/api/voice/transcribe', {
      method: 'POST',
      headers,
      body: formData
    });

    if (!res.ok) throw new Error(`Transcription failed: ${res.status}`);
    const data = await res.json();
    if (!data.success || !data.transcript) throw new Error('No transcript received');
    return { text: data.transcript };
  };

  const sendChatToBackend = async (userText: string, history: any[]) => {
    const token = localStorage.getItem('token');
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('http://localhost:3000/api/voice/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        userMessage: userText,
        ...getSystemConfig(),
        history
      })
    });

    if (!res.ok) throw new Error(`Chat API failed: ${res.status}`);
    return await res.json();
  };

  // --- Core Logic ---

  const handleAIResponse = async (text: string, audioData?: string) => {
    // Add AI message to UI
    const aiMsgId = Date.now().toString();
    setMessages(prev => [...prev, {
      id: aiMsgId,
      type: 'ai',
      text: text,
      timestamp: new Date(),
      audioUrl: audioData ? `data:audio/mp3;base64,${audioData}` : undefined
    }]);

    // Play Audio
    let audioToPlay = audioData;
    if (!audioToPlay) {
      audioToPlay = await fetchTTS(text) || undefined;
    }

    if (audioToPlay) {
      await playAudio(audioToPlay);
    }

    // After audio finishes, go to IDLE (or LISTENING if auto-turn is enabled, but kept IDLE for safety)
    // Actually, per requirements: "Only after audio ends, enable the microphone."
    // We will set to IDLE, and user can tap mic.
    // OPTIONAL: If we want continuous convo, we could go straight to LISTENING here.
    // For now, IDLE is safer and strictly follows "enable the microphone" (implies it's available).
    setCurrentState('IDLE');
    setCurrentTip("Your turn! Click the mic to speak.");
  };

  const processUserAudio = async (audioBlob: Blob) => {
    setCurrentState('PROCESSING');
    setCurrentTip("Listening to what you said...");

    try {
      // 1. STT
      const { text } = await sendAudioToBackend(audioBlob);

      if (!text || text.trim().length === 0) {
        throw new Error("I couldn't hear you clearly.");
      }

      // Add user message
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'user',
        text: text,
        timestamp: new Date()
      }]);

      // 2. Chat with LLM
      setCurrentTip("Thinking of a response...");

      const history = messages.map(m => ({ type: m.type, text: m.text }));
      const chatResult = await sendChatToBackend(text, history);

      if (!chatResult.success) throw new Error(chatResult.error || "Brain freeze!");

      // 3. Response & TTS
      await handleAIResponse(chatResult.aiMessage, chatResult.audio);

    } catch (error: any) {
      console.error("Processing error", error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong.",
        variant: "destructive"
      });
      setCurrentState('IDLE');
      setCurrentTip("Oops! Something went wrong. Try again.");
    }
  };

  const startRecording = async () => {
    if (currentState !== 'IDLE') return;

    try {
      recorderRef.current = createAudioRecorder();
      await recorderRef.current.start();
      setCurrentState('LISTENING');
      setCurrentTip("I'm listening...");
    } catch (error) {
      toast({ title: "Mic Error", description: "Could not start recording.", variant: "destructive" });
    }
  };

  const stopRecording = async () => {
    if (currentState !== 'LISTENING' || !recorderRef.current) return;

    try {
      setCurrentState('PROCESSING');
      const audioBlob = await recorderRef.current.stop();

      // Validation
      if (audioBlob.size < 1000) { // arbitrary small size check
        throw new Error("Recording too short. Please speak more.");
      }

      await processUserAudio(audioBlob);

    } catch (error: any) {
      console.error(error);
      toast({ title: "Recording Error", description: error.message, variant: "destructive" });
      setCurrentState('IDLE');
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || currentState === 'PROCESSING') return;

    const text = textInput.trim();
    setTextInput('');
    setCurrentState('PROCESSING');

    try {
      // Add user message immediately
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'user',
        text: text,
        timestamp: new Date()
      }]);

      const history = messages.map(m => ({ type: m.type, text: m.text }));
      const chatResult = await sendChatToBackend(text, history);

      if (!chatResult.success) throw new Error(chatResult.error);

      await handleAIResponse(chatResult.aiMessage, chatResult.audio);

    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setCurrentState('IDLE');
    }
  };

  // --- Initial Greeting ---

  useEffect(() => {
    const initGreeting = async () => {
      // Reset state
      setMessages([]);
      setCurrentState('GREETING');
      setCurrentTip(`David is getting ready... (${scenarioContext})`);

      // Default greetings based on language
      const greetings: Record<string, string> = {
        'en': "Hello! I'm David. Let's talk!",
        'hi': "नमस्ते! मैं डेविड हूं। चलिए बात करते हैं!",
        'mr': "नमस्कार! मी डेविड आहे. चला बोलूया!",
        'gu': "નમસ્તે! હું ડેવિડ છું. ચાલો વાત કરીએ!",
        'ta': "வணக்கம்! நான் டேவிட். பேசலாம்!"
      };

      const greetingText = greetings[language] || greetings['en'];

      // Add to messages
      setMessages([{
        id: 'init',
        type: 'ai',
        text: greetingText,
        timestamp: new Date()
      }]);

      // Fetch and Play Audio
      const audio = await fetchTTS(greetingText);
      if (audio) {
        await playAudio(audio);
      } else {
        // Just fail silently to IDLE if TTS fails on init
        setCurrentState('IDLE');
      }

      // Ensure we end up in IDLE after greeting plays (playAudio handles state internally but we ensure here)
      setCurrentState('IDLE');
      setCurrentTip("Click the mic to start talking!");
    };

    initGreeting();
    // Cleanup on unmount or lang change
    return () => {
      stopAudio();
    };
  }, [language, scenarioContext, stopAudio]);

  // --- Render Helpers ---

  const getStatusColor = () => {
    switch (currentState) {
      case 'IDLE': return 'bg-green-500 hover:bg-green-600';
      case 'LISTENING': return 'bg-red-500 hover:bg-red-600 animate-pulse';
      case 'PROCESSING': return 'bg-yellow-500 cursor-wait';
      case 'SPEAKING': return 'bg-blue-500 cursor-wait'; // specific color for speaking
      case 'GREETING': return 'bg-blue-400 cursor-wait';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (currentState) {
      case 'IDLE': return <Mic className="w-12 h-12" />;
      case 'LISTENING': return <MicOff className="w-12 h-12" />;
      case 'PROCESSING': return <div className="text-xl font-bold">...</div>;
      case 'SPEAKING': return <Volume2 className="w-12 h-12 animate-bounce" />;
      case 'GREETING': return <Volume2 className="w-12 h-12 animate-bounce" />;
      default: return <Mic className="w-12 h-12" />;
    }
  };

  const canInteract = currentState === 'IDLE' || currentState === 'LISTENING';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <DavidAvatar
              size="medium"
              isActive={currentState === 'SPEAKING' || currentState === 'GREETING'}
              mood={currentState === 'LISTENING' ? 'listening' : currentState === 'PROCESSING' ? 'thinking' : 'happy'}
            />
            <div>
              <h3 className="text-2xl font-bold">
                {getLanguageName(language)} Chat ({scenarioContext})
              </h3>
              <p className="text-purple-100">
                Current Status: {currentState}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onSessionComplete}
            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            End Session
          </Button>
        </div>
      </Card>

      {/* Messages */}
      <Card className="p-6 bg-white/90 backdrop-blur border-purple-200 min-h-[400px]">
        <div className="space-y-4 max-h-96 overflow-y-auto flex flex-col-reverse">
          {[...messages].reverse().map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type === 'ai' && (
                <DavidAvatar size="small" isActive={false} />
              )}
              <div className={`chat-bubble ${message.type === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>
                <p className="text-lg leading-relaxed">{message.text}</p>
              </div>
              {message.type === 'user' && (
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">👤</div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Controls */}
      <Card className="p-8 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
        <div className="text-center space-y-6">
          <div className="flex justify-center gap-4 mb-4">
            <Button
              onClick={() => setShowTextInput(!showTextInput)}
              variant="ghost"
              className="bg-white/20 text-white hover:bg-white/30 rounded-full"
            >
              <MessageSquare className="w-4 h-4 mr-2" /> {showTextInput ? "Voice Mode" : "Text Mode"}
            </Button>
          </div>

          {showTextInput ? (
            <form onSubmit={handleTextSubmit} className="flex gap-2">
              <Input
                ref={textInputRef}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type here..."
                className="bg-white/90 text-black rounded-full"
                disabled={currentState === 'PROCESSING'}
              />
              <Button type="submit" className="rounded-full bg-white text-blue-600">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <Button
                onClick={currentState === 'LISTENING' ? stopRecording : startRecording}
                disabled={!canInteract}
                className={`w-24 h-24 rounded-full border-4 border-white transition-all ${getStatusColor()}`}
              >
                {getStatusIcon()}
              </Button>
              <p className="text-xl font-bold">{currentTip}</p>
            </div>
          )}
        </div>
      </Card>

      <SmartTips tip={currentTip} />
    </div>
  );
};
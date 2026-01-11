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

// Default to relative path in prod (for Vercel proxy), fallback to localhost only if strictly needed
const API_URL = import.meta.env.VITE_API_URL || '';

interface VoiceChatProps {
  language: string;
  userName: string;
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

export const VoiceChat = ({ language, userName, onSessionComplete, scenarioContext = "Home" }: VoiceChatProps) => {
  // --- STATE ---
  const [currentState, setCurrentState] = useState<ConversationState>('IDLE');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentTip, setCurrentTip] = useState("Initializing...");
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState('');

  // --- REFS ---
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  const getLanguageName = (lang: string) => {
    const names: Record<string, string> = { 'en': 'English', 'hi': 'Hindi', 'mr': 'Marathi', 'gu': 'Gujarati', 'ta': 'Tamil' };
    return names[lang] || 'English';
  };

  // --- CLEANUP ---

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  }, []);

  const endSession = useCallback(() => {
    // 1. Abort Fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // 2. Stop Audio
    stopAudio();
    // 3. Stop Mic
    if (recorderRef.current) {
      // Force stop if possible, though lib might not expose it easily synchronously
      // We assume calling stop() returns promise, we don't await strictly for UI reset
      recorderRef.current.stop().catch(() => { });
      recorderRef.current = null;
    }

    // 4. Return to parent
    onSessionComplete();
  }, [onSessionComplete, stopAudio]);

  // --- PLAYBACK ---

  const playAudio = useCallback((base64Audio: string): Promise<void> => {
    return new Promise((resolve) => {
      stopAudio();
      const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
      audioRef.current = audio;

      setCurrentState('SPEAKING');

      audio.onended = () => {
        resolve(); // State management handled by caller or effect
      };

      audio.onerror = (e) => {
        console.error("Audio playback error", e);
        resolve();
      };

      audio.play().catch(e => {
        console.error("Audio play failed", e);
        resolve();
      });
    });
  }, [stopAudio]);


  // --- API Interactions ---

  const startSession = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch(API_URL + '/api/voice/session/start', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          type: 'chat',
          language,
          scenarioContext
        })
      });

    } catch (e) {
      console.error("Failed to start session:", e);
      toast({ title: "Connection Error", description: "Could not start voice session.", variant: "destructive" });
    }
  };

  const fetchGreeting = async (text: string): Promise<string | null> => {
    try {
      const token = localStorage.getItem('token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(API_URL + '/api/voice/tts', {
        method: 'POST',
        headers,
        body: JSON.stringify({ text, language })
      });

      const data = await res.json();
      if (data.success && data.audio) return data.audio;
      return null;
    } catch (err) {
      console.error("TTS fetch failed", err);
      return null;
    }
  };

  const sendAudioToBackend = async (audioBlob: Blob): Promise<any> => {
    if (!abortControllerRef.current) abortControllerRef.current = new AbortController();

    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');

    // We don't need to append language/scenario here anymore as Session controls it, 
    // but legacy compat might expect it? No, voice.js relies on getActiveSession.
    // However, we MUST authenticate.
    const token = localStorage.getItem('token');
    const headers: any = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(API_URL + '/api/voice/chat', {
      method: 'POST',
      headers,
      body: formData,
      signal: abortControllerRef.current.signal
    });

    if (!res.ok) throw new Error(`Server Error: ${res.status}`);
    return await res.json();
  };

  const sendTextToBackend = async (text: string) => {
    if (!abortControllerRef.current) abortControllerRef.current = new AbortController();

    const token = localStorage.getItem('token');
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(API_URL + '/api/voice/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify({ userMessage: text }),
      signal: abortControllerRef.current.signal
    });

    if (!res.ok) throw new Error(`Server Error: ${res.status}`);
    return await res.json();
  };

  // --- Core Processing Loop ---

  const handleInteraction = async (input: Blob | string) => {
    setCurrentState('PROCESSING');
    setCurrentTip(typeof input === 'string' ? "David is thinking..." : "Listening to what you said...");

    try {
      let result;
      if (input instanceof Blob) {
        result = await sendAudioToBackend(input);
      } else {
        result = await sendTextToBackend(input);
      }

      if (!result.success) throw new Error(result.error || "Unknown Error");

      const { replyText, audio, userTranscript, aiMessage } = result;

      // 1. Add User Message (if voice input was used)
      if (input instanceof Blob && userTranscript) {
        setMessages(prev => [...prev, {
          id: Date.now().toString() + '_user',
          type: 'user',
          text: userTranscript,
          timestamp: new Date()
        }]);
      }

      // 2. Add AI Message
      const finalText = replyText || aiMessage; // Handle chat vs roleplay field names
      setMessages(prev => [...prev, {
        id: Date.now().toString() + '_ai',
        type: 'ai',
        text: finalText,
        timestamp: new Date(),
        audioUrl: audio ? `data:audio/mp3;base64,${audio}` : undefined
      }]);

      if (audio) {
        await playAudio(audio);
      } else if (replyText) {
        // Fallback logic for Missing Audio?? 
        // Constraint: "If Sarvam TTS fails... Do NOT fallback to browser TTS"
        // Value Judgment: Better to show text and stay silent than break the rule.
        toast({ title: "Voice Unavailable", description: "I'm having trouble speaking right now, but I can still write!" });
      }

    } catch (error: any) {
      console.error("Interaction Error:", error);
      toast({ title: "Error", description: error.message || "Something went wrong", variant: "destructive" });
    } finally {
      // Always return to safe state
      setCurrentState('IDLE');
      setCurrentTip("Your turn! Click the mic to speak.");
    }
  };

  // --- Recording ---

  const startRecording = async () => {
    if (currentState !== 'IDLE') return;
    try {
      recorderRef.current = createAudioRecorder();
      await recorderRef.current.start();
      setCurrentState('LISTENING');
      setCurrentTip("I'm listening...");
    } catch (error) {
      toast({ title: "Mic Error", description: "Could not start recording.", variant: "destructive" });
      setCurrentState('IDLE');
    }
  };

  const stopRecording = async () => {
    if (currentState !== 'LISTENING' || !recorderRef.current) return;
    try {
      const audioBlob = await recorderRef.current.stop();
      if (audioBlob.size < 1000) throw new Error("Too short");

      // Optimization: Optimistic UI update (User Message)
      // Note: We don't have text yet for audio input. We rely on backend return.
      // Or we could trigger processing immediately.

      await handleInteraction(audioBlob);

    } catch (error: any) {
      // Silent fail for "Too short" or cancel
      setCurrentState('IDLE');
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || currentState !== 'IDLE') return;
    const text = textInput.trim();
    setTextInput('');

    // Add User Message Immediately
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'user',
      text: text,
      timestamp: new Date()
    }]);

    await handleInteraction(text);
  };

  // --- Lifecycle & Init ---

  useEffect(() => {
    const init = async () => {
      stopAudio();
      setMessages([]);
      setCurrentState('GREETING');
      setCurrentTip("David is getting ready...");

      // 1. Initialize Session on Backend
      await startSession();

      // 2. Greeting Logic
      const greetingMap: Record<string, string> = {
        'en': `Hello ${userName}, I am David. What do you want to learn or chat about?`,
        'hi': `नमस्ते ${userName}, मैं डेविड हूं। आप क्या सीखना या बात करना चाहते हैं?`,
        'mr': `नमस्कार ${userName}, मी डेविड आहे. तुम्हाला काय शिकायचे किंवा बोलायचे आहे?`,
        'gu': `નમસ્તે ${userName}, હું ડેવિડ છું. તમે શું શીખવા અથવા વાત કરવા માંગો છો?`,
        'ta': `வணக்கம் ${userName}, நான் டேவிட். நீங்கள் என்ன கற்க அல்லது பேச விரும்புகிறீர்கள்?`
      };
      const text = greetingMap[language] || greetingMap['en'];

      // Add Greeting Message
      setMessages([{ id: 'init', type: 'ai', text, timestamp: new Date() }]);

      // Fetch & Play Greeting Audio
      const audio = await fetchGreeting(text);
      if (audio) {
        await playAudio(audio);
      }

      // Ready
      setCurrentState('IDLE');
      setCurrentTip("Click the mic to start talking!");
    };

    init();

    return () => {
      stopAudio();
    };
  }, [language, scenarioContext]); // re-run if scenario changes

  // --- Rendering (Same as before) ---
  const getStatusColor = () => {
    switch (currentState) {
      case 'IDLE': return 'bg-green-500 hover:bg-green-600';
      case 'LISTENING': return 'bg-red-500 hover:bg-red-600 animate-pulse';
      case 'PROCESSING': return 'bg-yellow-500 cursor-wait';
      case 'SPEAKING': return 'bg-blue-500 cursor-wait';
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
              <h3 className="text-2xl font-bold">{getLanguageName(language)} Chat</h3>
              <p className="text-purple-100">Status: {currentState}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={endSession} className="bg-white/20 border-white/30 text-white hover:bg-white/30">
            <RotateCcw className="w-4 h-4 mr-2" /> End Session
          </Button>
        </div>
      </Card>

      {/* Messages */}
      <Card className="p-6 bg-white/90 backdrop-blur border-purple-200 min-h-[400px]">
        <div className="space-y-4 max-h-96 overflow-y-auto flex flex-col-reverse">
          {[...messages].reverse().map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.type === 'ai' && <DavidAvatar size="small" isActive={false} />}
              <div className={`chat-bubble ${msg.type === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>
                <p className="text-lg leading-relaxed">{msg.text}</p>
              </div>
              {msg.type === 'user' && <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">👤</div>}
            </div>
          ))}
        </div>
      </Card>

      {/* Controls */}
      <Card className="p-8 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
        <div className="text-center space-y-6">
          <div className="flex justify-center gap-4 mb-4">
            <Button onClick={() => setShowTextInput(!showTextInput)} variant="ghost" className="bg-white/20 text-white hover:bg-white/30 rounded-full">
              <MessageSquare className="w-4 h-4 mr-2" /> {showTextInput ? "Voice Mode" : "Text Mode"}
            </Button>
          </div>

          {showTextInput ? (
            <form onSubmit={handleTextSubmit} className="flex gap-2">
              <Input ref={textInputRef} value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Type here..." className="bg-white/90 text-black rounded-full" disabled={!canInteract} />
              <Button type="submit" className="rounded-full bg-white text-blue-600"><Send className="w-4 h-4" /></Button>
            </form>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <Button onClick={currentState === 'LISTENING' ? stopRecording : startRecording} disabled={!canInteract} className={`w-24 h-24 rounded-full border-4 border-white transition-all ${getStatusColor()}`}>
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
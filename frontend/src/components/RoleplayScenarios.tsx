import { useState, useRef, useEffect, useCallback } from 'react';
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
      { id: '1', aiPrompt: "Good morning! Welcome to our classroom! What's your name?", tips: "Say your name clearly!" },
      { id: '2', aiPrompt: "Nice to meet you! Do you like coming to school?", tips: "You can say 'Yes, I like school!'" },
      { id: '3', aiPrompt: "That's wonderful! What's your favorite subject?", tips: "Think about subjects like Math or Art!" }
    ]
  },
  {
    id: 'store',
    title: 'At the Store',
    icon: <ShoppingCart className="w-8 h-8" />,
    description: 'Learn to shop and talk to shopkeepers!',
    background: 'from-green-400 to-green-600',
    steps: [
      { id: '1', aiPrompt: "Welcome to our store! How can I help you today?", tips: "Say 'I want to buy...'!" },
      { id: '2', aiPrompt: "That's a great choice! How many would you like?", tips: "Use numbers like 'one' or 'two'!" },
      { id: '3', aiPrompt: "Perfect! Here's your order. Have a great day!", tips: "Say 'Thank you'!" }
    ]
  },
  {
    id: 'home',
    title: 'At Home',
    icon: <Home className="w-8 h-8" />,
    description: 'Practice family conversations!',
    background: 'from-orange-400 to-orange-600',
    steps: [
      { id: '1', aiPrompt: "Hi there! Who do you live with at home?", tips: "Mention your family members!" },
      { id: '2', aiPrompt: "That sounds lovely! Do you help at home?", tips: "Talk about chores!" },
      { id: '3', aiPrompt: "You're a good helper! What's your favorite game?", tips: "Share what you like to play!" }
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

  // Refs for cleanup
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null); // Track recorder to stop it

  // --- SAFE GUARDS ---
  const currentStepData = selectedScenario?.steps?.[currentStep];

  // --- CLEANUP ---
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  const stopEverything = useCallback(() => {
    // 1. Abort fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // 2. Stop Audio
    stopAudio();
    // 3. Stop Mic
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsProcessing(false);
  }, [stopAudio]);

  // Cleanup on unmount or scenario change
  useEffect(() => {
    return () => stopEverything();
  }, [stopEverything, selectedScenario]);

  // --- TTS ---
  const playAudio = useCallback((base64Audio: string) => {
    stopAudio(); // Stop previous
    const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
    audioRef.current = audio;
    audio.play().catch(e => console.error("Audio play failed", e));
  }, [stopAudio]);

  const fetchAndPlayTTS = async (text: string) => {
    // Abort previous TTS fetch if any? No, let's just facilitate user action.
    try {
      const token = localStorage.getItem('token');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('http://localhost:3000/api/voice/tts', {
        method: 'POST',
        headers,
        body: JSON.stringify({ text, language }) // ALWAYS pass language
      });
      const data = await res.json();
      if (data.success && data.audio) {
        playAudio(data.audio);
      }
    } catch (e) {
      console.error("TTS Error", e);
    }
  };

  // --- SESSION INIT ---
  // Start session ONLY when scenario is selected. 
  // STRICT RULE: No auto-start on mount. But here "selection" IS the explicit user action.
  useEffect(() => {
    if (selectedScenario) {
      const initSession = async () => {
        try {
          const token = localStorage.getItem('token');
          const headers: any = { 'Content-Type': 'application/json' };
          if (token) headers['Authorization'] = `Bearer ${token}`;

          await fetch('http://localhost:3000/api/voice/session/start', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              type: 'roleplay',
              language,
              scenarioId: selectedScenario.id,
              scenarioContext: selectedScenario.title
            })
          });

          // STRICT RULE: David Greets Once. 
          // We can auto-play the FIRST prompt because the user explicitly clicked "Start".
          if (selectedScenario.steps[0]) {
            fetchAndPlayTTS(selectedScenario.steps[0].aiPrompt);
          }
        } catch (e) { console.error("Session Start Error", e); }
      };
      initSession();
    }
  }, [selectedScenario, language]);

  // --- INTERACTION HANDLER ---
  const handleInteraction = async (input: string | Blob) => {
    if (!selectedScenario || !currentStepData) return;

    // 1. Stop any current output
    stopAudio();

    // 2. Set Processing
    setIsProcessing(true);
    abortControllerRef.current = new AbortController();

    try {
      const token = localStorage.getItem('token');
      let headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let body;
      if (typeof input === 'string') {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify({
          userMessage: input,
          language, // MANDATORY
          scenarioId: selectedScenario.id,
          currentPrompt: currentStepData.aiPrompt
        });
        // Update UI immediately for text
        setUserResponses(prev => {
          const newArr = [...prev];
          newArr[currentStep] = input;
          return newArr;
        });
      } else {
        const formData = new FormData();
        formData.append('audio', input, 'recording.webm');
        formData.append('language', language); // MANDATORY
        formData.append('scenarioId', selectedScenario.id);
        formData.append('currentPrompt', currentStepData.aiPrompt);
        body = formData;
        // UI Update for audio happens after/during? We'll put filler.
        setUserResponses(prev => {
          const newArr = [...prev];
          newArr[currentStep] = "(Audio Response)";
          return newArr;
        });
      }

      const res = await fetch('http://localhost:3000/api/voice/roleplay', {
        method: 'POST',
        headers,
        body,
        signal: abortControllerRef.current.signal
      });

      const data = await res.json();

      if (data.success) {
        // 3. David Responds
        if (data.audio) playAudio(data.audio);
        else if (data.aiMessage) fetchAndPlayTTS(data.aiMessage);

        // 4. WAIT FOR USER INPUT -> Advance Step Logic?
        // STRICT RULE: "Do NOT auto-advance steps... Role play progresses naturally".
        // We will advance the step POINTER so the NEXT interaction uses the NEXT prompt logic.
        // But we do NOT trigger AI to speak the next prompt automatically.
        if (currentStep < selectedScenario.steps.length - 1) {
          setCurrentStep(prev => prev + 1);
        } else {
          toast({ title: "Scenario Complete!", description: "You finished all steps!" });
          // Do not close. Let user decide to exit.
        }
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error(e);
        toast({ title: "Error", description: "Interaction failed", variant: "destructive" });
      }
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  };

  const handleTextSubmit = () => {
    if (!textInput.trim()) return;
    handleInteraction(textInput);
    setTextInput('');
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.push(e.data); };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        if (audioBlob.size > 1000) {
          handleInteraction(audioBlob);
        }
        stream.getTracks().forEach(t => t.stop());
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (e) {
      toast({ title: "Mic Error", description: "Could not access microphone" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const resetScenario = () => {
    stopEverything();
    setSelectedScenario(null);
    setCurrentStep(0);
    setUserResponses([]);
  };

  // --- RENDER ---
  // Selection Screen
  if (!selectedScenario) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6">
          {scenarios.map((scenario) => (
            <Card key={scenario.id} className={`p-6 cursor-pointer bg-gradient-to-br ${scenario.background} text-white`} onClick={() => setSelectedScenario(scenario)}>
              <div className="text-center space-y-4">
                <div className="flex justify-center">{scenario.icon}</div>
                <h3 className="text-2xl font-bold">{scenario.title}</h3>
                <p className="text-white/90">{scenario.description}</p>
                <Button variant="outline" className="w-full text-black"><Play className="w-4 h-4 mr-2" /> Start</Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Active Scenario Screen
  if (!currentStepData) return <div>Loading...</div>; // Safety Guard

  const progress = ((currentStep + 1) / selectedScenario.steps.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className={`p-6 bg-gradient-to-r ${selectedScenario.background} text-white border-0`}>
        <div className="flex justify-between items-center">
          <div className="flex gap-4 items-center">
            <div className="p-3 bg-white/20 rounded-full">{selectedScenario.icon}</div>
            <div><h2 className="text-3xl font-bold">{selectedScenario.title}</h2><p>Step {currentStep + 1} of {selectedScenario.steps.length}</p></div>
          </div>
          <Button variant="outline" onClick={resetScenario} className="text-black"><ArrowLeft className="mr-2 h-4 w-4" /> Exit</Button>
        </div>
        <Progress value={progress} className="mt-4 h-3 bg-white/20" />
      </Card>

      <Card className="p-8 bg-white/90 backdrop-blur">
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <DavidAvatar size="medium" isActive={true} mood="happy" />
            <div className="flex-1">
              {/* Always show CURRENT prompt text, even if we are waiting for user input for it */}
              <div className="chat-bubble chat-bubble-ai text-xl">{currentStepData.aiPrompt}</div>
              <Button variant="ghost" size="sm" onClick={() => fetchAndPlayTTS(currentStepData.aiPrompt)} className="mt-2 text-purple-600">
                <Play className="w-4 h-4 mr-2" /> Replay Audio
              </Button>
            </div>
          </div>

          {/* Show previous answer if we are sticking to step? 
                Actually, if we advance step immediately, this UI will show NEW step.
                So previous user response is gone?
                Better: Show history? Or just simple drill mode.
                Simple Drill: New Step = Clean Slate.
            */}
        </div>
      </Card>

      <Card className={`p-8 bg-gradient-to-r ${selectedScenario.background} text-white border-0`}>
        <div className="text-center space-y-6">
          <div className="flex flex-col items-center gap-4">
            {showKeyboard ? (
              <div className="w-full max-w-lg space-y-4">
                <Textarea value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Type answer..." className="text-black text-lg p-4" />
                <div className="flex gap-4 justify-center">
                  <Button onClick={handleTextSubmit} disabled={isProcessing} className="bg-white text-purple-600 font-bold px-8 py-4">Send 🚀</Button>
                  <Button variant="outline" onClick={() => setShowKeyboard(false)} className="text-white border-white">Use Voice</Button>
                </div>
              </div>
            ) : (
              <>
                <Button onClick={isRecording ? stopRecording : startRecording} disabled={isProcessing && !isRecording} className={`w-24 h-24 rounded-full border-4 border-white ${isRecording ? 'bg-red-500' : 'bg-green-500'}`}>
                  {isRecording ? <MicOff className="w-12 h-12" /> : <Mic className="w-12 h-12" />}
                </Button>
                <p className="text-xl font-bold">{isRecording ? 'Recording...' : isProcessing ? 'Processing...' : 'Your Turn!'}</p>
                <button onClick={() => setShowKeyboard(true)} className="underline text-sm">Use Keyboard</button>
              </>
            )}
          </div>
        </div>
      </Card>

      <SmartTips tip={currentStepData.tips} type="encouragement" />
    </div>
  );
};
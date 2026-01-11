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

const API_URL = import.meta.env.VITE_API_URL || '';

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

const getScenarios = (lang: string): RoleplayScenario[] => {
  const isHindi = lang === 'hi';
  const isMarathi = lang === 'mr';
  const isGujarati = lang === 'gu';
  const isTamil = lang === 'ta';

  return [
    {
      id: 'school',
      title: isHindi ? 'स्कूल में' : isMarathi ? 'शाळेत' : isGujarati ? 'શાળામાં' : isTamil ? 'பள்ளியில்' : 'At School',
      icon: <School className="w-8 h-8" />,
      description: isHindi ? 'शिक्षकों और सहपाठियों के साथ बातचीत का अभ्यास करें!' : 'Practice conversations with teachers and classmates!',
      background: 'from-blue-400 to-blue-600',
      steps: [
        {
          id: '1',
          aiPrompt: isHindi ? "सुप्रभात! हमारी कक्षा में आपका स्वागत है! आपका नाम क्या है?" :
            isMarathi ? "सुप्रभात! आमच्या वर्गात तुमचे स्वागत आहे! तुमचे नाव काय आहे?" :
              isGujarati ? "સુપ્રભાત! અમારા વર્ગખંડમાં તમારું સ્વાગત છે! તમારું નામ શું છે?" :
                isTamil ? "காலை வணக்கம்! வகுப்பறைக்கு வருக! உங்கள் பெயர் என்ன?" :
                  "Good morning! Welcome to our classroom! What's your name?",
          tips: isHindi ? "अपना नाम स्पष्ट रूप से कहें!" : "Say your name clearly!"
        },
        {
          id: '2',
          aiPrompt: isHindi ? "आपसे मिलकर अच्छा लगा! क्या आपको स्कूल आना पसंद है?" :
            isMarathi ? "तुम्हाला भेटून आनंद झाला! तुम्हाला शाळेत यायला आवडते का?" :
              isGujarati ? "તમને મળીને આનંદ થયો! શું તમને શાળાએ આવવું ગમે છે?" :
                isTamil ? "உங்களை சந்தித்ததில் மகிழ்ச்சி! உங்களுக்கு பள்ளிக்கு வருவது பிடிக்குமா?" :
                  "Nice to meet you! Do you like coming to school?",
          tips: isHindi ? "आप कह सकते हैं 'हाँ, मुझे स्कूल पसंद है!'" : "You can say 'Yes, I like school!'"
        },
        {
          id: '3',
          aiPrompt: isHindi ? "यह अद्भुत है! आपका पसंदीदा विषय कौन सा है?" :
            isMarathi ? "ते खूप छान आहे! तुमचा आवडता विषय कोणता आहे?" :
              isGujarati ? "તે અદ્ભુત છે! તમારો મનપસંદ વિષય કયો છે?" :
                isTamil ? "அது அற்புதம்! உங்களுக்கு மிகவும் பிடித்த பாடம் எது?" :
                  "That's wonderful! What's your favorite subject?",
          tips: isHindi ? "गणित या कला जैसे विषयों के बारे में सोचें!" : "Think about subjects like Math or Art!"
        }
      ]
    },
    {
      id: 'store',
      title: isHindi ? 'दुकान पर' : isMarathi ? 'दुकानात' : isGujarati ? 'દુકાને' : isTamil ? 'கடைக்கு' : 'At the Store',
      icon: <ShoppingCart className="w-8 h-8" />,
      description: 'Learn to shop and talk to shopkeepers!',
      background: 'from-green-400 to-green-600',
      steps: [
        {
          id: '1',
          aiPrompt: isHindi ? "हमारी दुकान में आपका स्वागत है! आज मैं आपकी कैसे मदद कर सकता हूँ?" :
            isMarathi ? "आमच्या दुकानात तुमचे स्वागत आहे! आज मी तुमची कशी मदत करू शकतो?" :
              isGujarati ? "અમારી દુકાનમાં તમારું સ્વાગત છે! હું તમને કેવી રીતે મદદ કરી શકું?" :
                isTamil ? "எங்கள் கடைக்கு வருக! இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?" :
                  "Welcome to our store! How can I help you today?",
          tips: "Say 'I want to buy...'!"
        },
        {
          id: '2',
          aiPrompt: isHindi ? "यह बहुत अच्छा विकल्प है! आपको कितने चाहिए?" :
            isMarathi ? "ती खूप छान निवड आहे! तुम्हाला किती हवे आहेत?" :
              isGujarati ? "તે ખૂબ જ સારી પસંદગી છે! તમને કેટલા જોઈએ છે?" :
                isTamil ? "அது சிறந்த தேர்வு! உங்களுக்கு எத்தனை வேண்டும்?" :
                  "That's a great choice! How many would you like?",
          tips: "Use numbers like 'one' or 'two'!"
        },
        {
          id: '3',
          aiPrompt: isHindi ? "बढ़िया! यह रहा आपका ऑर्डर। आपका दिन शुभ हो!" :
            isMarathi ? "उत्तम! हे घ्या तुमचे ऑर्डर. आपला दिवस चांगला जावो!" :
              isGujarati ? "સરસ! આ રહ્યો તમારો ઓર્ડર. તમારો દિવસ શુભ રહે!" :
                isTamil ? "அருமை! இதோ உங்கள் ஆர்டர். இனிய நாளாக அமையட்டும்!" :
                  "Perfect! Here's your order. Have a great day!",
        }
      ]
    },
    {
      id: 'home',
      title: isHindi ? 'घर पर' : isMarathi ? 'घरी' : isGujarati ? 'ઘરે' : isTamil ? 'வீட்டில்' : 'At Home',
      icon: <Home className="w-8 h-8" />,
      description: 'Practice family conversations!',
      background: 'from-orange-400 to-orange-600',
      steps: [
        {
          id: '1',
          aiPrompt: isHindi ? "नमस्ते! आप घर पर किसके साथ रहते हैं?" :
            isMarathi ? "नमस्कार! तुम्ही घरी कोणासोबत राहता?" :
              isGujarati ? "નમસ્તે! તમે ઘરે કોની સાથે રહો છો?" :
                isTamil ? "வணக்கம்! நீங்கள் வீட்டில் யாருடன் வசிக்கிறீர்கள்?" :
                  "Hi there! Who do you live with at home?",
          tips: "Mention your family members!"
        }
      ]
    }
  ];
};

export const RoleplayScenarios = ({ language, onScenarioComplete }: RoleplayScenariosProps) => {
  const [selectedScenario, setSelectedScenario] = useState<RoleplayScenario | null>(null);

  // Dynamic Conversation State
  const [turnCount, setTurnCount] = useState(0);
  const [currentAiPrompt, setCurrentAiPrompt] = useState('');
  const [currentTips, setCurrentTips] = useState('');

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [textInput, setTextInput] = useState('');

  // Refs for cleanup
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // const MAX_TURNS = 10; // Removed per user guidelines

  // --- CLEANUP ---
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  const stopEverything = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    stopAudio();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsProcessing(false);
  }, [stopAudio]);

  // Cleanup
  useEffect(() => {
    return () => stopEverything();
  }, [stopEverything, selectedScenario]);

  // --- TTS ---
  const playAudio = useCallback((base64Audio: string) => {
    stopAudio();
    const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
    audioRef.current = audio;
    audio.play().catch(e => console.error("Audio play failed", e));
  }, [stopAudio]);

  const fetchAndPlayTTS = async (text: string) => {
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
      if (data.success && data.audio) {
        playAudio(data.audio);
      }
    } catch (e) {
      console.error("TTS Error", e);
    }
  };

  // --- SESSION INIT ---
  useEffect(() => {
    if (selectedScenario) {
      const initSession = async () => {
        try {
          const token = localStorage.getItem('token');
          const headers: any = { 'Content-Type': 'application/json' };
          if (token) headers['Authorization'] = `Bearer ${token}`;

          await fetch(API_URL + '/api/voice/session/start', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              type: 'roleplay',
              language,
              scenarioId: selectedScenario.id,
              scenarioContext: selectedScenario.title
            })
          });

          // Set Initial Prompt from static config
          if (selectedScenario.steps[0]) {
            setCurrentAiPrompt(selectedScenario.steps[0].aiPrompt);
            setCurrentTips(selectedScenario.steps[0].tips);
            fetchAndPlayTTS(selectedScenario.steps[0].aiPrompt);
            setTurnCount(1);
          }
        } catch (e) { console.error("Session Start Error", e); }
      };
      initSession();
    }
  }, [selectedScenario, language]);

  // --- INTERACTION HANDLER ---
  const handleInteraction = async (input: string | Blob) => {
    if (!selectedScenario) return;

    stopAudio();
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
          language,
          scenarioId: selectedScenario.id,
          currentPrompt: currentAiPrompt // Send what AI *last* said as context
        });
      } else {
        const formData = new FormData();
        formData.append('audio', input, 'recording.webm');
        formData.append('language', language);
        formData.append('scenarioId', selectedScenario.id);
        formData.append('currentPrompt', currentAiPrompt);
        body = formData;
      }

      const res = await fetch(API_URL + '/api/voice/roleplay', {
        method: 'POST',
        headers,
        body,
        signal: abortControllerRef.current.signal
      });

      const data = await res.json();

      if (data.success) {
        // DYNAMIC FLOW: The AI's response BECOMES the next prompt
        let responseText = data.aiMessage || "";

        // CHECK FOR COMPLETION SIGNAL
        const isComplete = responseText.includes("[SCENARIO_COMPLETE]");

        // Clean text for display/speech
        responseText = responseText.replace("[SCENARIO_COMPLETE]", "").trim();

        setCurrentAiPrompt(responseText);
        setCurrentTips(isComplete ? "Scenario Finished!" : "Keep chatting!");

        if (data.audio) playAudio(data.audio);
        else if (responseText) fetchAndPlayTTS(responseText);

        // Advance Turn (Unlimited)
        setTurnCount(prev => prev + 1);

        if (isComplete) {
          toast({ title: "Conversation Finished!", description: "Great job completing the scenario!" });
          // Small delay then finish
          setTimeout(() => {
            onScenarioComplete();
          }, 4000);
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
    setTurnCount(0);
    setCurrentAiPrompt('');
  };

  // --- RENDER ---
  // Selection Screen
  const scenarios = getScenarios(language);

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
  if (!currentAiPrompt) return <div>Loading...</div>; // Init wait

  const progress = (turnCount / 20) * 100; // Arbitrary scale for visual effect

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className={`p-6 bg-gradient-to-r ${selectedScenario.background} text-white border-0`}>
        <div className="flex justify-between items-center">
          <div className="flex gap-4 items-center">
            <div className="p-3 bg-white/20 rounded-full">{selectedScenario.icon}</div>
            <div><h2 className="text-3xl font-bold">{selectedScenario.title}</h2><p>Turn {turnCount}</p></div>
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
              <div className="chat-bubble chat-bubble-ai text-xl">{currentAiPrompt}</div>
              <Button variant="ghost" size="sm" onClick={() => fetchAndPlayTTS(currentAiPrompt)} className="mt-2 text-purple-600">
                <Play className="w-4 h-4 mr-2" /> Replay Audio
              </Button>
            </div>
          </div>
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

      <SmartTips tip={currentTips} type="encouragement" />
    </div>
  );
};
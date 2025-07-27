import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DavidAvatar } from './DavidAvatar';
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentTip, setCurrentTip] = useState("Click the microphone and start speaking! I can hear you perfectly!");

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
  }, [language]);
  
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
      setCurrentTip("Processing your voice... This might take a moment! ✨");
      
      // Create form data for API request
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      formData.append('language', language);
      
      // Add conversation history if available (last 5 messages)
      if (messages.length > 0) {
        const history = messages.slice(-5).map(msg => ({
          type: msg.type,
          text: msg.text
        }));
        formData.append('history', JSON.stringify(history));
      }
      
      // Send audio to backend API
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/voice/chat`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process audio');
      }
      
      const data = await response.json();
      
      // Add user message
      const userMsgId = Date.now().toString();
      setMessages(prev => [...prev, {
        id: userMsgId,
        type: 'user',
        text: data.userMessage,
        timestamp: new Date()
      }]);

      // Create audio element for AI response
      const audioUrl = `data:audio/mp3;base64,${data.audio}`;
      const audio = new Audio(audioUrl);
      
      // Add AI message with audio
      const aiMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: aiMsgId,
        type: 'ai',
        text: data.aiMessage,
        timestamp: new Date(),
        audioUrl
      }]);
      
      // Play audio response
      audio.play();
      
      // Update progress after session
      if (messages.length >= 4) { // After a few exchanges
        onSessionComplete();
      }
      
      setCurrentTip("Great job! Ask another question or try something new!");
      setIsProcessing(false);
    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process your voice",
        variant: "destructive"
      });
      setIsProcessing(false);
      // More thoughtful error messages based on language
      const errorTips = {
        'en': "Hmm, it seems our magical connection is having a hiccup! Did you know that even wizards sometimes need to restart their wands? Let's try again with a clearer voice! 🧙‍♂️✨",
        'hi': "लगता है हमारा जादुई कनेक्शन थोड़ा हिचक रहा है! क्या आप जानते हैं कि जादूगरों को भी कभी-कभी अपनी छड़ी को रीस्टार्ट करना पड़ता है? आइए एक स्पष्ट आवाज के साथ फिर से प्रयास करें! 🧙‍♂️✨",
        'mr': "असं वाटतं की आपला जादुई कनेक्शन थोडा अडखळत आहे! तुम्हाला माहित आहे का की जादूगारांनाही कधीकधी त्यांची जादूची कांडी रीस्टार्ट करावी लागते? चला, अधिक स्पष्ट आवाजात पुन्हा प्रयत्न करू! 🧙‍♂️✨",
        'gu': "લાગે છે કે આપણું જાદુઈ જોડાણ થોડું અટકી રહ્યું છે! શું તમે જાણો છો કે જાદુગરોને પણ ક્યારેક તેમની જાદુઈ છડી ફરીથી શરૂ કરવી પડે છે? ચાલો વધુ સ્પષ્ટ અવાજ સાથે ફરી પ્રયાસ કરીએ! 🧙‍♂️✨",
        'ta': "நமது மாயத் தொடர்பு சிறிது தடுமாறுவது போல் தெரிகிறது! மந்திரவாதிகளும் சில நேரங்களில் தங்கள் மந்திரக் கோலை மறுதொடக்கம் செய்ய வேண்டும் என்பது உங்களுக்குத் தெரியுமா? தெளிவான குரலுடன் மீண்டும் முயற்சிப்போம்! 🧙‍♂️✨"
      };
      setCurrentTip(errorTips[language as keyof typeof errorTips] || errorTips['en']);
    }
  };
  
  // Define AI responses for different languages
  const aiResponses = {
    'en': [
      "A noun is a word that names a person, place, or thing! Like 'cat', 'school', or 'friend'. Can you tell me a noun? 😊",
      "I'd be happy to help with math! What would you like to learn? Addition, subtraction, or something else? 🔢",
      "Animals are amazing! Did you know dolphins can recognize themselves in mirrors? What's your favorite animal? 🐬",
      "I can't check the weather, but I can help you learn weather words! Sunshine ☀️, rain 🌧️, clouds ☁️. What weather do you like?",
      "Making friends is special! Try being kind, sharing, and asking others to play. Friendship is like a beautiful flower that grows! 🌸"
    ],
    'hi': [
      "संज्ञा एक ऐसा शब्द है जो किसी व्यक्ति, स्थान या वस्तु का नाम बताता है! जैसे 'बिल्ली', 'स्कूल', या 'दोस्त'। क्या आप मुझे एक संज्ञा बता सकते हैं? 😊",
      "मुझे गणित में मदद करने में खुशी होगी! आप क्या सीखना चाहते हैं? जोड़, घटाव, या कुछ और? 🔢",
      "जानवर अद्भुत हैं! क्या आप जानते हैं कि डॉल्फिन आईने में खुद को पहचान सकते हैं? आपका पसंदीदा जानवर कौन सा है? 🐬",
      "मैं मौसम की जांच नहीं कर सकता, लेकिन मैं आपको मौसम के शब्द सिखाने में मदद कर सकता हूं! धूप ☀️, बारिश 🌧️, बादल ☁️। आपको कौन सा मौसम पसंद है?",
      "दोस्त बनाना विशेष है! दयालु बनने, बांटने और दूसरों को खेलने के लिए कहने का प्रयास करें। दोस्ती एक सुंदर फूल की तरह है जो बढ़ती है! 🌸"
    ],
    'mr': [
      "नाम हा एक शब्द आहे जो एखाद्या व्यक्ती, ठिकाण किंवा वस्तूचे नाव सांगतो! जसे 'मांजर', 'शाळा', किंवा 'मित्र'। तुम्ही मला एक नाम सांगू शकता का? 😊",
      "मला गणितात मदत करण्यात आनंद वाटेल! तुम्हाला काय शिकायचे आहे? बेरीज, वजाबाकी, किंवा काहीतरी? 🔢",
      "प्राणी खूप आश्चर्यकारक आहेत! तुम्हाला माहित आहे का की डॉल्फिन आरशात स्वतःला ओळखू शकतात? तुमचा आवडता प्राणी कोणता आहे? 🐬",
      "मी हवामान तपासू शकत नाही, पण मी तुम्हाला हवामान शब्द शिकण्यात मदत करू शकतो! सूर्यप्रकाश ☀️, पाऊस 🌧️, ढग ☁️। तुम्हाला कोणते हवामान आवडते?",
      "मित्र बनवणे खास आहे! दयाळू असणे, वाटणे आणि इतरांना खेळण्यास सांगण्याचा प्रयत्न करा। मैत्री एक सुंदर फूलासारखी आहे जी वाढते! 🌸"
    ],
    'gu': [
      "સંજ્ઞા એ એવો શબ્દ છે જે કોઈ વ્યક્તિ, સ્થાન અથવા વસ્તુનું નામ બતાવે છે! જેમ કે 'બિલાડી', 'શાળા', અથવા 'મિત્ર'। શું તમે મને એક સંજ્ઞા કહી શકો છો? 😊",
      "મને ગણિતમાં મદદ કરવામાં આનંદ થશે! તમે શું શીખવા માંગો છો? સરવાળો, બાદબાકી, અથવા કંઈક બીજું? 🔢",
      "પ્રાણીઓ ખૂબ જ અદ્ભુત છે! શું તમે જાણો છો કે ડોલ્ફિન અરીસામાં પોતાને ઓળખી શકે છે? તમારો પ્રિય પ્રાણી કોણ છે? 🐬",
      "હું હવામાન તપાસી શકતો નથી, પણ હું તમને હવામાનના શબ્દો શીખવામાં મદદ કરી શકું છું! સૂર્યપ્રકાશ ☀️, વરસાદ 🌧️, વાદળ ☁️। તમને કયું હવામાન ગમે છે?",
      "મિત્ર બનાવવું ખાસ છે! દયાળુ બનવાનો, વહેંચવાનો અને બીજાને રમવા કહેવાનો પ્રયાસ કરો। મિત્રતા એક સુંદર ફૂલ જેવી છે જે વધે છે! 🌸"
    ],
    'ta': [
      "பெயர்ச்சொல் என்பது ஒரு நபர், இடம் அல்லது பொருளின் பெயரைக் குறிக்கும் சொல்! 'பூனை', 'பள்ளி', அல்லது 'நண்பர்' போன்றவை. நீங்கள் எனக்கு ஒரு பெயர்ச்சொல் சொல்ல முடியுமா? 😊",
      "நான் கணிதத்தில் உதவ மகிழ்ச்சி அடைவேன்! நீங்கள் என்ன கற்க விரும்புகிறீர்கள்? கூட்டல், கழித்தல், அல்லது வேறு ஏதாவது? 🔢",
      "விலங்குகள் மிகவும் அற்புதமானவை! டால்பின்கள் கண்ணாடியில் தங்களை அடையாளம் கண்டுகொள்ள முடியும் என்று உங்களுக்குத் தெரியுமா? உங்களுக்கு பிடித்த விலங்கு எது? 🐬",
      "நான் வானிலையை சரிபார்க்க முடியாது, ஆனால் நான் உங்களுக்கு வானிலை வார்த்தைகளை கற்க உதவ முடியும்! வெயில் ☀️, மழை 🌧️, மேகம் ☁️. உங்களுக்கு எந்த வானிலை பிடிக்கும்?",
      "நண்பர்களை உருவாக்குவது சிறப்பு! கருணையுடன் இருக்க, பகிர்ந்து கொள்ள, மற்றவர்களை விளையாடும்படி கேட்க முயற்சிக்கவும். நட்பு என்பது வளரும் அழகான மலர் போன்றது! 🌸"
    ]
  };
  
  const handleFallbackResponse = () => {
    try {
      const responses = aiResponses[language as keyof typeof aiResponses] || aiResponses['en'];
      const aiResponse = responses[Math.floor(Math.random() * responses.length)];
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'ai',
        text: aiResponse,
        timestamp: new Date()
      }]);
        
      // Multi-language tips
      const tips = {
        'en': "Fantastic! Try asking another question or tell me what you think!",
        'hi': "बहुत बढ़िया! कोई और सवाल पूछने की कोशिश करें या मुझे बताएं कि आप क्या सोचते हैं!",
        'mr': "खूप छान! दुसरा प्रश्न विचारण्याचा प्रयत्न करा किंवा मला सांगा की तुम्ही काय विचार करता!",
        'gu': "ખૂબ જ સરસ! બીજો પ્રશ્ન પૂછવાનો પ્રયાસ કરો અથવા મને કહો કે તમે શું વિચારો છો!",
        'ta': "மிகவும் நன்று! மற்றொரு கேள்வியைக் கேட்க முயற்சிக்கவும் அல்லது நீங்கள் என்ன நினைக்கிறீர்கள் என்று சொல்லுங்கள்!"
      };
      
      setCurrentTip(tips[language as keyof typeof tips] || tips['en']);
      onSessionComplete();
    } catch (error) {
      toast({
        title: "Processing Error",
        description: "Our magical connection needs a moment to recharge!",
        variant: "destructive"
      });
      // More thoughtful error messages based on language
      const errorTips = {
        'en': "Our magical connection is taking a short nap! Did you know that even the most powerful spells sometimes need a second try? Let's awaken the magic again! 🔮✨",
        'hi': "हमारा जादुई कनेक्शन थोड़ी देर के लिए आराम कर रहा है! क्या आप जानते हैं कि सबसे शक्तिशाली जादू को भी कभी-कभी दूसरे प्रयास की आवश्यकता होती है? चलिए फिर से जादू को जगाते हैं! 🔮✨",
        'mr': "आपला जादुई कनेक्शन थोडा आराम करत आहे! तुम्हाला माहित आहे का की सर्वात शक्तिशाली जादूलाही कधीकधी दुसऱ्या प्रयत्नाची गरज असते? चला पुन्हा जादू जागृत करूया! 🔮✨",
        'gu': "આપણું જાદુઈ જોડાણ થોડી આરામ કરી રહ્યું છે! શું તમે જાણો છો કે સૌથી શક્તિશાળી જાદુને પણ ક્યારેક બીજા પ્રયાસની જરૂર પડે છે? ચાલો ફરીથી જાદુને જગાડીએ! 🔮✨",
        'ta': "நமது மாய இணைப்பு சிறிது ஓய்வெடுக்கிறது! மிகவும் சக்திவாய்ந்த மந்திரங்களுக்கும் கூட சில நேரங்களில் இரண்டாவது முயற்சி தேவைப்படும் என்பது உங்களுக்குத் தெரியுமா? மீண்டும் மந்திரத்தை விழிக்கச் செய்வோம்! 🔮✨"
      };
      setCurrentTip(errorTips[language as keyof typeof errorTips] || errorTips['en']);
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
        </div>
      </Card>

      {/* Smart Tips */}
      <SmartTips tip={currentTip} />

      {/* Emoji Reactions */}
      <EmojiReactions onReaction={(emoji) => setCurrentTip(`Thanks for the ${emoji}! How else can I help?`)} />
    </div>
  );
};
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { GenieAvatar } from './GenieAvatar';

interface WelcomeAnimationProps {
  onComplete: () => void;
}

export const WelcomeAnimation = ({ onComplete }: WelcomeAnimationProps) => {
  const [currentText, setCurrentText] = useState('');
  const [showAvatar, setShowAvatar] = useState(false);
  
  const welcomeText = "✨ Welcome to the magical world of learning! ✨";
  
  useEffect(() => {
    // Show avatar first
    setTimeout(() => setShowAvatar(true), 500);
    
    // Typewriter effect
    let index = 0;
    const interval = setInterval(() => {
      if (index < welcomeText.length) {
        setCurrentText(welcomeText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        // Complete after showing full text
        setTimeout(onComplete, 2000);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center z-50">
      <Card className="p-12 bg-white/90 backdrop-blur text-center max-w-lg mx-4 border-0 shadow-2xl animate-bounce-in">
        <div className="space-y-8">
          {showAvatar && (
            <div className="flex justify-center">
              <GenieAvatar size="large" isActive={true} mood="excited" />
            </div>
          )}
          
          <div className="space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Hello, Young Learner!
            </h1>
            
            <p className="text-xl text-purple-700 min-h-[60px] font-medium">
              {currentText}
              <span className="animate-pulse">|</span>
            </p>
          </div>
          
          <div className="flex justify-center space-x-4">
            <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </Card>
      
      {/* Floating elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-4 h-4 bg-yellow-300 rounded-full animate-float opacity-60"></div>
        <div className="absolute top-40 right-32 w-6 h-6 bg-pink-300 rounded-full animate-float opacity-50" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-32 left-40 w-5 h-5 bg-blue-300 rounded-full animate-float opacity-70" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-60 right-20 w-3 h-3 bg-green-300 rounded-full animate-float opacity-60" style={{animationDelay: '3s'}}></div>
      </div>
    </div>
  );
};
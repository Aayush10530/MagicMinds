import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface EmojiReactionsProps {
  onReaction: (emoji: string) => void;
}

const reactions = [
  { emoji: '👍', label: 'Great!', color: 'from-green-400 to-green-600' },
  { emoji: '😄', label: 'Fun!', color: 'from-yellow-400 to-orange-500' },
  { emoji: '🤩', label: 'Amazing!', color: 'from-purple-400 to-pink-500' },
  { emoji: '🧠', label: 'Smart!', color: 'from-blue-400 to-indigo-600' },
  { emoji: '❤️', label: 'Love it!', color: 'from-red-400 to-pink-600' },
  { emoji: '🎉', label: 'Awesome!', color: 'from-indigo-400 to-purple-600' }
];

export const EmojiReactions = ({ onReaction }: EmojiReactionsProps) => {
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);

  const handleReaction = (emoji: string, label: string) => {
    setSelectedEmoji(emoji);
    onReaction(label);
    
    // Reset after animation
    setTimeout(() => setSelectedEmoji(null), 1000);
  };

  return (
    <Card className="p-6 bg-gradient-to-r from-purple-100 to-pink-100 border-purple-200">
      <div className="text-center space-y-4">
        <h3 className="text-xl font-bold text-purple-800">How do you feel about our chat? 😊</h3>
        
        <div className="flex flex-wrap justify-center gap-3">
          {reactions.map((reaction) => (
            <Button
              key={reaction.emoji}
              onClick={() => handleReaction(reaction.emoji, reaction.label)}
              className={`
                relative w-16 h-16 rounded-full border-3 border-white shadow-lg
                bg-gradient-to-r ${reaction.color} text-white
                hover:scale-110 transition-all duration-300
                ${selectedEmoji === reaction.emoji ? 'animate-bounce scale-125' : ''}
              `}
              title={reaction.label}
            >
              <span className="text-2xl">{reaction.emoji}</span>
              
              {selectedEmoji === reaction.emoji && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white text-purple-800 px-2 py-1 rounded-full text-xs font-bold animate-bounce-in">
                  {reaction.label}
                </div>
              )}
            </Button>
          ))}
        </div>
        
        <p className="text-purple-600 text-sm">
          Your feedback helps me become a better tutor! ✨
        </p>
      </div>
    </Card>
  );
};
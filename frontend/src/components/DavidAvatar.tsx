import { cn } from '@/lib/utils';
import { Sparkles, Star } from 'lucide-react';

interface DavidAvatarProps {
  size?: 'small' | 'medium' | 'large';
  isActive?: boolean;
  mood?: 'happy' | 'thinking' | 'excited' | 'listening';
  className?: string;
}

export const DavidAvatar = ({ 
  size = 'medium', 
  isActive = false, 
  mood = 'happy',
  className 
}: GenieAvatarProps) => {
  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-24 h-24',
    large: 'w-40 h-40'
  };

  const getMoodEmoji = () => {
    switch (mood) {
      case 'thinking': return '🤔';
      case 'excited': return '🤩';
      case 'listening': return '👂';
      default: return '👨‍🏫';
    }
  };

  return (
    <div className={cn(
      "relative flex items-center justify-center",
      sizeClasses[size],
      className
    )}>
      {/* Magical glow effect */}
      {isActive && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 via-pink-500 to-yellow-500 animate-pulse-glow" />
      )}
      
      {/* Main avatar */}
      <div className={cn(
        "relative rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center text-white shadow-xl",
        sizeClasses[size],
        isActive ? "animate-float" : "",
        "border-4 border-white"
      )}>
        <span className={cn(
          "text-center",
          size === 'small' ? 'text-lg' : size === 'medium' ? 'text-3xl' : 'text-6xl'
        )}>
          {getMoodEmoji()}
        </span>
      </div>

      {/* Floating sparkles */}
      {isActive && (
        <>
          <Sparkles className={cn(
            "absolute text-yellow-400 animate-float",
            size === 'small' ? 'w-3 h-3 -top-1 -right-1' : 
            size === 'medium' ? 'w-4 h-4 -top-2 -right-2' : 'w-6 h-6 -top-3 -right-3'
          )} style={{ animationDelay: '0.5s' }} />
          <Star className={cn(
            "absolute text-pink-400 animate-float",
            size === 'small' ? 'w-2 h-2 -bottom-1 -left-1' : 
            size === 'medium' ? 'w-3 h-3 -bottom-2 -left-2' : 'w-5 h-5 -bottom-3 -left-3'
          )} style={{ animationDelay: '1s' }} />
        </>
      )}
    </div>
  );
};
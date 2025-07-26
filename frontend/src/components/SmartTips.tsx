import { Card } from '@/components/ui/card';
import { Lightbulb, Star, Target } from 'lucide-react';

interface SmartTipsProps {
  tip: string;
  type?: 'general' | 'pronunciation' | 'encouragement';
}

export const SmartTips = ({ tip, type = 'general' }: SmartTipsProps) => {
  const getIcon = () => {
    switch (type) {
      case 'pronunciation':
        return <Target className="w-5 h-5" />;
      case 'encouragement':
        return <Star className="w-5 h-5" />;
      default:
        return <Lightbulb className="w-5 h-5" />;
    }
  };

  const getGradient = () => {
    switch (type) {
      case 'pronunciation':
        return 'from-blue-500 to-cyan-500';
      case 'encouragement':
        return 'from-yellow-500 to-orange-500';
      default:
        return 'from-purple-500 to-pink-500';
    }
  };

  return (
    <Card className={`p-4 bg-gradient-to-r ${getGradient()} text-white border-0 animate-bounce-in`}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white/20 rounded-full">
          {getIcon()}
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-sm uppercase tracking-wide opacity-90">
            Smart Tip ✨
          </h4>
          <p className="text-lg leading-relaxed">{tip}</p>
        </div>
      </div>
    </Card>
  );
};
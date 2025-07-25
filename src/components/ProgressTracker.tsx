import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, MessageCircle, Drama, Calendar } from 'lucide-react';

interface UserProgress {
  chatSessions: number;
  roleplayCompleted: number;
  streak: number;
  badges: string[];
}

interface ProgressTrackerProps {
  progress: UserProgress;
}

const badgeConfig = {
  chatter: {
    icon: <MessageCircle className="w-4 h-4" />,
    name: 'Chatter',
    description: '5 chat sessions completed!',
    color: 'from-blue-400 to-blue-600'
  },
  actor: {
    icon: <Drama className="w-4 h-4" />,
    name: 'Actor',
    description: '3 roleplay scenarios completed!',
    color: 'from-purple-400 to-purple-600'
  },
  superstar: {
    icon: <Star className="w-4 h-4" />,
    name: 'Superstar',
    description: 'Amazing learning progress!',
    color: 'from-yellow-400 to-orange-500'
  }
};

export const ProgressTracker = ({ progress }: ProgressTrackerProps) => {
  return (
    <Card className="p-4 bg-gradient-to-r from-purple-100 to-pink-100 border-purple-200 min-w-[200px]">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-5 h-5 text-purple-600" />
        <span className="font-bold text-purple-800">Your Progress</span>
      </div>
      
      <div className="space-y-3">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-2 bg-white/60 rounded-lg">
            <div className="text-xl font-bold text-purple-700">{progress.chatSessions}</div>
            <div className="text-xs text-purple-600">Chats</div>
          </div>
          <div className="p-2 bg-white/60 rounded-lg">
            <div className="text-xl font-bold text-purple-700">{progress.roleplayCompleted}</div>
            <div className="text-xs text-purple-600">Roleplays</div>
          </div>
        </div>
        
        {/* Streak */}
        <div className="text-center p-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg">
          <div className="flex items-center justify-center gap-1">
            <Calendar className="w-4 h-4" />
            <span className="font-bold">{progress.streak} day streak!</span>
          </div>
        </div>
        
        {/* Badges */}
        {progress.badges.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-semibold text-purple-700">Your Badges:</span>
            <div className="flex flex-wrap gap-1">
              {progress.badges.map((badgeId) => {
                const badge = badgeConfig[badgeId as keyof typeof badgeConfig];
                if (!badge) return null;
                
                return (
                  <Badge
                    key={badgeId}
                    className={`bg-gradient-to-r ${badge.color} text-white border-0 text-xs animate-bounce-in`}
                    title={badge.description}
                  >
                    {badge.icon}
                    <span className="ml-1">{badge.name}</span>
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Encouragement */}
        <div className="text-center">
          <p className="text-xs text-purple-600">
            Keep learning to earn more badges! 🌟
          </p>
        </div>
      </div>
    </Card>
  );
};
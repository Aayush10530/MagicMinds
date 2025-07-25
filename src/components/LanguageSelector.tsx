import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Globe } from 'lucide-react';

export type Language = 'en' | 'hi' | 'mr' | 'gu' | 'ta';

interface LanguageSelectorProps {
  selectedLanguage: Language;
  onLanguageChange: (language: Language) => void;
}

const languages = [
  { code: 'en' as Language, name: 'English', flag: '🇺🇸', color: 'from-blue-400 to-blue-600' },
  { code: 'hi' as Language, name: 'हिंदी', flag: '🇮🇳', color: 'from-orange-400 to-red-500' },
  { code: 'mr' as Language, name: 'मराठी', flag: '🇮🇳', color: 'from-yellow-400 to-orange-500' },
  { code: 'gu' as Language, name: 'ગુજરાતી', flag: '🇮🇳', color: 'from-green-400 to-blue-500' },
  { code: 'ta' as Language, name: 'தமிழ்', flag: '🇮🇳', color: 'from-red-400 to-pink-500' }
];

export const LanguageSelector = ({ selectedLanguage, onLanguageChange }: LanguageSelectorProps) => {
  return (
    <Card className="p-4 bg-white/90 backdrop-blur border-purple-200">
      <div className="flex items-center gap-3 mb-3">
        <Globe className="w-5 h-5 text-purple-600" />
        <span className="font-semibold text-purple-800">Choose Language</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {languages.map((language) => (
          <Button
            key={language.code}
            onClick={() => onLanguageChange(language.code)}
            variant={selectedLanguage === language.code ? "default" : "outline"}
            size="sm"
            className={`
              transition-all duration-300 hover:scale-105
              ${selectedLanguage === language.code 
                ? `bg-gradient-to-r ${language.color} text-white border-0 shadow-lg` 
                : 'hover:bg-purple-50 border-purple-200 text-purple-700'
              }
            `}
          >
            <span className="mr-2">{language.flag}</span>
            <span className="text-sm font-medium">{language.name}</span>
          </Button>
        ))}
      </div>
      
      <p className="text-xs text-purple-600 mt-2 text-center">
        Genie will speak to you in your chosen language! ✨
      </p>
    </Card>
  );
};
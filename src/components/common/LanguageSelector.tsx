import React from 'react';
import { Languages } from 'lucide-react';
import { useTranslation, SupportedLanguage } from '../../context/LanguageContext.js';

interface LanguageSelectorProps {
  className?: string;
  showIcon?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className = '',
  showIcon = true,
}) => {
  const { language, setLanguage } = useTranslation();

  return (
    <div className={`inline-flex items-center gap-1.5 p-1 bg-[#15171F] border border-[#262932] rounded-lg text-xs ${className}`}>
      {showIcon && <Languages className="w-3.5 h-3.5 text-[#9297A1] ml-1 shrink-0" />}
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2 py-1 rounded font-medium transition-all ${
          language === 'en'
            ? 'bg-[#262932] text-[#F4F1EA] shadow-xs'
            : 'text-[#9297A1] hover:text-[#F4F1EA]'
        }`}
        aria-label="Switch to English"
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage('hi')}
        className={`px-2 py-1 rounded font-medium transition-all ${
          language === 'hi'
            ? 'bg-[#262932] text-[#F4F1EA] shadow-xs'
            : 'text-[#9297A1] hover:text-[#F4F1EA]'
        }`}
        aria-label="Switch to Hindi"
      >
        हिंदी
      </button>
    </div>
  );
};

import React from 'react';
import { AlertCircle, Clock, Home, Share2, Languages } from 'lucide-react';
import { cn } from '../lib/utils';
import { AssessmentResult } from '../lib/gemini';
import { motion } from 'motion/react';

interface AssessmentCardProps {
  result: AssessmentResult;
  translatedAdvice?: string;
  language: string;
  onShare: () => void;
  onTranslate: (lang: string) => void;
}

export const AssessmentCard: React.FC<AssessmentCardProps> = ({ 
  result, 
  translatedAdvice, 
  language, 
  onShare,
  onTranslate 
}) => {
  const config = {
    RED: {
      icon: AlertCircle,
      label: 'EMERGENCY',
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      accent: 'bg-red-600',
      shadow: 'shadow-red-100',
      description: 'Immediate action required. Seek hospital care now.'
    },
    YELLOW: {
      icon: Clock,
      label: 'URGENT',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      accent: 'bg-amber-600',
      shadow: 'shadow-amber-100',
      description: 'Action needed within 24 hours. Visit a clinic.'
    },
    GREEN: {
      icon: Home,
      label: 'HOME CARE',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      accent: 'bg-emerald-600',
      shadow: 'shadow-emerald-100',
      description: 'Manage at home with standard care.'
    }
  }[result.level];

  const Icon = config.icon;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-3xl border-2 p-6 flex flex-col gap-6 shadow-xl",
        config.bg,
        config.border,
        config.shadow
      )}
    >
      <div className="flex items-center justify-between">
        <div className={cn("flex items-center gap-3 px-4 py-2 rounded-full text-white font-bold tracking-wider text-sm", config.accent)}>
          <Icon className="w-5 h-5" />
          {config.label}
        </div>
        <button 
          onClick={onShare}
          className="p-3 bg-white rounded-full shadow-sm hover:shadow-md transition-all text-slate-600"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-slate-900">{result.condition}</h3>
        <p className="text-slate-600 leading-relaxed">{result.urgencyReason}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {result.malnutritionRisk && (
          <div className={cn(
            "p-3 rounded-2xl border flex flex-col gap-1",
            result.malnutritionRisk === 'High' ? "bg-red-50 border-red-100" : 
            result.malnutritionRisk === 'Moderate' ? "bg-amber-50 border-amber-100" : "bg-emerald-50 border-emerald-100"
          )}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Malnutrition Risk</span>
            <span className={cn(
              "font-bold",
              result.malnutritionRisk === 'High' ? "text-red-600" : 
              result.malnutritionRisk === 'Moderate' ? "text-amber-600" : "text-emerald-600"
            )}>{result.malnutritionRisk}</span>
          </div>
        )}
        {result.outbreakConcern && (
          <div className="p-3 rounded-2xl border border-red-100 bg-red-50 flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">Outbreak Alert</span>
            <span className="font-bold text-red-600">Concern Detected</span>
          </div>
        )}
      </div>

      <div className="bg-white/60 rounded-2xl p-5 border border-white/40">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-slate-800 flex items-center gap-2">
            Action Plan
          </h4>
          <div className="flex gap-2">
            {['English', 'Swahili'].map((lang) => (
              <button
                key={lang}
                onClick={() => onTranslate(lang)}
                className={cn(
                  "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all",
                  language === lang ? "bg-slate-800 text-white" : "bg-slate-200 text-slate-600"
                )}
              >
                {lang.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
        
        <p className="text-lg font-medium text-slate-800">
          {translatedAdvice || result.advice}
        </p>
        
        {translatedAdvice && language !== 'English' && (
          <p className="mt-3 pt-3 border-top border-slate-200 text-sm text-slate-500 italic">
            Original: {result.advice}
          </p>
        )}
      </div>

      <button 
        onClick={onShare}
        className="flex items-center justify-center gap-2 w-full py-3 bg-slate-800 text-white rounded-2xl font-bold text-sm shadow-lg hover:bg-slate-900 transition-all"
      >
        <Share2 className="w-4 h-4" />
        Generate Referral Summary
      </button>

      <div className="text-sm font-medium text-slate-500 text-center">
        {config.description}
      </div>
    </motion.div>
  );
};

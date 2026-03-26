import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, Send, MapPin, Users, Activity, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';
import { AssessmentResult } from '../lib/gemini';
import { format } from 'date-fns';

interface OutbreakAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  age: string;
  symptoms: string;
  result: AssessmentResult;
  onSend: (summary: string) => void;
}

export const OutbreakAlertModal: React.FC<OutbreakAlertModalProps> = ({
  isOpen,
  onClose,
  patientName,
  age,
  symptoms,
  result,
  onSend
}) => {
  const summary = `
OUTBREAK ALERT - KINGA SYSTEM
-----------------------------
Date: ${format(new Date(), 'yyyy-MM-dd HH:mm')}
Urgency: ${result.level}
Likely Condition: ${result.condition}
Patient: ${patientName} (${age})
Symptoms: ${symptoms}
Location: [Volunteer's Assigned Area]
-----------------------------
Critical Concern: AI detected a potential cluster based on these symptoms.
  `.trim();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="bg-red-600 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6" />
                <h2 className="text-xl font-bold">District Alert</h2>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
              <div className="space-y-4">
                <p className="text-slate-600 text-sm leading-relaxed">
                  You are notifying district health officials about a potential outbreak cluster. 
                  The following summary will be sent:
                </p>

                <div className="bg-slate-50 rounded-2xl p-4 font-mono text-[11px] text-slate-700 whitespace-pre-wrap border border-slate-200">
                  {summary}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-1">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Location</span>
                  <span className="text-xs font-bold text-slate-700">Current District</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-1">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Patient</span>
                  <span className="text-xs font-bold text-slate-700 truncate">{patientName}</span>
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                <Activity className="w-5 h-5 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>Why alert?</strong> AI analysis identified patterns consistent with localized disease outbreaks. 
                  Early notification can save lives.
                </p>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => onSend(summary)}
                className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-red-100 hover:bg-red-700 transition-all active:scale-95"
              >
                <Send className="w-5 h-5" />
                Send Alert Now
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

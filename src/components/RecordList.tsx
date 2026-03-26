import React from 'react';
import { PatientRecord } from '../lib/db';
import { cn } from '../lib/utils';
import { Clock, AlertCircle, Home, ChevronRight, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface RecordListProps {
  records: PatientRecord[];
  onSelect: (record: PatientRecord) => void;
  onDelete: (id: string) => void;
}

export const RecordList: React.FC<RecordListProps> = ({ records, onSelect, onDelete }) => {
  const urgencyConfig = {
    RED: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' },
    YELLOW: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
    GREEN: { icon: Home, color: 'text-emerald-600', bg: 'bg-emerald-100' }
  };

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <Clock className="w-12 h-12 mb-4 opacity-20" />
        <p className="font-medium">No records yet</p>
        <p className="text-sm">Assessments will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {records.map((record) => {
        const config = urgencyConfig[record.urgency];
        const Icon = config.icon;
        
        return (
          <div 
            key={record.id}
            className="glass-card p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all group"
            onClick={() => onSelect(record)}
          >
            <div className={cn("p-3 rounded-2xl", config.bg)}>
              <Icon className={cn("w-6 h-6", config.color)} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <h4 className="font-bold text-slate-900 truncate">{record.patientName}</h4>
                  {!record.synced && (
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" title="Local only" />
                  )}
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                  {format(record.timestamp, 'MMM d, HH:mm')}
                </span>
              </div>
              <p className="text-sm text-slate-500 truncate">{record.symptoms}</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(record.id);
                }}
                className="p-2 text-slate-300 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

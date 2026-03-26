import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Plus, 
  History, 
  Settings, 
  ChevronLeft, 
  Send, 
  Loader2,
  AlertCircle,
  CheckCircle2,
  Stethoscope,
  User,
  Activity,
  Clock,
  Mic
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { CameraCapture } from './components/CameraCapture';
import { AssessmentCard } from './components/AssessmentCard';
import { RecordList } from './components/RecordList';
import { OutbreakAlertModal } from './components/OutbreakAlertModal';
import { LiveAssessment } from './components/LiveAssessment';
import { analyzeSymptoms, translateToVernacular, AssessmentResult } from './lib/gemini';
import { PatientRecord, saveRecord, getAllRecords, deleteRecord } from './lib/db';

type View = 'dashboard' | 'assess' | 'history' | 'result';

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [records, setRecords] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [image, setImage] = useState<string | undefined>();
  
  // Result state
  const [currentResult, setCurrentResult] = useState<AssessmentResult | null>(null);
  const [translatedAdvice, setTranslatedAdvice] = useState<string | undefined>();
  const [language, setLanguage] = useState('English');
  const [isOutbreakModalOpen, setIsOutbreakModalOpen] = useState(false);
  const [isLiveAssessmentOpen, setIsLiveAssessmentOpen] = useState(false);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    const data = await getAllRecords();
    setRecords(data.reverse());
  };

  const handleAnalyze = async () => {
    if (!symptoms || !patientName) {
      setError('Please provide patient name and symptoms');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await analyzeSymptoms(symptoms, image);
      setCurrentResult(result);
      
      const newRecord: PatientRecord = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        patientName,
        age,
        symptoms,
        image,
        urgency: result.level,
        advice: result.advice,
        language: 'English',
        synced: false,
        malnutritionRisk: result.malnutritionRisk,
        outbreakConcern: result.outbreakConcern
      };
      
      await saveRecord(newRecord);
      await loadRecords();
      setView('result');
    } catch (err) {
      console.error(err);
      setError('Failed to analyze symptoms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async (lang: string) => {
    if (!currentResult) return;
    setLanguage(lang);
    if (lang === 'English') {
      setTranslatedAdvice(undefined);
      return;
    }
    
    setLoading(true);
    try {
      const translated = await translateToVernacular(currentResult.advice, lang);
      setTranslatedAdvice(translated);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPatientName('');
    setAge('');
    setSymptoms('');
    setImage(undefined);
    setCurrentResult(null);
    setTranslatedAdvice(undefined);
    setLanguage('English');
    setError(null);
  };

  const startNewAssessment = () => {
    resetForm();
    setView('assess');
  };

  const handleDelete = async (id: string) => {
    await deleteRecord(id);
    await loadRecords();
  };

  const handleSelectRecord = (record: PatientRecord) => {
    setCurrentResult({
      level: record.urgency,
      condition: 'Previous Assessment',
      advice: record.advice,
      urgencyReason: 'Historical record',
      malnutritionRisk: record.malnutritionRisk,
      outbreakConcern: record.outbreakConcern
    });
    setPatientName(record.patientName);
    setAge(record.age);
    setSymptoms(record.symptoms);
    setImage(record.image);
    setView('result');
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
      {/* Header */}
      <header className="p-6 flex items-center justify-between bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100">
            <Heart className="w-6 h-6 text-white fill-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">KINGA</h1>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Health Guardian</p>
          </div>
        </div>
        <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
          <Settings className="w-6 h-6" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 pb-24 overflow-y-auto">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-slate-900">Hello, Volunteer</h2>
                <p className="text-slate-500">Ready to save lives today?</p>
              </div>

              {records.some(r => r.outbreakConcern) && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-600 text-white rounded-3xl flex items-center justify-between shadow-lg shadow-red-100"
                >
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-6 h-6" />
                    <div>
                      <p className="font-bold">Outbreak Alert</p>
                      <p className="text-xs text-red-100">Potential cluster detected in your area.</p>
                    </div>
                  </div>
                  <button className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    Notify District
                  </button>
                </motion.div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={startNewAssessment}
                  className="col-span-2 p-6 bg-emerald-500 rounded-3xl text-white shadow-xl shadow-emerald-100 flex flex-col gap-4 hover:bg-emerald-600 transition-all active:scale-95"
                >
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Plus className="w-8 h-8" />
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-bold">New Assessment</p>
                    <p className="text-emerald-100 text-sm">Start assessment now</p>
                  </div>
                </button>

                <div className="glass-card p-5 flex flex-col gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <History className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{records.length}</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Records</p>
                  </div>
                </div>

                <div className="glass-card p-5 flex flex-col gap-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                    <Activity className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">
                      {records.filter(r => r.urgency === 'RED').length}
                    </p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Urgent</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900">Recent Assessments</h3>
                  <button 
                    onClick={() => setView('history')}
                    className="text-sm font-bold text-emerald-600"
                  >
                    View All
                  </button>
                </div>
                <RecordList 
                  records={records.slice(0, 3)} 
                  onSelect={handleSelectRecord}
                  onDelete={handleDelete}
                />
              </div>
            </motion.div>
          )}

          {view === 'assess' && (
            <motion.div 
              key="assess"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <button 
                onClick={() => setView('dashboard')}
                className="flex items-center gap-2 text-slate-500 font-bold text-sm hover:text-slate-900 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Dashboard
              </button>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-slate-900">New Assessment</h2>
                  <p className="text-slate-500 italic">Observe carefully and record details.</p>
                </div>
                <button 
                  onClick={() => setIsLiveAssessmentOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-full text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
                >
                  <Mic className="w-4 h-4" />
                  Voice Mode
                </button>
              </div>

              <div className="space-y-4">
                <div className="glass-card p-4 space-y-4">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                    <User className="w-5 h-5 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Patient Name"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="flex-1 bg-transparent outline-none font-medium placeholder:text-slate-300"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Age (e.g. 5 years, 6 months)"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="flex-1 bg-transparent outline-none font-medium placeholder:text-slate-300"
                    />
                  </div>
                </div>

                <div className="glass-card p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-3 text-slate-400">
                      <Stethoscope className="w-5 h-5" />
                      <span className="text-sm font-bold uppercase tracking-wider">Symptoms</span>
                    </div>
                    <button 
                      onClick={() => setIsLiveAssessmentOpen(true)}
                      className="flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-200 transition-all"
                    >
                      <Mic className="w-3 h-3" />
                      Talk to AI
                    </button>
                  </div>
                  <textarea 
                    placeholder="Describe what you see (e.g. high fever, coughing, rash on chest...)"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className="w-full h-32 bg-transparent outline-none font-medium placeholder:text-slate-300 resize-none"
                  />
                </div>

                <CameraCapture 
                  image={image}
                  onCapture={setImage}
                  onClear={() => setImage(undefined)}
                />

                {error && (
                  <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-medium border border-red-100">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                  </div>
                )}

                <button 
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="w-full py-5 bg-emerald-500 text-white rounded-3xl font-bold text-lg shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Get Urgency Advice
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {view === 'result' && currentResult && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setView('assess')}
                  className="flex items-center gap-2 text-slate-500 font-bold text-sm hover:text-slate-900 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Edit Details
                </button>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Patient</p>
                  <p className="font-bold text-slate-900">{patientName}</p>
                </div>
              </div>

              <AssessmentCard 
                result={currentResult}
                translatedAdvice={translatedAdvice}
                language={language}
                onShare={() => {
                  const text = `KINGA ASSESSMENT: ${currentResult.level}\nPatient: ${patientName}\nCondition: ${currentResult.condition}\nAdvice: ${translatedAdvice || currentResult.advice}`;
                  if (navigator.share) {
                    navigator.share({ title: 'Kinga Assessment', text });
                  } else {
                    alert('Copied to clipboard');
                    navigator.clipboard.writeText(text);
                  }
                }}
                onTranslate={handleTranslate}
              />

              {currentResult.outbreakConcern && (
                <motion.button 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setIsOutbreakModalOpen(true)}
                  className="w-full py-5 bg-red-600 text-white rounded-3xl font-bold text-lg shadow-xl shadow-red-100 flex items-center justify-center gap-3 hover:bg-red-700 transition-all active:scale-95"
                >
                  <AlertCircle className="w-6 h-6" />
                  Notify District Officials
                </motion.button>
              )}

              <button 
                onClick={() => setView('dashboard')}
                className="w-full py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-3xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Done & Save
              </button>
            </motion.div>
          )}

          {view === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <button 
                onClick={() => setView('dashboard')}
                className="flex items-center gap-2 text-slate-500 font-bold text-sm hover:text-slate-900 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Dashboard
              </button>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900">History</h2>
                <p className="text-slate-500">All your past assessments.</p>
              </div>

              <RecordList 
                records={records} 
                onSelect={handleSelectRecord}
                onDelete={handleDelete}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-xl border-t border-slate-100 px-8 py-4 flex items-center justify-between z-30">
        <button 
          onClick={() => setView('dashboard')}
          className={cn(
            "p-2 transition-all flex flex-col items-center gap-1",
            view === 'dashboard' ? "text-emerald-500 scale-110" : "text-slate-300"
          )}
        >
          <Heart className={cn("w-6 h-6", view === 'dashboard' && "fill-emerald-500")} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
        </button>
        
        <button 
          onClick={startNewAssessment}
          className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-100 -mt-10 border-4 border-white active:scale-90 transition-transform"
        >
          <Plus className="w-8 h-8" />
        </button>

        <button 
          onClick={() => setView('history')}
          className={cn(
            "p-2 transition-all flex flex-col items-center gap-1",
            view === 'history' ? "text-emerald-500 scale-110" : "text-slate-300"
          )}
        >
          <History className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">History</span>
        </button>
      </nav>

      {/* Loading Overlay */}
      {loading && view !== 'assess' && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-100 animate-bounce">
            <Heart className="w-8 h-8 text-white fill-white" />
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-slate-900">Kinga is thinking...</p>
            <p className="text-sm text-slate-500">Analyzing symptoms for you.</p>
          </div>
        </div>
      )}

      {currentResult && (
        <OutbreakAlertModal 
          isOpen={isOutbreakModalOpen}
          onClose={() => setIsOutbreakModalOpen(false)}
          patientName={patientName}
          age={age}
          symptoms={symptoms}
          result={currentResult}
          onSend={(summary) => {
            console.log('Sending outbreak alert:', summary);
            setIsOutbreakModalOpen(false);
            alert('Outbreak alert sent to district officials.');
          }}
        />
      )}

      <LiveAssessment 
        isOpen={isLiveAssessmentOpen}
        onClose={() => setIsLiveAssessmentOpen(false)}
        onComplete={(data) => {
          setPatientName(data.name);
          setAge(data.age);
          setSymptoms(data.symptoms);
          setIsLiveAssessmentOpen(false);
        }}
      />
    </div>
  );
}

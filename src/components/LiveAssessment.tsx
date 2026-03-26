import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { Mic, MicOff, Loader2, X, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface LiveAssessmentProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: { name: string; age: string; symptoms: string }) => void;
}

export const LiveAssessment: React.FC<LiveAssessmentProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef(false);

  const startSession = async () => {
    setIsConnecting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      
      const session = await ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } },
          },
          systemInstruction: `
            You are Kinga, a helpful AI assistant for Community Health Volunteers. 
            Your goal is to have a FAST and CONCISE conversation to gather patient information.
            
            FOLLOW THIS FLOW:
            1. Ask for the patient's name.
            2. Ask for the patient's age.
            3. Ask for the symptoms.
            
            Be empathetic but brief. Do not use long sentences.
            
            When you have all three pieces of information (Name, Age, Symptoms), you MUST summarize them exactly like this: 
            "I have all the information now. Name: [Name], Age: [Age], Symptoms: [Symptoms]. Let's proceed with the assessment."
            
            Replace [Name], [Age], and [Symptoms] with the actual data collected. 
            Ensure the format is exact: "Name: ..., Age: ..., Symptoms: ..." followed by a period.
          `,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);
            startAudioCapture();
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts) {
              for (const part of message.serverContent.modelTurn.parts) {
                if (part.inlineData?.data) {
                  const base64Data = part.inlineData.data;
                  const binary = atob(base64Data);
                  const buffer = new Int16Array(binary.length / 2);
                  for (let i = 0; i < buffer.length; i++) {
                    buffer[i] = (binary.charCodeAt(i * 2) & 0xFF) | (binary.charCodeAt(i * 2 + 1) << 8);
                  }
                  audioQueueRef.current.push(buffer);
                  if (!isPlayingRef.current) {
                    playNextChunk();
                  }
                }
              }
            }

            if (message.serverContent?.interrupted) {
              audioQueueRef.current = [];
              isPlayingRef.current = false;
            }

            if (message.serverContent?.modelTurn?.parts?.[0]?.text) {
              const text = message.serverContent.modelTurn.parts[0].text;
              setTranscript(prev => [...prev, `AI: ${text}`]);
              
              if (text.toLowerCase().includes("i have all the information now")) {
                const nameMatch = text.match(/Name: (.*?),/i);
                const ageMatch = text.match(/Age: (.*?),/i);
                const symptomsMatch = text.match(/Symptoms: (.*?)(?:\.|$)/i);

                if (nameMatch && ageMatch && symptomsMatch) {
                  onComplete({
                    name: nameMatch[1].trim(),
                    age: ageMatch[1].trim(),
                    symptoms: symptomsMatch[1].trim()
                  });
                } else {
                  console.warn("Failed to parse voice summary:", text);
                  // Fallback: try to extract whatever we can
                  onComplete({
                    name: nameMatch?.[1]?.trim() || "",
                    age: ageMatch?.[1]?.trim() || "",
                    symptoms: symptomsMatch?.[1]?.trim() || text
                  });
                }
              }
            }
          },
          onclose: () => {
            stopAudioCapture();
            setIsConnected(false);
          },
          onerror: (error) => {
            console.error("Live API Error:", error);
            setIsConnecting(false);
          }
        }
      });

      sessionRef.current = session;
    } catch (error) {
      console.error("Failed to connect to Live API:", error);
      setIsConnecting(false);
    }
  };

  const startAudioCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (isMuted) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }
        
        const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
        sessionRef.current?.sendRealtimeInput({
          audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
        });
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
    } catch (error) {
      console.error("Error capturing audio:", error);
    }
  };

  const stopAudioCapture = () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    processorRef.current?.disconnect();
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
  };

  const playNextChunk = async () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;
    const chunk = audioQueueRef.current.shift()!;
    
    if (!audioContextRef.current) return;

    const audioBuffer = audioContextRef.current.createBuffer(1, chunk.length, 16000);
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < chunk.length; i++) {
      channelData[i] = chunk[i] / 0x7FFF;
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    source.onended = playNextChunk;
    source.start();
  };

  useEffect(() => {
    if (isOpen && !isConnected && !isConnecting) {
      startSession();
    }
    return () => {
      sessionRef.current?.close();
      stopAudioCapture();
    };
  }, [isOpen]);

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
            className="relative w-full max-w-sm bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col h-[80vh]"
          >
            <div className="bg-emerald-600 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Voice Assistant</h2>
                  <p className="text-xs text-emerald-100">
                    {isConnecting ? "Connecting..." : isConnected ? "Listening..." : "Disconnected"}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50">
              {transcript.map((line, i) => (
                <div key={i} className={cn(
                  "p-3 rounded-2xl max-w-[85%] text-sm",
                  line.startsWith("AI:") ? "bg-white text-slate-800 self-start shadow-sm" : "bg-emerald-500 text-white self-end ml-auto"
                )}>
                  {line.replace(/^(AI|User): /, "")}
                </div>
              ))}
              {isConnecting && (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                </div>
              )}
            </div>

            <div className="p-6 bg-white border-t border-slate-100 flex items-center justify-center gap-6">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center transition-all",
                  isMuted ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
                )}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
              
              <div className="flex flex-col items-center gap-1">
                <div className="flex gap-1 h-8 items-center">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <motion.div
                      key={i}
                      animate={{
                        height: isConnected && !isMuted ? [8, 24, 8] : 8
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.5,
                        delay: i * 0.1
                      }}
                      className="w-1 bg-emerald-500 rounded-full"
                    />
                  ))}
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {isMuted ? "Muted" : "Active"}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

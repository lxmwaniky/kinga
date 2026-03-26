import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, X, Check, RefreshCw, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

interface CameraCaptureProps {
  onCapture: (base64: string) => void;
  onClear: () => void;
  image?: string;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClear, image }) => {
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsLive(true);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Could not access camera. Please use upload instead.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsLive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg');
        onCapture(base64);
        stopCamera();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onCapture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  if (image) {
    return (
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden border-2 border-slate-200 shadow-inner group">
        <img src={image} alt="Captured symptom" className="w-full h-full object-cover" />
        <button
          onClick={onClear}
          className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-emerald-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
          <Check className="w-4 h-4" />
          Image Ready
        </div>
      </div>
    );
  }

  if (isLive) {
    return (
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border-2 border-slate-200 shadow-2xl">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        <div className="absolute inset-x-0 bottom-6 flex justify-center items-center gap-6">
          <button
            onClick={stopCamera}
            className="p-3 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/30 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
          
          <button
            onClick={capturePhoto}
            className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-transform"
          >
            <div className="w-12 h-12 rounded-full border-4 border-slate-900" />
          </button>

          <div className="w-12" /> {/* Spacer */}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={startCamera}
          className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
        >
          <div className="p-3 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
            <Camera className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-700 text-sm">Take Photo</p>
            <p className="text-[10px] text-slate-500">Live camera</p>
          </div>
        </button>

        <button 
          onClick={() => galleryInputRef.current?.click()}
          className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
        >
          <div className="p-3 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
            <Upload className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-700 text-sm">Upload</p>
            <p className="text-[10px] text-slate-500">From gallery</p>
          </div>
          <input 
            ref={galleryInputRef}
            type="file" 
            accept="image/*" 
            onChange={handleFileChange}
            className="hidden"
          />
        </button>
      </div>
      {error && (
        <p className="text-[10px] text-red-500 font-medium text-center">{error}</p>
      )}
    </div>
  );
};

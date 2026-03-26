import React, { useRef, useState } from 'react';
import { Camera, Upload, X, Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface CameraCaptureProps {
  onCapture: (base64: string) => void;
  onClear: () => void;
  image?: string;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClear, image }) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div 
          onClick={() => cameraInputRef.current?.click()}
          className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
        >
          <div className="p-3 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
            <Camera className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-700 text-sm">Take Photo</p>
            <p className="text-[10px] text-slate-500">Use camera</p>
          </div>
          <input 
            ref={cameraInputRef}
            type="file" 
            accept="image/*" 
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <div 
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
        </div>
      </div>
    </div>
  );
};

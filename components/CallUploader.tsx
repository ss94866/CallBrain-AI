import React, { useState } from 'react';
import { UploadCloud, FileAudio, Loader2, AlertCircle } from 'lucide-react';
import { analyzeAudio } from '../services/geminiService';
import { CallRecord } from '../types';

interface CallUploaderProps {
  onAnalysisComplete: (record: CallRecord) => void;
  onCancel: () => void;
}

const CallUploader: React.FC<CallUploaderProps> = ({ onAnalysisComplete, onCancel }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    // We check strict size limit later after potential conversion, 
    // but block obviously huge files (> 100MB) upfront to save processing time.
    if (file.size > 100 * 1024 * 1024) {
        setError(`File is too large. Please upload a file smaller than 100MB.`);
        setFile(null);
        return;
    }

    const isValidType = 
        file.type.startsWith('audio/') || 
        file.type.startsWith('video/mp4') ||
        file.name.toLowerCase().endsWith('.mp4') ||
        file.name.toLowerCase().endsWith('.m4a');

    if (isValidType) {
        setFile(file);
        setError(null);
    } else {
        setError('Please upload a valid audio file (MP3, WAV, M4A, MP4).');
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    const newRecord: CallRecord = {
      id: Date.now().toString(),
      fileName: file.name,
      timestamp: Date.now(),
      status: 'processing',
    };

    try {
      const analysis = await analyzeAudio(file);
      
      const completedRecord: CallRecord = {
        ...newRecord,
        status: 'completed',
        analysis: analysis,
      };

      onAnalysisComplete(completedRecord);
    } catch (err: any) {
      console.error(err);
      let errorMessage = 'Analysis failed. Please try again.';
      
      if (err.message && typeof err.message === 'string') {
        if (err.message.includes('API Key')) errorMessage = 'API Key is missing or invalid.';
        else if (err.message.includes('File size')) errorMessage = err.message;
        else if (err.message.includes('500') || err.message.includes('Internal')) errorMessage = 'Server error. Please try a shorter audio clip.';
      }
      
      setError(errorMessage);
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 animate-fade-in">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">New Call Analysis</h2>
        <p className="text-slate-500 mb-8 text-center">Upload a recording to extract insights using Gemini.</p>

        {!isProcessing ? (
            <>
                <div
                className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer
                    ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400 bg-slate-50'}
                    ${error ? 'border-red-300 bg-red-50' : ''}
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload')?.click()}
                >
                <input
                    id="file-upload"
                    type="file"
                    accept="audio/*,video/mp4,.m4a"
                    className="hidden"
                    onChange={handleFileChange}
                />
                
                {file ? (
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                            <FileAudio size={32} />
                        </div>
                        <p className="font-medium text-slate-800 text-lg">{file.name}</p>
                        <p className="text-slate-500 text-sm mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                         {(file.name.toLowerCase().endsWith('.mp4') || file.name.toLowerCase().endsWith('.m4a')) && (
                             <p className="text-amber-600 text-xs mt-2 bg-amber-50 px-2 py-1 rounded">
                                 Will be converted to WAV
                             </p>
                         )}
                        <p className="text-blue-600 text-sm mt-4 font-medium">Click to change file</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-slate-200 text-slate-400 rounded-full flex items-center justify-center mb-4">
                            <UploadCloud size={32} />
                        </div>
                        <p className="font-medium text-slate-700 text-lg">Click or Drag audio file here</p>
                        <p className="text-slate-400 text-sm mt-2">Supports MP3, WAV, M4A, MP4</p>
                    </div>
                )}
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center text-sm">
                        <AlertCircle size={16} className="mr-2" />
                        {error}
                    </div>
                )}

                <div className="mt-8 flex space-x-4">
                    <button 
                        onClick={onCancel}
                        className="flex-1 py-3 px-6 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleProcess}
                        disabled={!file}
                        className={`flex-1 py-3 px-6 rounded-xl font-medium text-white transition-all shadow-lg shadow-blue-500/20
                            ${file ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed'}
                        `}
                    >
                        {file && (file.name.endsWith('.mp4') || file.name.endsWith('.m4a')) ? 'Convert & Analyze' : 'Analyze Call'}
                    </button>
                </div>
            </>
        ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="relative mb-6">
                    <div className="w-20 h-20 rounded-full border-4 border-blue-100 animate-pulse"></div>
                    <div className="absolute top-0 left-0 w-20 h-20 rounded-full border-4 border-t-blue-600 animate-spin"></div>
                    <div className="absolute top-0 left-0 w-20 h-20 flex items-center justify-center text-blue-600">
                         <Loader2 size={32} />
                    </div>
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Processing Audio...</h3>
                <p className="text-slate-500 max-w-xs mx-auto">
                    Optimizing audio format and extracting insights. This may take a minute.
                </p>
            </div>
        )}
      </div>
    </div>
  );
};

export default CallUploader;
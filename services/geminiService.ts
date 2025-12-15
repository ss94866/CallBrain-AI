import { GoogleGenAI } from "@google/genai";
import { CallAnalysis, CallSentiment } from "../types";

// --- Audio Conversion Helpers ---

// Writes a standard WAV header for PCM data
const writeWavHeader = (
  view: DataView, 
  sampleRate: number, 
  numChannels: number, 
  dataLength: number
) => {
  const fileLength = dataLength + 36;
  
  // RIFF identifier
  view.setUint32(0, 0x52494646, false); // "RIFF"
  // file length
  view.setUint32(4, fileLength, true);
  // RIFF type
  view.setUint32(8, 0x57415645, false); // "WAVE"
  // format chunk identifier
  view.setUint32(12, 0x666d7420, false); // "fmt "
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * numChannels * 2, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, numChannels * 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  view.setUint32(36, 0x64617461, false); // "data"
  // data chunk length
  view.setUint32(40, dataLength, true);
};

// Converts AudioBuffer to WAV Blob (16-bit PCM)
const audioBufferToWav = (buffer: AudioBuffer): Blob => {
  const numChannels = buffer.numberOfChannels;
  const length = buffer.length * numChannels * 2; // 2 bytes per sample
  const arrayBuffer = new ArrayBuffer(44 + length);
  const view = new DataView(arrayBuffer);

  writeWavHeader(view, buffer.sampleRate, numChannels, length);

  // Write interleaved data
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = buffer.getChannelData(channel)[i];
      // Clamp value to -1 to 1
      const clamped = Math.max(-1, Math.min(1, sample));
      // Scale to 16-bit integer (using 0x7FFF)
      // We use a conditional to handle positive/negative scaling slightly differently to avoid wrapping,
      // but simple multiplication is usually sufficient for WebAudio ranges.
      const int16 = clamped < 0 ? clamped * 0x8000 : clamped * 0x7FFF;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
};

// Decodes audio file and downsamples to 16kHz Mono WAV
const convertMp4ToWav = async (file: File): Promise<Blob> => {
  const arrayBuffer = await file.arrayBuffer();
  // Decode audio data
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  // We want to resample to 16000Hz Mono to save space
  const targetSampleRate = 16000;
  const targetChannels = 1;
  
  // Calculate new length
  const offlineCtx = new OfflineAudioContext(
    targetChannels, 
    audioBuffer.duration * targetSampleRate, 
    targetSampleRate
  );

  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineCtx.destination);
  source.start();

  const resampledBuffer = await offlineCtx.startRendering();
  
  return audioBufferToWav(resampledBuffer);
};


// --- Existing Service Logic ---

const fileToGenerativePart = async (file: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const getMimeType = (file: Blob, originalName?: string): string => {
   if (file.type === 'audio/wav') return 'audio/wav';
   
   // Fallback map if blob type is generic
   if (originalName) {
       const ext = originalName.split('.').pop()?.toLowerCase();
       if (ext === 'mp3') return 'audio/mpeg';
       if (ext === 'wav') return 'audio/wav';
       if (ext === 'm4a') return 'audio/mp4';
   }
   return file.type || 'audio/mp3';
};

const cleanAndParseJSON = (text: string): any => {
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
  const match = text.match(codeBlockRegex);
  const cleanText = match ? match[1] : text;
  return JSON.parse(cleanText);
};

export const analyzeAudio = async (input: File): Promise<CallAnalysis> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  let finalBlob: Blob = input;
  let finalMimeType = input.type;
  
  // Check if we need to convert (MP4 or M4A)
  const needsConversion = 
    input.type.includes('mp4') || 
    input.name.toLowerCase().endsWith('.mp4') || 
    input.name.toLowerCase().endsWith('.m4a');

  if (needsConversion) {
    try {
      console.log('Converting MP4/M4A to WAV...');
      finalBlob = await convertMp4ToWav(input);
      finalMimeType = 'audio/wav';
      console.log('Conversion complete. New size:', (finalBlob.size / 1024 / 1024).toFixed(2), 'MB');
    } catch (e) {
      console.error('Conversion failed', e);
      throw new Error("Failed to convert audio file. The file might be corrupted or incompatible.");
    }
  }

  // 10MB limit for safe inline processing.
  // Note: 10MB WAV at 16kHz Mono is ~5 minutes.
  if (finalBlob.size > 10 * 1024 * 1024) {
    throw new Error(`Processed file size (${(finalBlob.size / (1024 * 1024)).toFixed(1)}MB) exceeds the 10MB limit. Please upload a shorter recording.`);
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = await fileToGenerativePart(finalBlob);
  // Ensure we pass the correct MIME type for the *converted* file (wav) or original
  const mimeType = finalMimeType === 'audio/wav' ? 'audio/wav' : getMimeType(finalBlob, input.name);

  const prompt = `
    You are an expert Call Analyst AI (CallBrain). 
    Listen to the provided audio file.
    Your task is to return a raw JSON object with this structure:
    {
      "transcript": "Full text transcript...",
      "summary": "Concise summary...",
      "sentiment": "Positive | Neutral | Negative",
      "actionItems": ["Todo 1", "Todo 2"],
      "keyInsights": ["Insight 1", "Insight 2"]
    }
    
    Do not wrap in markdown. Return raw JSON.
    Translate non-English parts to English.
  `;

  let attempt = 0;
  const maxRetries = 3;

  while (attempt < maxRetries) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            },
            { text: prompt }
          ]
        },
      });

      if (response.text) {
        try {
            return cleanAndParseJSON(response.text) as CallAnalysis;
        } catch (e) {
            console.error("JSON Parse Error:", e);
            throw new Error("Failed to parse AI response.");
        }
      } else {
        throw new Error("Empty response from Gemini");
      }
    } catch (error: any) {
      console.error(`Attempt ${attempt + 1} Failed:`, error);
      
      const isRetryable = error.message?.includes('500') || error.message?.includes('503') || error.status === 500 || error.status === 503;
      
      if (isRetryable && attempt < maxRetries - 1) {
        attempt++;
        await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, attempt)));
        continue;
      }
      
      if (error.message?.includes('400')) {
          throw new Error("Invalid request. The file format might not be supported.");
      }
      throw error;
    }
  }

  throw new Error("Analysis failed after multiple attempts.");
};
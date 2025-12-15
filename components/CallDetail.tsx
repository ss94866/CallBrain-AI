import React from 'react';
import { CallRecord, CallSentiment } from '../types';
import { ArrowLeft, CheckSquare, MessageSquare, Lightbulb, User, Clock, Download, FileText } from 'lucide-react';

interface CallDetailProps {
  call: CallRecord;
  onBack: () => void;
}

const CallDetail: React.FC<CallDetailProps> = ({ call, onBack }) => {
  if (!call.analysis) return null;

  const { transcript, summary, sentiment, actionItems, keyInsights } = call.analysis;

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      <button 
        onClick={onBack}
        className="flex items-center text-slate-500 hover:text-slate-800 mb-6 transition-colors group"
      >
        <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Metadata & Summary & Todos */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Header Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 break-all">{call.fileName}</h1>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-slate-500">
                        <span className="flex items-center"><Clock size={14} className="mr-1"/> {new Date(call.timestamp).toLocaleString()}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border
                            ${sentiment === CallSentiment.POSITIVE ? 'bg-green-50 text-green-700 border-green-200' :
                              sentiment === CallSentiment.NEGATIVE ? 'bg-red-50 text-red-700 border-red-200' :
                              'bg-slate-50 text-slate-700 border-slate-200'}
                        `}>
                            {sentiment} Sentiment
                        </span>
                    </div>
                </div>
            </div>
            
            <div className="mt-6">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center">
                    <FileText size={16} className="mr-2" /> Executive Summary
                </h3>
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                    {summary}
                </p>
            </div>
          </div>

          {/* Action Items */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <CheckSquare className="mr-2 text-blue-600" /> Action Items
            </h3>
            {actionItems.length > 0 ? (
                <ul className="space-y-3">
                    {actionItems.map((item, idx) => (
                        <li key={idx} className="flex items-start group">
                            <input type="checkbox" className="mt-1 mr-3 w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                            <span className="text-slate-700 group-hover:text-slate-900">{item}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-slate-400 italic">No specific action items detected.</p>
            )}
          </div>

          {/* Transcript */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <MessageSquare className="mr-2 text-purple-600" /> Full Transcript
            </h3>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 max-h-[500px] overflow-y-auto whitespace-pre-wrap text-slate-700 leading-relaxed text-sm font-mono">
                {transcript}
            </div>
          </div>
        </div>

        {/* Right Column: Insights & Details */}
        <div className="space-y-6">
            
            {/* Key Insights */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-2xl shadow-lg text-white">
                <h3 className="text-lg font-bold mb-4 flex items-center text-indigo-100">
                    <Lightbulb className="mr-2" /> Key Insights
                </h3>
                <ul className="space-y-4">
                    {keyInsights.map((insight, idx) => (
                        <li key={idx} className="flex items-start">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 mt-2 mr-3 flex-shrink-0"></div>
                            <span className="text-indigo-50 text-sm leading-relaxed">{insight}</span>
                        </li>
                    ))}
                    {keyInsights.length === 0 && <p className="text-indigo-200 text-sm italic">No specific insights detected.</p>}
                </ul>
            </div>

            {/* AI Info */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h4 className="text-sm font-semibold text-slate-800 mb-3">Analysis Model</h4>
                <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                        <span className="text-xl">✨</span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-900">Gemini 2.5 Flash</p>
                        <p className="text-xs text-slate-500">Multimodal Audio Processing</p>
                    </div>
                </div>
                <div className="border-t border-slate-100 pt-4">
                    <p className="text-xs text-slate-400">
                        This analysis was generated automatically. While usually accurate, always verify critical details in the transcript.
                    </p>
                </div>
            </div>

        </div>

      </div>
    </div>
  );
};

export default CallDetail;

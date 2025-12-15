import React, { useState } from 'react';
import { LayoutDashboard, Plus, Settings, PhoneIncoming } from 'lucide-react';
import Dashboard from './components/Dashboard';
import CallUploader from './components/CallUploader';
import CallDetail from './components/CallDetail';
import { CallRecord, ViewState } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('dashboard');
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);
  const [calls, setCalls] = useState<CallRecord[]>([]);

  const handleAnalysisComplete = (newCall: CallRecord) => {
    setCalls(prev => [newCall, ...prev]);
    setSelectedCall(newCall);
    setView('details');
  };

  const renderContent = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard calls={calls} onViewDetails={(call) => {
            setSelectedCall(call);
            setView('details');
        }} />;
      case 'upload':
        return <CallUploader 
            onAnalysisComplete={handleAnalysisComplete}
            onCancel={() => setView('dashboard')} 
        />;
      case 'details':
        return selectedCall ? (
          <CallDetail 
            call={selectedCall} 
            onBack={() => {
                setSelectedCall(null);
                setView('dashboard');
            }} 
          />
        ) : (
            // Fallback to Dashboard if no call is selected
            <Dashboard calls={calls} onViewDetails={(call) => {
                setSelectedCall(call);
                setView('details');
            }} />
        );
      default:
        return <Dashboard calls={calls} onViewDetails={() => {}} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-20 md:w-64 bg-white border-r border-slate-200 flex flex-col justify-between hidden sm:flex z-10">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-slate-100">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white mr-3 shadow-sm">
                <PhoneIncoming size={18} />
            </div>
            <span className="text-lg font-bold text-slate-800 hidden md:block tracking-tight">CallBrain</span>
          </div>

          <nav className="p-4 space-y-2">
            <button 
              onClick={() => setView('dashboard')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all
                ${view === 'dashboard' && !selectedCall ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}
              `}
            >
              <LayoutDashboard size={20} />
              <span className="hidden md:block">Dashboard</span>
            </button>
            <button 
              onClick={() => setView('upload')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all
                ${view === 'upload' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}
              `}
            >
              <Plus size={20} />
              <span className="hidden md:block">New Analysis</span>
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-100">
           <div className="hidden md:block p-4 bg-slate-50 rounded-xl mb-2 border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Status</p>
              <div className="flex items-center space-x-2">
                 <div className="w-2 h-2 rounded-full bg-green-500"></div>
                 <span className="text-xs text-slate-600">Gemini 2.5 Flash Active</span>
              </div>
           </div>
           <div className="px-4 py-3 text-slate-400 hover:text-slate-600 cursor-pointer flex items-center space-x-3 transition-colors">
              <Settings size={20} />
              <span className="hidden md:block">Settings</span>
           </div>
        </div>
      </aside>

      {/* Mobile Header (Only visible on small screens) */}
      <div className="sm:hidden fixed top-0 w-full h-16 bg-white border-b border-slate-200 z-20 flex items-center justify-between px-4">
         <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                <PhoneIncoming size={18} />
            </div>
            <span className="text-lg font-bold text-slate-800">CallBrain</span>
         </div>
         <button onClick={() => setView('upload')} className="p-2 bg-blue-50 text-blue-600 rounded-lg">
             <Plus size={20} />
         </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-16 sm:pt-0 relative">
        <div className="absolute top-0 w-full h-full">
            {renderContent()}
        </div>
      </main>

    </div>
  );
};

export default App;
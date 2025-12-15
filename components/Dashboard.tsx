import React from 'react';
import { CallRecord, CallSentiment } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Phone, CheckCircle, TrendingUp, AlertCircle, Clock } from 'lucide-react';

interface DashboardProps {
  calls: CallRecord[];
  onViewDetails: (call: CallRecord) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ calls, onViewDetails }) => {
  const completedCalls = calls.filter(c => c.status === 'completed');
  const totalCalls = completedCalls.length;
  
  const totalActionItems = completedCalls.reduce((acc, call) => acc + (call.analysis?.actionItems.length || 0), 0);
  
  const sentimentCounts = completedCalls.reduce((acc, call) => {
    const s = call.analysis?.sentiment || CallSentiment.NEUTRAL;
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sentimentData = [
    { name: 'Positive', value: sentimentCounts[CallSentiment.POSITIVE] || 0, color: '#22c55e' },
    { name: 'Neutral', value: sentimentCounts[CallSentiment.NEUTRAL] || 0, color: '#94a3b8' },
    { name: 'Negative', value: sentimentCounts[CallSentiment.NEGATIVE] || 0, color: '#ef4444' },
  ].filter(d => d.value > 0);

  // Mock activity data based on timestamps (just for visual if we had enough data, simplified here)
  const activityData = completedCalls.map((c, i) => ({
    name: `Call ${i + 1}`,
    actions: c.analysis?.actionItems.length || 0,
  }));

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500">Overview of your call insights and pending tasks.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Phone size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Processed Calls</p>
            <p className="text-2xl font-bold text-slate-800">{totalCalls}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Action Items</p>
            <p className="text-2xl font-bold text-slate-800">{totalActionItems}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Avg Sentiment</p>
            <p className="text-2xl font-bold text-slate-800">
             {sentimentData.length > 0 ? 'Analyzed' : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[300px]">
          <h3 className="text-lg font-semibold mb-4 text-slate-800">Action Items per Call</h3>
          {activityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={activityData}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="actions" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <p>No call data available yet.</p>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[300px]">
          <h3 className="text-lg font-semibold mb-4 text-slate-800">Sentiment Distribution</h3>
           {sentimentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
           ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <p>No sentiment data available yet.</p>
            </div>
           )}
        </div>
      </div>

      {/* Recent Calls List */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold mb-4 text-slate-800">Recent Calls</h3>
        {calls.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p>No calls processed yet. Upload an audio file to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-slate-500 text-sm border-b border-slate-100">
                  <th className="py-3 font-medium">Date</th>
                  <th className="py-3 font-medium">File Name</th>
                  <th className="py-3 font-medium">Status</th>
                  <th className="py-3 font-medium">Sentiment</th>
                  <th className="py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {calls.map((call) => (
                  <tr key={call.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-3 text-slate-600">
                      <div className="flex items-center space-x-2">
                        <Clock size={16} className="text-slate-400" />
                        <span>{new Date(call.timestamp).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="py-3 font-medium text-slate-800">{call.fileName}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        call.status === 'completed' ? 'bg-green-100 text-green-700' :
                        call.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {call.status.charAt(0).toUpperCase() + call.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3">
                       {call.analysis ? (
                         <span className={`flex items-center space-x-1 ${
                            call.analysis.sentiment === CallSentiment.POSITIVE ? 'text-green-600' :
                            call.analysis.sentiment === CallSentiment.NEGATIVE ? 'text-red-600' :
                            'text-slate-500'
                         }`}>
                           <span>{call.analysis.sentiment}</span>
                         </span>
                       ) : (
                         <span className="text-slate-400">-</span>
                       )}
                    </td>
                    <td className="py-3 text-right">
                      {call.status === 'completed' && (
                        <button 
                          onClick={() => onViewDetails(call)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-xs px-3 py-1 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                        >
                          View Report
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

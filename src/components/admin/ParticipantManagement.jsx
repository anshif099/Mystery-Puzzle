import React from 'react';
import { Search, Filter, Download } from 'lucide-react';

const ParticipantManagement = () => {
  const participants = [
    { id: '10293', name: 'John Doe', email: 'john@example.com', city: 'London', time: '01:42', attempts: 1, status: 'Solved', date: '2026-03-16' },
    { id: '10294', name: 'Alice Smith', email: 'alice@web.com', city: 'Paris', time: '02:15', attempts: 2, status: 'Solved', date: '2026-03-16' },
    { id: '10295', name: 'Bob Wilson', email: 'bob@test.io', city: 'Berlin', time: '--:--', attempts: 3, status: 'Failed', date: '2026-03-15' },
    { id: '10296', name: 'Emma Brown', email: 'emma@provider.net', city: 'New York', time: '00:58', attempts: 1, status: 'Solved', date: '2026-03-15' },
    { id: '10297', name: 'Sam Taylor', email: 'sam@cool.me', city: 'Tokyo', time: '--:--', attempts: 1, status: 'In Progress', date: '2026-03-16' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search participants by ID, name or email..." 
            className="w-full bg-white pl-12 pr-6 py-4 rounded-2xl border border-gray-100 soft-shadow outline-none focus:ring-4 focus:ring-sky-blue/10 transition-all font-medium"
          />
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white px-6 py-4 rounded-2xl border border-gray-100 border-b-4 hover:border-b-2 hover:translate-y-[2px] active:translate-y-[4px] active:border-b-0 transition-all font-bold text-gray-600">
            <Filter size={18} />
            Filter
          </button>
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-sky-blue text-white px-6 py-4 rounded-2xl shadow-lg shadow-sky-blue/20 hover:scale-105 active:scale-95 transition-all font-black">
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-gray-50 overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-8 py-6 text-sm font-black text-gray-600 uppercase tracking-widest">CID</th>
              <th className="px-8 py-6 text-sm font-black text-gray-600 uppercase tracking-widest">Name</th>
              <th className="px-8 py-6 text-sm font-black text-gray-600 uppercase tracking-widest">City</th>
              <th className="px-8 py-6 text-sm font-black text-gray-600 uppercase tracking-widest text-center">Attempts</th>
              <th className="px-8 py-6 text-sm font-black text-gray-600 uppercase tracking-widest text-center">Final Time</th>
              <th className="px-8 py-6 text-sm font-black text-gray-600 uppercase tracking-widest">Status</th>
              <th className="px-8 py-6 text-sm font-black text-gray-600 uppercase tracking-widest">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {participants.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50/30 transition-colors">
                <td className="px-8 py-6">
                  <span className="font-mono text-xs font-bold text-sky-blue bg-sky-blue/5 px-2 py-1 rounded-lg">#CHAL-{p.id}</span>
                </td>
                <td className="px-8 py-6">
                  <div className="font-bold text-gray-800">{p.name}</div>
                  <div className="text-xs font-medium text-gray-400">{p.email}</div>
                </td>
                <td className="px-8 py-6 font-medium text-gray-600">{p.city}</td>
                <td className="px-8 py-6 text-center font-black text-gray-500">{p.attempts}</td>
                <td className="px-8 py-6 text-center font-black text-gray-800 tabular-nums">{p.time}</td>
                <td className="px-8 py-6">
                  <span className={`px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-wider ${
                    p.status === 'Solved' ? 'bg-mint/10 text-mint' : 
                    p.status === 'Failed' ? 'bg-accent/10 text-accent' : 
                    'bg-soft-yellow/20 text-yellow-600'
                  }`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-8 py-6 font-medium text-gray-400 text-sm italic">{p.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ParticipantManagement;

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Eye } from 'lucide-react';

const CompanyManagement = () => {
  const [showModal, setShowModal] = useState(false);
  const companies = [
    { id: 1, name: 'EduTrack Global', admin: 'Sarah Connor', email: 'sarah@edutrack.com', campaigns: 12, status: 'Active' },
    { id: 2, name: 'SkillSet Academy', admin: 'James Miller', email: 'james@skillset.com', campaigns: 8, status: 'Active' },
    { id: 3, name: 'Future Minds', admin: 'Elena Gilbert', email: 'elena@futureminds.io', campaigns: 4, status: 'Disabled' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4 bg-white p-2 px-6 rounded-2xl shadow-sm border border-gray-50">
          <span className="text-mint font-black text-2xl">24</span>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Active Companies</span>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          className="bg-mint text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-mint/20"
        >
          <Plus size={20} />
          CREATE COMPANY ADMIN
        </button>
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-gray-50 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-8 py-6 text-sm font-black text-gray-600 uppercase tracking-widest">Company Name</th>
              <th className="px-8 py-6 text-sm font-black text-gray-600 uppercase tracking-widest">Admin Name</th>
              <th className="px-8 py-6 text-sm font-black text-gray-600 uppercase tracking-widest">Email</th>
              <th className="px-8 py-6 text-sm font-black text-gray-600 uppercase tracking-widest">Campaigns</th>
              <th className="px-8 py-6 text-sm font-black text-gray-600 uppercase tracking-widest">Status</th>
              <th className="px-8 py-6 text-sm font-black text-gray-600 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {companies.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50/30 transition-colors">
                <td className="px-8 py-6 font-bold text-gray-800">{c.name}</td>
                <td className="px-8 py-6 font-medium text-gray-600">{c.admin}</td>
                <td className="px-8 py-6 font-medium text-gray-600">{c.email}</td>
                <td className="px-8 py-6">
                  <span className="bg-sky-blue/10 text-sky-blue px-3 py-1 rounded-full font-black text-xs">{c.campaigns}</span>
                </td>
                <td className="px-8 py-6">
                  <span className={`px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-wider ${
                    c.status === 'Active' ? 'bg-mint/10 text-mint' : 'bg-accent/10 text-accent'
                  }`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex justify-end gap-2">
                    <button className="p-2 text-gray-400 hover:text-sky-blue hover:bg-sky-blue/10 rounded-lg transition-all"><Eye size={18} /></button>
                    <button className="p-2 text-gray-400 hover:text-mint hover:bg-mint/10 rounded-lg transition-all"><Edit2 size={18} /></button>
                    <button className="p-2 text-gray-400 hover:text-accent hover:bg-accent/10 rounded-lg transition-all"><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[40px] p-12 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-3xl font-black text-gray-900 mb-8">Create Company Admin</h3>
            <form className="grid md:grid-cols-2 gap-6" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-gray-500 tracking-widest ml-1">Company Name</label>
                <input type="text" className="w-full bg-gray-50 p-4 rounded-2xl outline-none focus:ring-4 focus:ring-mint/10 focus:bg-white transition-all font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-gray-500 tracking-widest ml-1">Admin Name</label>
                <input type="text" className="w-full bg-gray-50 p-4 rounded-2xl outline-none focus:ring-4 focus:ring-mint/10 focus:bg-white transition-all font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-gray-500 tracking-widest ml-1">Email</label>
                <input type="email" className="w-full bg-gray-50 p-4 rounded-2xl outline-none focus:ring-4 focus:ring-mint/10 focus:bg-white transition-all font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-gray-500 tracking-widest ml-1">Password</label>
                <input type="password" placeholder="••••••••" className="w-full bg-gray-50 p-4 rounded-2xl outline-none focus:ring-4 focus:ring-mint/10 focus:bg-white transition-all font-bold" />
              </div>
              <div className="md:col-span-2 flex gap-4 mt-6">
                <button type="submit" className="flex-1 bg-mint text-white py-4 rounded-2xl font-black hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-mint/20">CREATE ADMIN</button>
                <button type="button" onClick={() => setShowModal(false)} className="px-8 bg-gray-100 text-gray-500 py-4 rounded-2xl font-black hover:bg-gray-200 transition-all">CANCEL</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyManagement;

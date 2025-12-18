
import React, { useState, useEffect } from 'react';
import { analyzeComplaint } from './services/geminiService';
import { gmailService } from './services/gmailService';
import { ComplaintAnalysis, AppState, EmailMessage } from './types';
import { Button } from './components/Button';
import { AnalysisDisplay } from './components/AnalysisDisplay';
import { GmailInbox } from './components/GmailInbox';
import { 
  Sparkles, 
  History, 
  LayoutDashboard, 
  Search, 
  Trash2, 
  FileText,
  BrainCircuit,
  Settings,
  HelpCircle,
  Menu,
  X,
  Mail,
  ArrowRight,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    history: [],
    currentAnalysis: null,
    isLoading: false,
    error: null,
    isGmailConnected: false,
    gmailEmails: [],
    googleClientId: localStorage.getItem('sentix_google_client_id'),
  });
  
  const [inputText, setInputText] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'gmail' | 'settings'>('dashboard');
  const [tempClientId, setTempClientId] = useState(appState.googleClientId || '');

  useEffect(() => {
    const saved = localStorage.getItem('sentix_history');
    const token = localStorage.getItem('gmail_access_token');
    
    if (saved) {
      try {
        setAppState(prev => ({ ...prev, history: JSON.parse(saved) }));
      } catch (e) { console.error(e); }
    }

    if (token) {
      gmailService.setToken(token);
      setAppState(prev => ({ ...prev, isGmailConnected: true }));
      refreshGmail();
    }

    const handleAuth = (e: any) => {
      const accessToken = e.detail;
      localStorage.setItem('gmail_access_token', accessToken);
      setAppState(prev => ({ ...prev, isGmailConnected: true }));
      refreshGmail();
    };

    window.addEventListener('gmail-auth-success', handleAuth);
    return () => window.removeEventListener('gmail-auth-success', handleAuth);
  }, []);

  const refreshGmail = async () => {
    setAppState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const emails = await gmailService.fetchEmails();
      setAppState(prev => ({ ...prev, gmailEmails: emails, isLoading: false }));
    } catch (err: any) {
      setAppState(prev => ({ ...prev, isLoading: false, error: "Gmail access expired or unauthorized." }));
      if (err.message === "Unauthorized") {
        localStorage.removeItem('gmail_access_token');
        setAppState(prev => ({ ...prev, isGmailConnected: false }));
      }
    }
  };

  const handleAnalyze = async (email?: EmailMessage) => {
    const text = email ? email.content : inputText;
    if (!text.trim()) return;

    setAppState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await analyzeComplaint(text);
      const newAnalysis: ComplaintAnalysis = {
        ...result,
        id: Math.random().toString(36).substring(7),
        sourceEmailId: email?.id,
        originalText: text,
        timestamp: Date.now(),
      };

      setAppState(prev => {
        const updatedHistory = [newAnalysis, ...prev.history];
        localStorage.setItem('sentix_history', JSON.stringify(updatedHistory));
        return {
          ...prev,
          currentAnalysis: newAnalysis,
          history: updatedHistory,
          isLoading: false,
        };
      });
      
      if (!email) setInputText('');
      setActiveTab('dashboard');
    } catch (err: any) {
      setAppState(prev => ({ ...prev, isLoading: false, error: err.message }));
    }
  };

  const handleSendReply = async (analysisId: string, replyText: string) => {
    const analysis = appState.history.find(h => h.id === analysisId);
    if (!analysis || !analysis.sourceEmailId) return;

    try {
      const email = appState.gmailEmails.find(e => e.id === analysis.sourceEmailId);
      if (email) {
        await gmailService.sendReply(email.from, email.subject, replyText, email.id);
        setAppState(prev => ({
          ...prev,
          gmailEmails: prev.gmailEmails.map(e => 
            e.id === analysis.sourceEmailId ? { ...e, isReplied: true, aiReplySnippet: replyText.substring(0, 50) + '...' } : e
          )
        }));
        setTimeout(() => { setActiveTab('gmail'); setAppState(prev => ({ ...prev, currentAnalysis: null })); }, 1500);
      }
    } catch (err) {
      setAppState(prev => ({ ...prev, error: "Failed to send Gmail reply." }));
    }
  };

  const connectGmail = async () => {
    if (!appState.googleClientId || appState.googleClientId.includes('YOUR_GOOGLE_CLIENT_ID')) {
      setActiveTab('settings');
      setAppState(prev => ({ ...prev, error: "Please enter your Google Client ID first." }));
      return;
    }
    try {
      await gmailService.authenticate();
    } catch (err: any) {
      setAppState(prev => ({ ...prev, error: err.message }));
    }
  };

  const saveClientId = () => {
    if (!tempClientId.trim()) return;
    gmailService.setClientId(tempClientId);
    setAppState(prev => ({ ...prev, googleClientId: tempClientId, error: null }));
    alert("Configuration saved! You can now try connecting to Gmail.");
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex text-gray-900 font-['Inter']">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:w-72 shadow-xl md:shadow-none`}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <BrainCircuit size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Sentix</h1>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Live Support Analyst</p>
            </div>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1">
            <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-gray-500 hover:bg-gray-50'}`}><LayoutDashboard size={20} /> Dashboard</button>
            <button onClick={() => setActiveTab('gmail')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'gmail' ? 'bg-red-50 text-red-600 font-semibold' : 'text-gray-500 hover:bg-gray-50'}`}><Mail size={20} /> Gmail Inbox</button>
            <button onClick={() => setActiveTab('history')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'history' ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-gray-500 hover:bg-gray-50'}`}><History size={20} /> Audit Trail</button>
            <div className="h-px bg-gray-100 my-4"></div>
            <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-gray-100 text-gray-900 font-semibold' : 'text-gray-500 hover:bg-gray-50'}`}><Settings size={20} /> Integration Setup</button>
          </nav>
          <div className="p-4 mt-auto">
            {appState.isGmailConnected ? (
              <div className="bg-green-600 rounded-2xl p-4 text-white shadow-lg">
                <div className="flex items-center gap-2 mb-1"><ShieldCheck size={16}/><span className="text-xs font-bold uppercase">Authenticated</span></div>
                <p className="text-[10px] opacity-90 leading-relaxed">Connected to live Gmail. Analysis is real-time.</p>
              </div>
            ) : (
              <Button onClick={connectGmail} variant="secondary" className="w-full !py-2 !text-xs shadow-sm">
                <Mail size={14} className="text-red-500" /> Link Support Gmail
              </Button>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden max-w-7xl mx-auto w-full">
        <header className="h-20 border-b border-gray-200 bg-white px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 text-gray-400">
            <Search size={20} />
            <input type="text" placeholder="Search analysis reports..." className="bg-transparent border-none focus:ring-0 text-sm w-48 md:w-64" />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end hidden sm:flex"><span className="text-xs font-bold">Admin Panel</span><span className="text-[10px] text-gray-400">Support Ops</span></div>
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">JD</div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {activeTab === 'dashboard' ? (
            <div className="space-y-8 max-w-5xl mx-auto">
              {!appState.isGmailConnected && (
                <div className="bg-gradient-to-r from-red-500 to-indigo-600 rounded-3xl p-6 text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm"><Mail size={32} /></div>
                    <div><h3 className="text-lg font-bold">Link Your Real Organization Inbox</h3><p className="text-white/80 text-sm">Automate support replies and sentiment tracking directly from Gmail.</p></div>
                  </div>
                  <Button onClick={connectGmail} className="!bg-white !text-indigo-600 whitespace-nowrap">Connect Gmail <ArrowRight size={18} /></Button>
                </div>
              )}
              
              <section className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold mb-2">Instant Analysis</h2>
                <p className="text-gray-400 text-sm mb-6">Paste a single complaint or feedback snippet to analyze urgency and recommended steps.</p>
                <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="E.g., 'I ordered a product 2 weeks ago and still haven't received it...'" className="w-full h-32 p-4 bg-gray-50 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all mb-4 resize-none" />
                <div className="flex justify-end gap-3 items-center">
                   {appState.error && <span className="text-xs text-red-500 font-medium">{appState.error}</span>}
                   <Button onClick={() => handleAnalyze()} isLoading={appState.isLoading} disabled={!inputText.trim()} className="shadow-lg shadow-indigo-100"><Sparkles size={18} /> Deep Analyze</Button>
                </div>
              </section>

              {appState.currentAnalysis && (
                <AnalysisDisplay analysis={appState.currentAnalysis} onClose={() => setAppState(prev => ({ ...prev, currentAnalysis: null }))} onSendReply={handleSendReply} />
              )}
            </div>
          ) : activeTab === 'gmail' ? (
            <GmailInbox emails={appState.gmailEmails} onAnalyze={handleAnalyze} onDisconnect={() => { localStorage.removeItem('gmail_access_token'); setAppState(prev => ({ ...prev, isGmailConnected: false, gmailEmails: [] })); }} isLoading={appState.isLoading} />
          ) : activeTab === 'history' ? (
            <div className="space-y-6">
               <h2 className="text-2xl font-bold">Audit History</h2>
               {appState.history.length === 0 ? (
                 <div className="py-20 text-center text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200"><History size={40} className="mx-auto mb-4 opacity-20"/><p>No analysis records found.</p></div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {appState.history.map((item) => (
                    <div key={item.id} onClick={() => { setAppState(prev => ({ ...prev, currentAnalysis: item })); setActiveTab('dashboard'); }} className="group bg-white p-6 rounded-2xl border border-gray-100 hover:border-indigo-400 cursor-pointer transition-all relative">
                      <button onClick={(e) => { e.stopPropagation(); setAppState(prev => { const h = prev.history.filter(i => i.id !== item.id); localStorage.setItem('sentix_history', JSON.stringify(h)); return { ...prev, history: h, currentAnalysis: prev.currentAnalysis?.id === item.id ? null : prev.currentAnalysis }; }); }} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                      <div className="flex gap-2 mb-3"><span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded uppercase">{item.category}</span><span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${item.urgency === 'Critical' ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600'}`}>{item.urgency}</span></div>
                      <h4 className="font-bold text-gray-900 mb-2 line-clamp-1">{item.summary}</h4>
                      <p className="text-xs text-gray-400 line-clamp-2 italic">"{item.originalText}"</p>
                    </div>
                  ))}
                 </div>
               )}
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Settings className="text-gray-400" /> Integration Setup</h2>
                <p className="text-sm text-gray-500 mb-8">To connect your <strong>original organization Gmail</strong>, you must provide a valid Google OAuth Client ID. This resolves the 404 error by using your specific Cloud project.</p>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Google Client ID</label>
                    <input type="text" value={tempClientId} onChange={(e) => setTempClientId(e.target.value)} placeholder="xxxxxxxx-xxxxxxxx.apps.googleusercontent.com" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm" />
                    <p className="text-[10px] text-gray-400">This ID can be found in your <a href="https://console.cloud.google.com/apis/credentials" target="_blank" className="text-indigo-500 underline flex-inline items-center gap-1">Google Cloud Console <ExternalLink size={10} className="inline"/></a>.</p>
                  </div>
                  
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-xs text-indigo-800 space-y-2">
                    <h4 className="font-bold flex items-center gap-2"><ShieldCheck size={14}/> Critical Steps for "Original Gmail" Connection:</h4>
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Go to Google Cloud Console &gt; APIs & Services &gt; Credentials.</li>

                      <li>Create an <strong>OAuth 2.0 Client ID</strong> (Web Application).</li>
                      <li>Add <strong>Authorized JavaScript Origins</strong>: <code>{window.location.origin}</code></li>
                      <li>Paste the Client ID here and save.</li>
                    </ol>
                  </div>
                  
                  <Button onClick={saveClientId} className="w-full !py-3 shadow-lg shadow-indigo-100">Save Configuration & Ready to Connect</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;


import React from 'react';
import { EmailMessage } from '../types';
import { Mail, Search, RefreshCw, ChevronRight, Inbox, LogOut, Sparkles, CheckCircle, Reply } from 'lucide-react';
import { Button } from './Button';

interface GmailInboxProps {
  emails: EmailMessage[];
  onAnalyze: (email: EmailMessage) => void;
  onDisconnect: () => void;
  isLoading: boolean;
}

export const GmailInbox: React.FC<GmailInboxProps> = ({ emails, onAnalyze, onDisconnect, isLoading }) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Mail className="text-red-500" /> Live Gmail Inbox
          </h2>
          <p className="text-sm text-gray-500">Fetched directly from your authenticated Google Account</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="!py-1.5 !text-xs" onClick={() => window.location.reload()}>
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Sync
          </Button>
          <Button variant="ghost" onClick={onDisconnect} className="!py-1.5 !text-xs text-red-600 hover:bg-red-50">
            <LogOut size={14} /> Sign Out
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
          <Search size={18} className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Search live support messages..." 
            className="bg-transparent border-none focus:ring-0 text-sm flex-1"
          />
        </div>

        <div className="divide-y divide-gray-50">
          {emails.length > 0 ? (
            emails.map((email) => (
              <div 
                key={email.id}
                className={`group flex items-center gap-4 p-4 hover:bg-indigo-50/30 transition-all cursor-pointer relative ${email.isReplied ? 'opacity-70' : ''}`}
                onClick={() => !email.isReplied && onAnalyze(email)}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all shadow-sm ${
                  email.isReplied ? 'bg-green-100 text-green-600' : 
                  email.isRead ? 'bg-gray-100 text-gray-400' : 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-50'
                }`}>
                  {email.isReplied ? <CheckCircle size={20} /> : email.from.charAt(0)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm max-w-[200px] truncate ${email.isRead || email.isReplied ? 'text-gray-500' : 'text-gray-900 font-bold'}`}>
                        {email.from}
                      </span>
                      {!email.isRead && !email.isReplied && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                      )}
                      {email.isReplied && (
                        <span className="text-[10px] font-bold text-green-600 uppercase bg-green-50 px-1.5 py-0.5 rounded border border-green-100 flex items-center gap-1">
                          <Reply size={10} /> Sent
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                      {email.date}
                    </span>
                  </div>
                  <h4 className={`text-sm truncate ${email.isRead || email.isReplied ? 'text-gray-500' : 'text-gray-800 font-semibold'}`}>
                    {email.subject}
                  </h4>
                  <p className="text-xs text-gray-400 truncate line-clamp-1">
                    {email.isReplied ? (
                      <span className="text-indigo-500 font-medium">Auto-Replied: {email.aiReplySnippet}</span>
                    ) : email.content}
                  </p>
                </div>

                {!email.isReplied && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                    <Button 
                      variant="primary" 
                      className="!py-1 !px-3 !text-[11px] shadow-sm whitespace-nowrap"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAnalyze(email);
                      }}
                      isLoading={isLoading}
                    >
                      <Sparkles size={12} /> Auto-Analyze
                    </Button>
                  </div>
                )}
                
                {email.isReplied && (
                  <div className="text-green-500 pr-2">
                    <CheckCircle size={18} />
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="py-20 flex flex-col items-center text-center px-6">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-4">
                {isLoading ? <RefreshCw className="animate-spin" size={32} /> : <Inbox size={32} />}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{isLoading ? 'Syncing...' : 'Inbox is empty'}</h3>
              <p className="text-sm text-gray-500 max-w-xs">
                {isLoading ? 'Fetching latest messages from your Google Account.' : 'All clear! No new complaints found in your real Gmail account.'}
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 flex gap-3 items-center">
        <div className="p-2 bg-amber-100 rounded-lg text-amber-700 font-bold text-xs">NOTE</div>
        <p className="text-xs text-amber-800 leading-relaxed">
          To connect your <strong>real organization Gmail</strong>, you must configure a valid Client ID in the <code className="bg-amber-100 px-1 rounded">gmailService.ts</code>. This version uses a real OAuth flow which requires your specific domain to be whitelisted in the Google Cloud Console.
        </p>
      </div>
    </div>
  );
};

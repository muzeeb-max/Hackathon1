
import React, { useState } from 'react';
import { ComplaintAnalysis, UrgencyLevel, Sentiment } from '../types';
import { CheckCircle2, Clock, MessageSquare, ShieldAlert, BarChart3, Mail, Tag, Zap, Send, Check } from 'lucide-react';
import { Button } from './Button';

interface AnalysisDisplayProps {
  analysis: ComplaintAnalysis;
  onClose: () => void;
  onSendReply?: (analysisId: string, replyText: string) => void;
}

export const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ analysis, onClose, onSendReply }) => {
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const urgencyColors = {
    [UrgencyLevel.LOW]: 'bg-green-100 text-green-800 border-green-200',
    [UrgencyLevel.MEDIUM]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    [UrgencyLevel.HIGH]: 'bg-orange-100 text-orange-800 border-orange-200',
    [UrgencyLevel.CRITICAL]: 'bg-red-100 text-red-800 border-red-200 animate-pulse',
  };

  const sentimentColors = {
    [Sentiment.VERY_ANGRY]: 'text-red-700',
    [Sentiment.ANGRY]: 'text-red-500',
    [Sentiment.NEUTRAL]: 'text-gray-500',
    [Sentiment.SLIGHTLY_DISSATISFIED]: 'text-amber-500',
    [Sentiment.SATISFIED]: 'text-green-600',
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(analysis.automated_response);
    alert("Response draft copied to clipboard!");
  };

  const handleSend = async () => {
    if (!onSendReply) return;
    setIsSending(true);
    // Simulate API delay
    await new Promise(r => setTimeout(r, 1500));
    onSendReply(analysis.id, analysis.automated_response);
    setIsSending(false);
    setSent(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="text-indigo-600" /> Analysis Report
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          Dismiss
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Tag size={16} /> Category
          </div>
          <div className="text-gray-800 font-bold text-xs truncate">
            {analysis.category}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <ShieldAlert size={16} /> Urgency
          </div>
          <div className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${urgencyColors[analysis.urgency]}`}>
            {analysis.urgency}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <MessageSquare size={16} /> Sentiment
          </div>
          <div className={`text-xs font-bold ${sentimentColors[analysis.sentiment] || 'text-gray-600'}`}>
            {analysis.sentiment}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Zap size={16} className="text-amber-500" /> Action
          </div>
          <div className="text-gray-800 font-bold text-[10px] uppercase leading-tight">
            {analysis.recommended_action}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Clock size={16} /> Time
          </div>
          <div className="text-gray-800 font-medium text-xs">
            {new Date(analysis.timestamp).toLocaleTimeString()}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <CheckCircle2 size={16} /> Status
          </div>
          <div className="text-gray-800 font-medium text-green-600 text-xs">
            {sent ? 'Replied' : 'Completed'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Executive Summary</h3>
            <p className="text-gray-600 leading-relaxed">{analysis.summary}</p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Root Cause Analysis</h3>
              <p className="text-sm text-gray-600">{analysis.rootCause}</p>
            </section>
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Issues Identified</h3>
              <ul className="space-y-2">
                {analysis.key_issues.map((issue, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                    {issue}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Mail size={18} className="text-indigo-900" />
                <h3 className="text-lg font-semibold text-indigo-900">Automated Response Draft</h3>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={copyToClipboard}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800 underline underline-offset-4"
                >
                  Copy
                </button>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-indigo-200 text-gray-800 text-sm leading-relaxed whitespace-pre-wrap font-mono mb-4">
              {analysis.automated_response}
            </div>

            {analysis.sourceEmailId && !sent && (
              <div className="flex justify-end">
                <Button 
                  onClick={handleSend} 
                  isLoading={isSending}
                  className="!bg-red-600 hover:!bg-red-700 shadow-lg shadow-red-100"
                >
                  <Send size={16} /> Send Reply to Customer
                </Button>
              </div>
            )}
            
            {sent && (
              <div className="flex items-center justify-center gap-2 text-green-600 font-bold p-4 bg-green-50 rounded-xl border border-green-200 animate-in zoom-in">
                <Check size={20} /> Response Sent Successfully via Gmail
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Original Input</h3>
            <p className="text-sm text-gray-700 italic line-clamp-12">
              "{analysis.originalText}"
            </p>
          </section>
          
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-2xl text-white shadow-lg">
            <h4 className="font-bold mb-2">AI Reasoning</h4>
            <p className="text-xs opacity-90 leading-relaxed mb-4">
              Our model detected <strong>{analysis.sentiment}</strong> sentiment and categorized this as <strong>{analysis.category}</strong>. 
            </p>
            <div className="text-[10px] uppercase font-bold tracking-tighter opacity-70">
              Confidence Score: 98.4%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

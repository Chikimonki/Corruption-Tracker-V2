import React, { useState } from 'react';
import { AnalysisResult, AnalysisStatus } from '../types';
import { Sparkles, AlertTriangle, CheckCircle, Shield, Layers, Code, BrainCircuit, Terminal, Copy, Volume2, MapPin, Loader2, ExternalLink } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { generateSpeech, verifyEntityLocation } from '../services/geminiService';

interface AnalysisPanelProps {
  status: AnalysisStatus;
  result: AnalysisResult | null;
  error?: string | null;
  onAnalyze: () => void;
}

const COLORS = ['#6366f1', '#1e293b']; // Indigo-500, Slate-800

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ status, result, error, onAnalyze }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [verifyingMap, setVerifyingMap] = useState(false);
  const [mapResult, setMapResult] = useState<string | null>(null);

  const handleSpeak = async () => {
      if (!result) return;
      setIsPlaying(true);
      try {
          const text = `${result.summary}. The seniority bracket is ${result.seniorityBracket}.`;
          const base64 = await generateSpeech(text);
          const audio = new Audio(`data:audio/mp3;base64,${base64}`);
          audio.onended = () => setIsPlaying(false);
          audio.play();
      } catch (e) {
          console.error(e);
          setIsPlaying(false);
      }
  };

  const handleVerifyLocation = async () => {
      setVerifyingMap(true);
      try {
          const res = await verifyEntityLocation("Corruption Tracker V2 HQ");
          setMapResult(res.text);
      } catch (e) {
          setMapResult("Could not verify location.");
      } finally {
          setVerifyingMap(false);
      }
  };

  if (status === AnalysisStatus.IDLE) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="p-4 bg-indigo-500/10 rounded-full">
          <BrainCircuit size={48} className="text-indigo-400" />
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="text-2xl font-bold text-white">Forensic Architecture Audit</h2>
          <p className="text-slate-400">
            Ready to analyze the <span className="text-indigo-300 font-mono">corruption_tracker_v2</span> structure. 
            I will assess your forensic patterns, UK legislative compliance (RAG), and data pipeline integrity.
          </p>
        </div>
        <button
          onClick={onAnalyze}
          className="group relative inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-lg shadow-indigo-500/20"
        >
          <Sparkles className="w-5 h-5 mr-2 animate-pulse" />
          Run Forensic Audit
        </button>
      </div>
    );
  }

  if (status === AnalysisStatus.ANALYZING) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 space-y-8 animate-in fade-in duration-500">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse rounded-full"></div>
          <Layers size={64} className="text-indigo-400 animate-bounce relative z-10" />
        </div>
        <div className="space-y-3 text-center">
            <h3 className="text-xl font-semibold text-white">Auditing Structure...</h3>
            <div className="flex flex-col gap-2 text-sm text-slate-400">
                <span className="animate-pulse delay-75">Scanning CSV ingestion pipelines...</span>
                <span className="animate-pulse delay-150">Verifying RAG legal knowledge base...</span>
                <span className="animate-pulse delay-300">Checking FCA reporting modules...</span>
                <span className="text-indigo-400 animate-pulse font-mono text-xs pt-2">Thinking Budget: 32,768 tokens (Deep Think)</span>
            </div>
        </div>
      </div>
    );
  }

  if (status === AnalysisStatus.ERROR) {
    const isKeyError = error?.toLowerCase().includes("key");

    return (
      <div className="h-full flex items-center justify-center text-red-400 p-8">
        <div className="text-center max-w-lg">
            <AlertTriangle size={48} className="mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2 text-white">Analysis Failed</h3>
            <p className="mb-6 text-slate-300 bg-slate-900/50 p-4 rounded border border-red-900/50">
                {error || "An unknown error occurred. Please check your API key and try again."}
            </p>
            
            <div className="flex flex-col gap-3 items-center">
                <button 
                    onClick={onAnalyze} 
                    className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded transition-colors border border-slate-700 w-full"
                >
                    Retry Audit
                </button>
                
                {isKeyError && (
                    <a 
                        href="https://aistudio.google.com/app/apikey" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors flex items-center justify-center gap-2 w-full"
                    >
                        <span>Get Google API Key</span>
                        <ExternalLink size={14} />
                    </a>
                )}
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-8 custom-scrollbar">
      {/* Header Result */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-slate-700/50 shadow-xl relative">
        <div className="absolute top-4 right-4 flex gap-2">
            <button 
                onClick={handleVerifyLocation}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-indigo-300 transition-colors"
                title="Verify HQ Location"
            >
                {verifyingMap ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
            </button>
            <button 
                onClick={handleSpeak}
                disabled={isPlaying}
                className={`p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors ${isPlaying ? 'text-green-400' : 'text-slate-400 hover:text-indigo-300'}`}
                title="Read Summary"
            >
                <Volume2 size={16} className={isPlaying ? 'animate-pulse' : ''} />
            </button>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="text-sm font-medium text-indigo-400 mb-1 uppercase tracking-wider">Estimated Bracket</div>
            <h1 className="text-3xl md:text-4xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
              {result?.seniorityBracket}
            </h1>
          </div>
          <div className="flex items-center gap-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
             <div className="h-16 w-16 relative">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={[{ value: result?.score }, { value: 100 - (result?.score || 0) }]}
                            innerRadius={20}
                            outerRadius={30}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                            stroke="none"
                        >
                            {[{ value: result?.score }, { value: 100 - (result?.score || 0) }].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                    </PieChart>
                 </ResponsiveContainer>
                 <div className="absolute inset-0 flex items-center justify-center font-bold text-sm text-white">
                     {result?.score}
                 </div>
             </div>
             <div>
                 <div className="text-xs text-slate-400">Architecture Score</div>
                 <div className="text-sm font-semibold text-slate-200">Excellent</div>
             </div>
          </div>
        </div>
        
        <div className="mt-6 text-slate-300 leading-relaxed border-t border-slate-700/50 pt-4">
            {result?.summary}
        </div>

        {mapResult && (
            <div className="mt-4 p-3 bg-indigo-900/20 border border-indigo-500/30 rounded text-sm text-indigo-200 animate-in fade-in">
                <span className="font-semibold flex items-center gap-2 mb-1"><MapPin size={14}/> Location Verification</span>
                {mapResult}
            </div>
        )}
      </div>

      {/* Tech Stack */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Code size={20} className="text-indigo-400"/> Detected Tech Stack
        </h3>
        <div className="flex flex-wrap gap-2">
            {result?.techStackDetected.map((tech) => (
                <span key={tech} className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-indigo-300 font-mono">
                    {tech}
                </span>
            ))}
        </div>
      </div>

      {/* Installation Command */}
      {result?.installationCommand && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Terminal size={20} className="text-indigo-400"/> Installation
          </h3>
          <div className="bg-slate-950 rounded-lg p-4 font-mono text-sm text-slate-300 border border-slate-800 flex items-center justify-between group">
            <code>{result.installationCommand}</code>
            <button 
                onClick={() => navigator.clipboard.writeText(result.installationCommand || '')}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-slate-800 rounded text-slate-500 hover:text-white"
                title="Copy command"
            >
                <Copy size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
             <h3 className="text-lg font-semibold text-green-400 flex items-center gap-2">
                <CheckCircle size={20} /> Strengths
             </h3>
             <ul className="space-y-2">
                {result?.strengths.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300 bg-slate-900/50 p-2 rounded border border-green-900/30">
                        <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-green-500 shrink-0"></span>
                        {item}
                    </li>
                ))}
             </ul>
        </div>
        <div className="space-y-3">
             <h3 className="text-lg font-semibold text-orange-400 flex items-center gap-2">
                <Shield size={20} /> Recommendations
             </h3>
             <ul className="space-y-2">
                {result?.weaknesses.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300 bg-slate-900/50 p-2 rounded border border-orange-900/30">
                        <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0"></span>
                        {item}
                    </li>
                ))}
             </ul>
        </div>
      </div>
      
      <div className="flex justify-center pt-8">
        <button onClick={onAnalyze} className="text-xs text-slate-500 hover:text-indigo-400 underline">
            Re-run Forensic Audit
        </button>
      </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { X, FileText, Download, Save, Sparkles, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { FileNode } from '../types';

interface FileViewerProps {
  file: FileNode;
  onClose: () => void;
  onSave: (file: FileNode, newContent: string) => void;
  onGenerate: (file: FileNode) => Promise<void>;
  isGenerating: boolean;
}

export const FileViewer: React.FC<FileViewerProps> = ({ file, onClose, onSave, onGenerate, isGenerating }) => {
  const [content, setContent] = useState(file.content || '');
  const [isDirty, setIsDirty] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync local state when file changes
  useEffect(() => {
    setContent(file.content || '');
    setIsDirty(false);
    setError(null);
  }, [file]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setIsDirty(true);
  };

  const handleSave = () => {
    onSave(file, content);
    setIsDirty(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const handleGenerateClick = async () => {
      setError(null);
      try {
          await onGenerate(file);
      } catch (e) {
          setError("Failed to generate code. Please check your API Key.");
      }
  };

  const isCsv = file.name.endsWith('.csv');

  return (
    <div className="h-full flex flex-col bg-[#0B1120]">
      {/* File Header */}
      <div className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 shrink-0">
        <div className="flex items-center gap-3">
          <FileText size={18} className="text-indigo-400" />
          <span className="font-mono text-sm text-slate-200">{file.name}</span>
          {isDirty && <span className="w-2 h-2 rounded-full bg-yellow-500"></span>}
        </div>
        <div className="flex items-center gap-2">
            {error && (
                <div className="flex items-center gap-1 text-red-400 text-xs mr-2 animate-pulse">
                    <AlertCircle size={14} />
                    <span>{error}</span>
                </div>
            )}
            
            <button 
                onClick={handleGenerateClick}
                disabled={isGenerating || isCsv}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 rounded text-xs transition-colors border border-indigo-500/30 disabled:opacity-50"
            >
                {isGenerating ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {isGenerating ? 'Refactoring...' : 'AI Refactor'}
            </button>
            
            <button 
                onClick={handleSave}
                disabled={!isDirty}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-colors border ${
                    justSaved 
                    ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                    : isDirty 
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                        : 'bg-transparent text-slate-500 border-transparent'
                }`}
            >
                {justSaved ? <Check size={14} /> : <Save size={14} />}
                {justSaved ? 'Saved' : 'Save'}
            </button>

            <div className="w-px h-4 bg-slate-800 mx-2"></div>

            <button 
                onClick={onClose}
                className="p-2 hover:bg-red-900/30 hover:text-red-400 rounded text-slate-400 transition-colors"
                title="Close File"
            >
                <X size={18} />
            </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 relative group bg-[#0B1120]">
        {isCsv ? (
            <div className="w-full h-full overflow-auto p-6">
                <table className="w-full text-left text-sm border-collapse">
                    <thead>
                        <tr>
                            {content.split('\n')[0].split(',').map((header, i) => (
                                <th key={i} className="border-b border-slate-700 p-2 text-indigo-300 font-mono">{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {content.split('\n').slice(1).filter(l => l.trim()).map((row, i) => (
                            <tr key={i} className="hover:bg-slate-800/50">
                                {row.split(',').map((cell, j) => (
                                    <td key={j} className="border-b border-slate-800 p-2 text-slate-400 font-mono">{cell}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ) : (
            <textarea 
                value={content}
                onChange={handleContentChange}
                className="w-full h-full bg-[#0B1120] text-slate-300 font-mono text-sm p-6 resize-none outline-none custom-scrollbar"
                spellCheck={false}
                placeholder="// This file is empty. Click 'AI Refactor' to populate it if needed."
            />
        )}
        
        {!isCsv && (
            <div className="absolute bottom-4 right-4 text-xs text-slate-600 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                {content.length} characters
            </div>
        )}
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { Layout, Terminal, MessageSquare, Menu, X, Github, Bot, Download, Mic, Play, MonitorPlay, CheckCircle2, AlertCircle } from 'lucide-react';
import { DEMO_PROJECT_STRUCTURE } from './constants';
import { FileTree } from './components/FileTree';
import { AnalysisPanel } from './components/AnalysisPanel';
import { FileViewer } from './components/FileViewer';
import { analyzeProjectStructure, chatWithArchitect, generateFileContent } from './services/geminiService';
import { AnalysisStatus, AnalysisResult, ChatMessage, FileNode } from './types';
import { LiveAgent } from './components/LiveAgent';
import { StreamlitPreview } from './components/StreamlitPreview';
import JSZip from 'jszip';

// Helper to clone tree
const cloneTree = (node: FileNode): FileNode => JSON.parse(JSON.stringify(node));

// Helper to convert tree to string
const getStructureString = (node: any, depth = 0): string => {
  const indent = '  '.repeat(depth);
  let result = `${indent}${node.name}${node.type === 'folder' ? '/' : ''}\n`;
  if (node.children) {
    for (const child of node.children) {
      result += getStructureString(child, depth + 1);
    }
  }
  return result;
};

// Retrieve app.py content for context if available
const findAppPyContent = (root: FileNode): string => {
    if (root.name === 'app.py' && root.content) return root.content;
    if (root.children) {
        for (const child of root.children) {
            const found = findAppPyContent(child);
            if (found) return found;
        }
    }
    return "";
};

const PROJECT_DESCRIPTION = "Corruption Tracker V2 is an AI-powered forensic audit system ('AI Police Force for White Collar Crime'). It analyzes public financial records (CSVs) to detect anomalies, cross-reference against UK procurement legislation (via RAG), and generate compliance reports for bodies like the FCA. Users include judges, councillors, and the public. Tech stack: Python 3.11, Streamlit, Pandas/Polars, Scikit-Learn (Isolation Forest), LlamaIndex.";

const App: React.FC = () => {
  // Deep clone initial structure to state so it is mutable
  const [projectRoot, setProjectRoot] = useState<FileNode>(cloneTree(DEMO_PROJECT_STRUCTURE));
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<FileNode | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isLiveAgentOpen, setIsLiveAgentOpen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  
  // Chat State
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: 'Corruption Tracker V2 loaded successfully. I see you have the core forensics engine, ML models, and council spend data ready. Would you like to run a forensic audit or optimize the detection algorithms?', timestamp: Date.now() }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), 3000);
  };

  // Helper to find and update a node in the tree
  const updateNodeContent = (root: FileNode, targetName: string, newContent: string): FileNode => {
    if (root.name === targetName && root.type === 'file') {
        return { ...root, content: newContent };
    }
    if (root.children) {
        return {
            ...root,
            children: root.children.map(child => updateNodeContent(child, targetName, newContent))
        };
    }
    return root;
  };

  const handleSaveFile = (file: FileNode, newContent: string) => {
    const newRoot = updateNodeContent(projectRoot, file.name, newContent);
    setProjectRoot(newRoot);
    setActiveFile({ ...file, content: newContent });
    showNotification(`Saved ${file.name}`);
  };

  const handleGenerateCode = async (file: FileNode) => {
    setIsGeneratingCode(true);
    try {
        const generatedCode = await generateFileContent(file.name, file.name, PROJECT_DESCRIPTION);
        handleSaveFile(file, generatedCode);
        showNotification(`Generated code for ${file.name}`);
    } catch (e: any) {
        console.error("Generation failed", e);
        showNotification("Failed to generate code", 'error');
        throw e;
    } finally {
        setIsGeneratingCode(false);
    }
  };

  const handleAnalyze = async () => {
    setActiveFile(null);
    setAnalysisStatus(AnalysisStatus.ANALYZING);
    setAnalysisError(null);
    try {
      const structureStr = getStructureString(projectRoot);
      const result = await analyzeProjectStructure(structureStr, PROJECT_DESCRIPTION);
      setAnalysisResult(result);
      setAnalysisStatus(AnalysisStatus.COMPLETE);
      showNotification("Forensic Architecture Audit Complete");
    } catch (error: any) {
      console.error(error);
      setAnalysisError(error.message || "Unknown error occurred during analysis.");
      setAnalysisStatus(AnalysisStatus.ERROR);
      showNotification("Audit Failed", 'error');
    }
  };

  const handleDownloadProject = async () => {
    const zip = new JSZip();
    
    const addNodeToZip = (node: FileNode, currentPath: string) => {
        if (node.type === 'file') {
            zip.file(currentPath + node.name, node.content || '');
        } else if (node.type === 'folder' && node.children) {
            const folder = zip.folder(currentPath + node.name);
            node.children.forEach(child => addNodeToZip(child, currentPath + node.name + '/'));
        }
    };

    if (projectRoot.children) {
        projectRoot.children.forEach(child => addNodeToZip(child, ''));
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectRoot.name}.zip`;
    a.click();
    window.URL.revokeObjectURL(url);
    showNotification("Project Zipped & Downloaded");
  };

  const handleFileSelect = (node: FileNode) => {
    const findNode = (root: FileNode, name: string): FileNode | null => {
        if (root.name === name) return root;
        if (root.children) {
            for (const child of root.children) {
                const found = findNode(child, name);
                if (found) return found;
            }
        }
        return null;
    };
    
    const freshNode = findNode(projectRoot, node.name);
    setActiveFile(freshNode || node);
    setIsPreviewMode(false);
    
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputMessage,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsChatLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      history.push({ role: 'user', text: userMsg.text });
      
      const structureStr = getStructureString(projectRoot);
      const appPyContent = findAppPyContent(projectRoot);
      const context = `Project Structure:\n${structureStr}\n\nMain Application Code (app.py):\n${appPyContent}`;

      const responseText = await chatWithArchitect(history, userMsg.text, context);
      
      // Check if response indicates an error
      const isError = responseText.startsWith("Error:") || responseText.includes("API Key missing");

      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        isError: isError,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (error: any) {
       const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: `System Error: ${error.message || "Unknown error detected"}`,
        isError: true,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 overflow-hidden font-sans">
      
      {/* Sidebar: File Explorer */}
      <div 
        className={`${sidebarOpen ? 'w-80' : 'w-0'} bg-slate-900 border-r border-slate-800 transition-all duration-300 ease-in-out flex flex-col relative shrink-0`}
      >
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-slate-100">
            <Layout size={18} className="text-indigo-400" />
            <span>Explorer</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-slate-800 rounded md:hidden">
            <X size={16} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
            <div className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Project Root</div>
            <FileTree 
                node={projectRoot} 
                onSelect={handleFileSelect} 
                activeFileId={activeFile?.name}
            />
        </div>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
           <div className="flex justify-between items-center mb-4">
              <span className="font-semibold text-slate-400">Actions</span>
           </div>
           <button 
                onClick={handleDownloadProject}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded transition-colors"
           >
               <Download size={14} />
               <span>Download Project</span>
           </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {/* Top Navbar */}
        <header className="h-14 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 shrink-0 relative">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-slate-800 rounded transition-colors">
                <Menu size={20} />
              </button>
            )}
            <h1 className="font-bold text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Corruption Tracker V2
            </h1>
            <span className="hidden md:inline-block px-2 py-0.5 rounded text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Forensic Edition
            </span>
          </div>
          
          {/* Notification Toast */}
          <div className={`absolute left-1/2 transform -translate-x-1/2 top-14 transition-all duration-300 z-50 ${notification ? 'opacity-100 translate-y-2' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
             <div className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg border ${
                 notification?.type === 'error' 
                 ? 'bg-red-900/90 border-red-700 text-red-100' 
                 : 'bg-green-900/90 border-green-700 text-green-100'
             }`}>
                {notification?.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                <span className="text-sm font-medium">{notification?.message}</span>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button 
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all text-sm font-medium ${
                    isPreviewMode 
                    ? 'bg-green-600 text-white shadow-lg shadow-green-500/20' 
                    : 'bg-green-600/20 text-green-400 border border-green-600/30 hover:bg-green-600/30'
                }`}
                title="Run Application Preview"
             >
                {isPreviewMode ? <MonitorPlay size={16} /> : <Play size={16} />}
                <span>{isPreviewMode ? 'Running...' : 'Run App'}</span>
             </button>

             <div className="w-px h-6 bg-slate-800 mx-1"></div>

            <button 
              onClick={() => setIsLiveAgentOpen(!isLiveAgentOpen)}
              className={`p-2 rounded-full transition-all flex items-center gap-2 ${isLiveAgentOpen ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
              title="Start Live Voice Agent"
            >
              <Mic size={20} />
            </button>

            <button 
              onClick={() => setChatOpen(!chatOpen)}
              className={`p-2 rounded-full transition-all ${chatOpen ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
              title="Toggle AI Chat"
            >
              <MessageSquare size={20} />
            </button>
          </div>
        </header>

        {/* Workspace */}
        <main className="flex-1 relative overflow-hidden bg-[#0B1120]">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(19,23,31,0.5)_2px,transparent_2px),linear-gradient(90deg,rgba(19,23,31,0.5)_2px,transparent_2px)] bg-[size:40px_40px] opacity-20 pointer-events-none"></div>
          
          <div className="h-full flex flex-col z-10 relative">
            <div className="flex-1 overflow-hidden">
                {isPreviewMode ? (
                    <StreamlitPreview onClose={() => setIsPreviewMode(false)} />
                ) : activeFile ? (
                    <FileViewer 
                        file={activeFile} 
                        onClose={() => setActiveFile(null)} 
                        onSave={handleSaveFile}
                        onGenerate={handleGenerateCode}
                        isGenerating={isGeneratingCode}
                    />
                ) : (
                    <AnalysisPanel 
                        status={analysisStatus} 
                        result={analysisResult} 
                        error={analysisError}
                        onAnalyze={handleAnalyze} 
                    />
                )}
            </div>
          </div>
          
          {isLiveAgentOpen && (
              <LiveAgent onClose={() => setIsLiveAgentOpen(false)} />
          )}
        </main>

        {/* Chat Drawer Overlay */}
        <div 
           className={`absolute top-0 right-0 h-full w-full md:w-96 bg-slate-900 border-l border-slate-800 shadow-2xl transform transition-transform duration-300 z-50 flex flex-col ${chatOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
             <div className="flex items-center gap-2">
                <Bot size={18} className="text-indigo-400" />
                <span className="font-semibold">Architect Chat</span>
             </div>
             <button onClick={() => setChatOpen(false)} className="hover:text-white text-slate-400">
                <X size={18} />
             </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900 custom-scrollbar">
            {messages.map((msg) => (
               <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[85%] rounded-lg p-3 text-sm ${
                        msg.role === 'user' 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-slate-800 text-slate-200 border border-slate-700'
                    } ${msg.isError ? 'border-red-500 bg-red-900/20 text-red-200' : ''}`}
                  >
                     {msg.text}
                  </div>
               </div>
            ))}
            {isChatLoading && (
                <div className="flex justify-start">
                    <div className="bg-slate-800 p-3 rounded-lg flex gap-1">
                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></span>
                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></span>
                    </div>
                </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-800 bg-slate-950">
             <form onSubmit={handleSendMessage} className="relative">
                <input 
                   type="text" 
                   value={inputMessage}
                   onChange={(e) => setInputMessage(e.target.value)}
                   placeholder="Ask about your architecture..."
                   className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-4 pr-10 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                <button 
                  type="submit"
                  disabled={!inputMessage.trim() || isChatLoading}
                  className="absolute right-2 top-2 p-1 text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
                >
                    <Terminal size={16} />
                </button>
             </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default App;
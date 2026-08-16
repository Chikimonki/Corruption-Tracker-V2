import React, { useState } from 'react';
import { Layout, Upload, Search, Shield, AlertTriangle, FileText, BarChart3, Scale, CheckCircle2 } from 'lucide-react';
import { performForensicAnalysis } from '../services/geminiService';

interface StreamlitPreviewProps {
    onClose: () => void;
}

export const StreamlitPreview: React.FC<StreamlitPreviewProps> = ({ onClose }) => {
    const [mode, setMode] = useState("Dashboard");
    const [file, setFile] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [results, setResults] = useState<any>(null);
    const [sensitivity, setSensitivity] = useState(0.8);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResults(null);
        }
    };

    const runAnalysis = async () => {
        if (!file) return;
        setIsAnalyzing(true);
        try {
            // Read the actual file content
            const fileContent = await file.text();
            
            // Send content to Gemini
            const data = await performForensicAnalysis(file.name, fileContent, sensitivity);
            setResults(data);
        } catch (e) {
            console.error(e);
            alert("Failed to analyze file. Ensure it is a text-based CSV.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="h-full flex bg-white text-slate-900 font-sans overflow-hidden">
            {/* Sidebar Simulation */}
            <div className="w-64 bg-slate-50 border-r border-slate-200 p-6 flex flex-col gap-6 shrink-0">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <span>⚖️</span> Anti-Corruption AI
                    </h2>
                    <div className="h-px bg-slate-200 my-4"></div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Investigation Mode</label>
                        {["Dashboard", "Forensic Audit", "Legal Compliance (RAG)", "FCA Report Gen"].map((m) => (
                            <button
                                key={m}
                                onClick={() => setMode(m)}
                                className={`w-full text-left px-3 py-2 rounded text-sm ${mode === m ? 'bg-red-50 text-red-600 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${mode === m ? 'bg-red-500' : 'bg-slate-300'}`}></span>
                                    {m}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="mt-auto">
                    <div className="p-3 bg-blue-50 rounded border border-blue-100 text-xs text-blue-800">
                        <strong>System Status</strong>
                        <div className="flex items-center gap-1 mt-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            RAG Engine Online
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Simulation */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold mb-2">Corruption Tracker V2</h1>
                    <div className="flex items-center gap-2 text-slate-500 mb-8">
                        <Shield size={16} />
                        <span className="text-sm font-mono">Current Mode: {mode}</span>
                    </div>

                    {mode === "Dashboard" && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-white border rounded shadow-sm">
                                    <div className="text-slate-500 text-sm">Total Spend Analyzed</div>
                                    <div className="text-2xl font-bold">£42,105,200.00</div>
                                </div>
                                <div className="p-4 bg-white border rounded shadow-sm">
                                    <div className="text-slate-500 text-sm">Anomalies Detected</div>
                                    <div className="text-2xl font-bold text-red-600">12</div>
                                </div>
                                <div className="p-4 bg-white border rounded shadow-sm">
                                    <div className="text-slate-500 text-sm">Risk Level</div>
                                    <div className="text-2xl font-bold text-orange-500">Moderate</div>
                                </div>
                            </div>
                            
                            <div className="border rounded-lg overflow-hidden">
                                <div className="bg-slate-50 px-4 py-2 border-b font-semibold text-sm">council_spend_2024.csv (Preview)</div>
                                <div className="p-4 text-sm font-mono text-slate-600 bg-slate-50/50">
                                    ID, Date, Entity, Amount, Category<br/>
                                    001, 2024-01-15, Roads & Transport, £150,000, Infrastructure<br/>
                                    002, 2024-01-16, IT Services Ltd, £24,500, Technology<br/>
                                    003, 2024-01-18, Green Parks Co, £12,000, Maintenance<br/>
                                    ...
                                </div>
                            </div>
                        </div>
                    )}

                    {mode === "Forensic Audit" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <div className="p-6 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-center relative overflow-hidden">
                                {file ? (
                                    <div className="animate-in zoom-in-50 duration-300">
                                        <div className="mx-auto bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-slate-900">File Ready for Analysis</h3>
                                        <p className="text-slate-500 mb-4">{file.name}</p>
                                        <div className="flex justify-center gap-2">
                                            <button 
                                                onClick={() => setFile(null)} 
                                                className="text-sm text-slate-400 hover:text-red-500 underline"
                                            >
                                                Remove
                                            </button>
                                            <label htmlFor="file-replace" className="cursor-pointer text-sm text-indigo-500 hover:text-indigo-600 underline">
                                                Replace
                                            </label>
                                            <input id="file-replace" type="file" className="hidden" accept=".csv" onChange={handleFileUpload} />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="mx-auto h-12 w-12 text-slate-400" />
                                        <div className="mt-4">
                                            <label htmlFor="file-upload" className="cursor-pointer bg-white border border-slate-300 rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-all hover:shadow-md">
                                                Upload CSV
                                            </label>
                                            <input id="file-upload" type="file" className="hidden" accept=".csv" onChange={handleFileUpload} />
                                        </div>
                                        <p className="mt-2 text-xs text-slate-500">Drag and drop or click to upload council data</p>
                                    </>
                                )}
                            </div>

                            {file && (
                                <div className="space-y-4 animate-in slide-in-from-bottom-2">
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-sm font-medium text-slate-700">ML Sensitivity (Isolation Forest)</label>
                                            <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">{sensitivity}</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="1" 
                                            step="0.1" 
                                            value={sensitivity}
                                            onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                        <div className="flex justify-between text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-1">
                                            <span>Lenient</span>
                                            <span>Aggressive</span>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={runAnalysis}
                                        disabled={isAnalyzing}
                                        className={`w-full py-3 text-white rounded-lg font-semibold shadow-sm flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] ${
                                            isAnalyzing 
                                            ? 'bg-slate-800 cursor-not-allowed' 
                                            : 'bg-red-600 hover:bg-red-700 hover:shadow-md'
                                        }`}
                                    >
                                        {isAnalyzing ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span> : <Search size={18} />}
                                        {isAnalyzing ? 'Running ML Models...' : 'Analyze Uploaded CSV'}
                                    </button>
                                </div>
                            )}

                            {results && (
                                <div className="bg-white border rounded-xl shadow-lg p-6 space-y-4 animate-in zoom-in-95 duration-300">
                                    <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-2">
                                        <AlertTriangle className="text-red-500" /> 
                                        Forensic Findings
                                    </h3>
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div className="p-3 bg-slate-50 rounded">
                                            <div className="text-xs text-slate-500 uppercase">Records</div>
                                            <div className="font-mono font-bold">{results['Total Records Scanned'] || 'N/A'}</div>
                                        </div>
                                        <div className="p-3 bg-red-50 rounded border border-red-100">
                                            <div className="text-xs text-red-600 uppercase">Anomalies</div>
                                            <div className="font-mono font-bold text-red-700">{results['Anomalies Found'] || 0}</div>
                                        </div>
                                        <div className="p-3 bg-orange-50 rounded border border-orange-100">
                                            <div className="text-xs text-orange-600 uppercase">Risk Score</div>
                                            <div className="font-mono font-bold text-orange-700">{results['Risk Score'] || 0}/100</div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-semibold mb-2">Suspicious Transactions</h4>
                                        <div className="space-y-2">
                                            {results['Top 3 Suspicious Transactions']?.map((tx: any, i: number) => (
                                                <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded text-sm border-l-4 border-red-500 hover:bg-red-50 transition-colors">
                                                    <div>
                                                        <div className="font-bold">{tx.Entity || 'Unknown Entity'}</div>
                                                        <div className="text-xs text-slate-500">{tx.Date} • {tx.Reason}</div>
                                                    </div>
                                                    <div className="font-mono font-bold text-red-600">{tx.Amount}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2 pt-2">
                                        <button className="flex-1 py-2 border border-slate-300 rounded text-sm hover:bg-slate-50 transition-colors">Save as PDF</button>
                                        <button className="flex-1 py-2 bg-slate-900 text-white rounded text-sm hover:bg-slate-800 transition-colors">Review with Legal RAG</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {mode === "Legal Compliance (RAG)" && (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                           <Scale size={48} className="mb-4 opacity-50" />
                           <p>RAG Engine Interface Placeholder</p>
                        </div>
                    )}
                    
                    {mode === "FCA Report Gen" && (
                         <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                           <BarChart3 size={48} className="mb-4 opacity-50" />
                           <p>FCA Reporting Module Placeholder</p>
                        </div>
                    )}
                </div>
            </div>
            
            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-200 hover:bg-slate-300 rounded-full text-slate-600">
                <Layout size={18} />
            </button>
        </div>
    );
};
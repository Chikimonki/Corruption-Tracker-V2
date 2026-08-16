import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Activity, X } from 'lucide-react';
import { getAIClient } from '../services/geminiService';
import { LiveServerMessage, Modality } from '@google/genai';

interface LiveAgentProps {
    onClose: () => void;
}

export const LiveAgent: React.FC<LiveAgentProps> = ({ onClose }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [status, setStatus] = useState('Initializing...');
    const [audioLevel, setAudioLevel] = useState(0);
    
    const audioContextRef = useRef<AudioContext | null>(null);
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Audio Processing Helpers
    const createBlob = (data: Float32Array) => {
        const l = data.length;
        const int16 = new Int16Array(l);
        for (let i = 0; i < l; i++) {
            int16[i] = data[i] * 32768;
        }
        
        // Manual simple blob construction for PCM
        let binary = '';
        const bytes = new Uint8Array(int16.buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const b64 = btoa(binary);
        
        return {
            data: b64,
            mimeType: 'audio/pcm;rate=16000',
        };
    };

    const decode = (base64: string) => {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    };

    const decodeAudioData = async (
        data: Uint8Array,
        ctx: AudioContext,
        sampleRate: number,
        numChannels: number,
    ) => {
        const dataInt16 = new Int16Array(data.buffer);
        const frameCount = dataInt16.length / numChannels;
        const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

        for (let channel = 0; channel < numChannels; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < frameCount; i++) {
                channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
            }
        }
        return buffer;
    };

    useEffect(() => {
        let nextStartTime = 0;
        const sources = new Set<AudioBufferSourceNode>();

        const startSession = async () => {
            try {
                const client = getAIClient();
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                const inputCtx = new AudioContextClass({ sampleRate: 16000 });
                const outputCtx = new AudioContextClass({ sampleRate: 24000 });
                audioContextRef.current = outputCtx;

                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                streamRef.current = stream;

                const sessionPromise = client.live.connect({
                    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                    callbacks: {
                        onopen: () => {
                            setStatus('Listening');
                            setIsConnected(true);
                            
                            // Setup Input Stream
                            const source = inputCtx.createMediaStreamSource(stream);
                            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
                            
                            scriptProcessor.onaudioprocess = (e) => {
                                const inputData = e.inputBuffer.getChannelData(0);
                                // Simple visualizer
                                let sum = 0;
                                for(let i=0; i<inputData.length; i++) sum += Math.abs(inputData[i]);
                                setAudioLevel(Math.min(100, (sum / inputData.length) * 500));

                                const pcmBlob = createBlob(inputData);
                                sessionPromise.then(session => {
                                    session.sendRealtimeInput({ media: pcmBlob });
                                });
                            };

                            source.connect(scriptProcessor);
                            scriptProcessor.connect(inputCtx.destination);
                            
                            inputSourceRef.current = source;
                            processorRef.current = scriptProcessor;
                        },
                        onmessage: async (msg: LiveServerMessage) => {
                             const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                             if (base64Audio) {
                                 const audioBuffer = await decodeAudioData(
                                     decode(base64Audio),
                                     outputCtx,
                                     24000,
                                     1
                                 );
                                 
                                 nextStartTime = Math.max(nextStartTime, outputCtx.currentTime);
                                 const source = outputCtx.createBufferSource();
                                 source.buffer = audioBuffer;
                                 source.connect(outputCtx.destination);
                                 source.start(nextStartTime);
                                 nextStartTime += audioBuffer.duration;
                                 
                                 sources.add(source);
                                 source.onended = () => sources.delete(source);
                             }
                        },
                        onclose: () => {
                            setStatus('Disconnected');
                            setIsConnected(false);
                        },
                        onerror: (err) => {
                            console.error(err);
                            setStatus('Error connecting');
                        }
                    },
                    config: {
                        responseModalities: [Modality.AUDIO],
                        speechConfig: {
                            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
                        },
                        systemInstruction: "You are an AI Forensic Auditor assistant. Be professional, concise, and helpful."
                    }
                });

                sessionPromiseRef.current = sessionPromise;

            } catch (err: any) {
                console.error("Live API Error:", err);
                setStatus(`Error: ${err.message}`);
            }
        };

        startSession();

        return () => {
            // Cleanup
            if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
            if (processorRef.current) processorRef.current.disconnect();
            if (inputSourceRef.current) inputSourceRef.current.disconnect();
            if (audioContextRef.current) audioContextRef.current.close();
            sources.forEach(s => s.stop());
        };
    }, []);

    return (
        <div className="fixed bottom-6 right-6 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="p-4 bg-slate-950 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                    <Activity className={`w-4 h-4 ${isConnected ? 'text-green-500 animate-pulse' : 'text-slate-500'}`} />
                    <span className="font-semibold text-slate-200">Live Forensic Agent</span>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                    <X size={18} />
                </button>
            </div>
            
            <div className="p-6 flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                     <div className={`absolute inset-0 bg-indigo-500 rounded-full blur-xl transition-all duration-100 opacity-20`} style={{ transform: `scale(${1 + audioLevel/50})` }}></div>
                     <div className="relative bg-slate-800 p-4 rounded-full border border-slate-700">
                        {isConnected ? <Mic className="w-8 h-8 text-indigo-400" /> : <MicOff className="w-8 h-8 text-slate-500" />}
                     </div>
                </div>
                
                <div className="text-center space-y-1">
                    <div className="text-sm font-medium text-slate-200">{status}</div>
                    <div className="text-xs text-slate-500">Gemini 2.5 Native Audio</div>
                </div>

                {isConnected && (
                    <div className="flex gap-1 h-6 items-end justify-center w-full">
                        {[...Array(5)].map((_, i) => (
                            <div 
                                key={i} 
                                className="w-1.5 bg-indigo-500 rounded-full transition-all duration-75"
                                style={{ height: `${Math.max(20, Math.random() * audioLevel * 2)}%` }}
                            ></div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
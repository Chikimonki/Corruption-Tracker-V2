export interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  content?: string;
  description?: string; // For the AI to annotate
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
  timestamp: number;
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export interface AnalysisResult {
  seniorityBracket: string;
  score: number; // 0-100
  strengths: string[];
  weaknesses: string[];
  summary: string;
  techStackDetected: string[];
  installationCommand?: string; // e.g. "pip install -r requirements.txt"
}
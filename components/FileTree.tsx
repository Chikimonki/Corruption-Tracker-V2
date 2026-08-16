import React, { useState } from 'react';
import { Folder, FileText, ChevronRight, ChevronDown, FileCode, FileJson, Database } from 'lucide-react';
import { FileNode } from '../types';

interface FileTreeProps {
  node: FileNode;
  depth?: number;
  onSelect: (node: FileNode) => void;
  activeFileId?: string | null;
}

const getFileIcon = (name: string) => {
  if (name.endsWith('.py')) return <FileCode size={16} className="text-yellow-400" />;
  if (name.endsWith('.tsx') || name.endsWith('.ts')) return <FileCode size={16} className="text-blue-400" />;
  if (name.endsWith('.json')) return <FileJson size={16} className="text-green-400" />;
  if (name.endsWith('.ipynb')) return <Database size={16} className="text-orange-400" />;
  if (name.endsWith('.md')) return <FileText size={16} className="text-purple-400" />;
  return <FileText size={16} className="text-slate-400" />;
};

export const FileTree: React.FC<FileTreeProps> = ({ node, depth = 0, onSelect, activeFileId }) => {
  const [isOpen, setIsOpen] = useState(true);
  const isFolder = node.type === 'folder';
  const hasChildren = node.children && node.children.length > 0;
  const isActive = activeFileId === node.name;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFolder) {
      setIsOpen(!isOpen);
    } else {
      onSelect(node);
    }
  };

  return (
    <div className="select-none">
      <div 
        className={`flex items-center py-1.5 px-2 cursor-pointer transition-all duration-150 rounded mx-1 ${
            isActive 
            ? 'bg-indigo-600/20 text-indigo-300' 
            : 'hover:bg-slate-800/50 text-slate-400'
        } ${depth === 0 ? 'font-semibold text-slate-200' : ''}`}
        style={{ paddingLeft: `${depth * 1.2}rem` }}
        onClick={handleClick}
      >
        <span className="mr-1.5 opacity-70">
           {isFolder ? (
             hasChildren ? (
               isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
             ) : <div className="w-[14px]" />
           ) : <div className="w-[14px]" />}
        </span>
        
        <span className="mr-2 shrink-0">
          {isFolder ? (
            <Folder size={16} className={`${isOpen ? 'text-blue-400' : 'text-blue-500'} fill-current opacity-90`} />
          ) : (
            getFileIcon(node.name)
          )}
        </span>
        
        <span className={`text-sm truncate ${isActive ? 'text-indigo-200 font-medium' : (isFolder ? 'text-slate-200' : 'text-slate-300')}`}>
            {node.name}
        </span>
        
        {node.description && !isActive && (
          <span className="ml-3 text-xs text-slate-600 hidden xl:inline-block italic truncate max-w-[200px]">
             // {node.description}
          </span>
        )}
      </div>

      {isFolder && isOpen && node.children && (
        <div className="flex flex-col">
          {node.children.map((child, index) => (
            <FileTree 
                key={`${child.name}-${index}`} 
                node={child} 
                depth={depth + 1} 
                onSelect={onSelect}
                activeFileId={activeFileId}
            />
          ))}
        </div>
      )}
    </div>
  );
};
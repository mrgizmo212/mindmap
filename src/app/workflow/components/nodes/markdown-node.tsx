'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, useReactFlow, useUpdateNodeInternals } from '@xyflow/react';
import { BaseNode } from '@/components/base-node';
import { WorkflowNodeProps } from './index';
import { useAppStore } from '@/app/workflow/store';
import { 
  FileText, X, Maximize2, Bold, Italic, Code, List, Link2, Hash, 
  Undo2, Redo2, HelpCircle, Type, ListOrdered, Image as ImageIcon, Table, 
  MessageSquare, Minus, Search, ChevronRight, Zap, Settings,
  Heading, AlignLeft, CheckSquare, ExternalLink, Terminal,
  Quote, FileCode, Smile, AlertCircle, User, GitPullRequest, Calendar, Clock
} from 'lucide-react';

export function MarkdownNode({ id, data }: WorkflowNodeProps) {
  const [title, setTitle] = useState(data?.title || 'Untitled Section');
  const [content, setContent] = useState(data?.content || '');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [activeTab, setActiveTab] = useState('text');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPoppedOut, setIsPoppedOut] = useState(false);
  const [toolboxPos, setToolboxPos] = useState<{ top: number; left: number; width: number; above: boolean }>({ top: 0, left: 0, width: 600, above: false });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const setNodes = useAppStore((state) => state.setNodes);
  const getNodes = useAppStore((state) => state.getNodes);
  const { getNode, fitView } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  
  // Undo/Redo history
  const [history, setHistory] = useState<string[]>([data?.content || '']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isUpdatingFromHistory = useRef(false);

  const updateNodeData = useCallback((updates: Partial<typeof data>) => {
    const nodes = getNodes();
    setNodes(
      nodes.map(node => (node.id === id ? { ...node, data: { ...node.data, ...updates } } : node))
    );
  }, [id, getNodes, setNodes]);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    updateNodeData({ title: e.target.value });
  }, [updateNodeData]);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    updateNodeData({ content: newContent });
    
    // Add to history if not updating from history
    if (!isUpdatingFromHistory.current) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newContent);
      
      // Limit history to 50 entries
      if (newHistory.length > 50) {
        newHistory.shift();
      }
      
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
    isUpdatingFromHistory.current = false;
  }, [updateNodeData, history, historyIndex]);

  // Basic markdown validation
  const getContentStats = useCallback(() => {
    const lines = content.split('\n');
    const words = content.trim().split(/\s+/).filter(w => w.length > 0);
    const codeBlocks = (content.match(/```/g) || []).length;
    const hasUnclosedCodeBlock = codeBlocks % 2 !== 0;
    const links = (content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || []).length;
    const headings = (content.match(/^#{1,6}\s/gm) || []).length;
    // Rough token estimation (1 token ≈ 4 characters or 0.75 words)
    const tokens = Math.round(content.length / 4);
    
    return {
      lines: lines.length,
      words: words.length,
      characters: content.length,
      tokens,
      codeBlocks: Math.floor(codeBlocks / 2),
      hasUnclosedCodeBlock,
      links,
      headings
    };
  }, [content]);

  const handleDoubleClick = useCallback(() => {
    setIsExpanded(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsPoppedOut(false);
    setIsExpanded(false);
  }, []);
  
  // Helper function to check if an item matches search query
  const matchesSearch = useCallback((syntax: string, description: string) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return syntax.toLowerCase().includes(query) || description.toLowerCase().includes(query);
  }, [searchQuery]);
  
  // Undo function
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      isUpdatingFromHistory.current = true;
      const newIndex = historyIndex - 1;
      const previousContent = history[newIndex];
      setContent(previousContent);
      setHistoryIndex(newIndex);
      updateNodeData({ content: previousContent });
    }
  }, [history, historyIndex, updateNodeData]);
  
  // Redo function
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUpdatingFromHistory.current = true;
      const newIndex = historyIndex + 1;
      const nextContent = history[newIndex];
      setContent(nextContent);
      setHistoryIndex(newIndex);
      updateNodeData({ content: nextContent });
    }
  }, [history, historyIndex, updateNodeData]);

  // Apply markdown formatting
  const applyFormat = useCallback((format: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const beforeText = content.substring(0, start);
    const afterText = content.substring(end);
    
    let newText = '';
    let cursorOffset = 0;
    
    switch(format) {
      case 'bold':
        newText = `**${selectedText || 'bold text'}**`;
        cursorOffset = selectedText ? newText.length : 2;
        break;
      case 'italic':
        newText = `*${selectedText || 'italic text'}*`;
        cursorOffset = selectedText ? newText.length : 1;
        break;
      case 'code':
        if (selectedText.includes('\n')) {
          newText = `\`\`\`\n${selectedText || 'code'}\n\`\`\``;
          cursorOffset = 4;
        } else {
          newText = `\`${selectedText || 'code'}\``;
          cursorOffset = selectedText ? newText.length : 1;
        }
        break;
      case 'heading':
        newText = `## ${selectedText || 'Heading'}`;
        cursorOffset = 3;
        break;
      case 'heading1':
        newText = `# ${selectedText || 'Heading 1'}`;
        cursorOffset = 2;
        break;
      case 'list':
        newText = `- ${selectedText || 'List item'}`;
        cursorOffset = 2;
        break;
      case 'numbered':
        newText = `1. ${selectedText || 'List item'}`;
        cursorOffset = 3;
        break;
      case 'link':
        newText = `[${selectedText || 'link text'}](url)`;
        cursorOffset = selectedText ? newText.length - 5 : 1;
        break;
      case 'image':
        newText = `![${selectedText || 'alt text'}](image-url)`;
        cursorOffset = selectedText ? newText.length - 11 : 2;
        break;
      case 'blockquote':
        newText = `> ${selectedText || 'Quote'}`;
        cursorOffset = 2;
        break;
      case 'hr':
        newText = `\n---\n`;
        cursorOffset = 5;
        break;
      case 'strike':
        newText = `~~${selectedText || 'strikethrough'}~~`;
        cursorOffset = selectedText ? newText.length : 2;
        break;
      case 'table':
        newText = `| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |`;
        cursorOffset = 2;
        break;
      case 'codeblock':
        newText = `\`\`\`${selectedText || 'language'}\ncode here\n\`\`\``;
        cursorOffset = 3;
        break;
      // Additional heading levels
      case 'heading3':
        newText = `### ${selectedText || 'Heading 3'}`;
        cursorOffset = 4;
        break;
      case 'heading4':
        newText = `#### ${selectedText || 'Heading 4'}`;
        cursorOffset = 5;
        break;
      case 'heading5':
        newText = `##### ${selectedText || 'Heading 5'}`;
        cursorOffset = 6;
        break;
      case 'heading6':
        newText = `###### ${selectedText || 'Heading 6'}`;
        cursorOffset = 7;
        break;
      // Text formatting
      case 'bold-italic':
        newText = `***${selectedText || 'bold and italic'}***`;
        cursorOffset = selectedText ? newText.length : 3;
        break;
      case 'underline':
        newText = `<u>${selectedText || 'underlined text'}</u>`;
        cursorOffset = selectedText ? newText.length - 4 : 3;
        break;
      case 'subscript':
        newText = `<sub>${selectedText || 'subscript'}</sub>`;
        cursorOffset = selectedText ? newText.length - 6 : 5;
        break;
      case 'superscript':
        newText = `<sup>${selectedText || 'superscript'}</sup>`;
        cursorOffset = selectedText ? newText.length - 6 : 5;
        break;
      case 'highlight':
        newText = `==${selectedText || 'highlighted text'}==`;
        cursorOffset = selectedText ? newText.length : 2;
        break;
      // Lists
      case 'task':
        newText = `- [ ] ${selectedText || 'Task item'}`;
        cursorOffset = 6;
        break;
      case 'task-checked':
        newText = `- [x] ${selectedText || 'Completed task'}`;
        cursorOffset = 6;
        break;
      case 'nested-list':
        newText = `- ${selectedText || 'Parent item'}\n  - Child item`;
        cursorOffset = 2;
        break;
      case 'definition':
        newText = `${selectedText || 'Term'}\n: Definition`;
        cursorOffset = selectedText ? selectedText.length + 2 : 4;
        break;
      // Links and media
      case 'reference-link':
        newText = `[${selectedText || 'link text'}][ref]\n\n[ref]: url`;
        cursorOffset = selectedText ? newText.length - 10 : 1;
        break;
      case 'auto-link':
        newText = `<${selectedText || 'https://example.com'}>`;
        cursorOffset = selectedText ? newText.length - 1 : 1;
        break;
      case 'video':
        newText = `<video src="${selectedText || 'video-url.mp4'}" controls></video>`;
        cursorOffset = 12;
        break;
      case 'badge':
        newText = `![Badge](https://img.shields.io/badge/${selectedText || 'label-message-blue'})`;
        cursorOffset = 39;
        break;
      // Extended elements
      case 'footnote':
        newText = `${selectedText || 'Text'}[^1]\n\n[^1]: Footnote content`;
        cursorOffset = selectedText ? selectedText.length + 6 : 4;
        break;
      case 'emoji':
        newText = `:${selectedText || 'smile'}:`;
        cursorOffset = selectedText ? newText.length - 1 : 1;
        break;
      case 'mention':
        newText = `@${selectedText || 'username'}`;
        cursorOffset = selectedText ? newText.length : 1;
        break;
      case 'issue':
        newText = `#${selectedText || '123'}`;
        cursorOffset = selectedText ? newText.length : 1;
        break;
      case 'collapsible':
        newText = `<details>\n<summary>${selectedText || 'Click to expand'}</summary>\n\nContent here\n\n</details>`;
        cursorOffset = 19;
        break;
      case 'math-inline':
        newText = `$${selectedText || 'x = y^2'}$`;
        cursorOffset = selectedText ? newText.length - 1 : 1;
        break;
      case 'math-block':
        newText = `$$\n${selectedText || 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}'}\n$$`;
        cursorOffset = 3;
        break;
      case 'comment':
        newText = `<!-- ${selectedText || 'This is a comment'} -->`;
        cursorOffset = 5;
        break;
      case 'escape':
        newText = `\\${selectedText || '*'}`;
        cursorOffset = 1;
        break;
      case 'alert-note':
        newText = `> **Note**\n> ${selectedText || 'This is a note'}`;
        cursorOffset = 11;
        break;
      case 'alert-warning':
        newText = `> **Warning**\n> ${selectedText || 'This is a warning'}`;
        cursorOffset = 14;
        break;
      case 'alert-important':
        newText = `> **Important**\n> ${selectedText || 'This is important'}`;
        cursorOffset = 16;
        break;
      // Alternative syntax
      case 'heading-alt1':
        newText = `${selectedText || 'Heading 1'}\n=========`;
        cursorOffset = 0;
        break;
      case 'heading-alt2':
        newText = `${selectedText || 'Heading 2'}\n---------`;
        cursorOffset = 0;
        break;
      default:
        return;
    }
    
    const updatedContent = beforeText + newText + afterText;
    setContent(updatedContent);
    updateNodeData({ content: updatedContent });
    
    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(updatedContent);
    if (newHistory.length > 50) {
      newHistory.shift();
    }
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    
    // Restore focus and set cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
    }, 0);
  }, [content, updateNodeData, history, historyIndex]);

  // Handle wheel events to isolate scrolling within the textarea
  const handleWheel = useCallback((e: React.WheelEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const { scrollHeight, clientHeight } = textarea;
    
    // If the textarea has scrollable content, always handle the wheel event internally
    if (scrollHeight > clientHeight) {
      e.stopPropagation();
      e.preventDefault();
      
      // Manually scroll the textarea
      textarea.scrollTop += e.deltaY;
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsPoppedOut(false);
      setIsExpanded(false);
    }
    // Prevent closing on Enter key
    if (e.key === 'Enter') {
      e.stopPropagation();
    }
    
    // Markdown shortcuts and undo/redo (Ctrl/Cmd + key)
    if (e.ctrlKey || e.metaKey) {
      switch(e.key.toLowerCase()) {
        case 'z': // Undo/Redo
          e.preventDefault();
          if (e.shiftKey) {
            redo(); // Ctrl+Shift+Z for redo
          } else {
            undo(); // Ctrl+Z for undo
          }
          break;
        case 'y': // Redo
          e.preventDefault();
          redo();
          break;
        case 'b': // Bold
          e.preventDefault();
          applyFormat('bold');
          break;
        case 'i': // Italic
          e.preventDefault();
          applyFormat('italic');
          break;
        case 'k': // Link
          e.preventDefault();
          applyFormat('link');
          break;
      }
    }
  }, [applyFormat, undo, redo]);

  // Auto-focus and center viewport on this node when expanding
  useEffect(() => {
    if (!isExpanded || isPoppedOut) return;

    // focus editor
    textareaRef.current?.focus();

    // wait for size to update, then center viewport on this node
    requestAnimationFrame(() => {
      updateNodeInternals(id);
      const node = getNode(id);
      if (node) {
        fitView({ nodes: [node], padding: 0.2, duration: 300 });
      }
    });
  }, [isExpanded, isPoppedOut, id, getNode, fitView, updateNodeInternals]);

  // Compute floating toolbox position relative to the node to avoid overlap
  const updateToolboxPosition = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const width = Math.min(rect.width, window.innerWidth - 24);
    const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
    const above = rect.top > 220; // if enough space above, place above; else below
    const top = above ? rect.top - 8 : rect.bottom + 8;
    setToolboxPos({ top, left, width, above });
  }, []);

  useEffect(() => {
    if (!isPoppedOut) return;
    updateToolboxPosition();
    const handler = () => updateToolboxPosition();
    window.addEventListener('resize', handler);
    window.addEventListener('scroll', handler, true);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('scroll', handler, true);
    };
  }, [isPoppedOut, updateToolboxPosition]);

  // No width observers needed; container + w-full keeps elements aligned

  // Editor content used for both docked and popped-out modes
  const ExpandedEditor: React.FC = () => (
    <div className="relative">
      {/* Formatting toolbar */}
      <div className="flex items-center gap-1 mb-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-md">
        <button
          onClick={undo}
          disabled={historyIndex === 0}
          className="nodrag p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Undo (Ctrl+Z)"
          type="button"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={redo}
          disabled={historyIndex === history.length - 1}
          className="nodrag p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
          type="button"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
        <button
          onClick={() => applyFormat('bold')}
          className="nodrag p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Bold (Ctrl+B)"
          type="button"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => applyFormat('italic')}
          className="nodrag p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Italic (Ctrl+I)"
          type="button"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => applyFormat('code')}
          className="nodrag p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Code"
          type="button"
        >
          <Code className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
        <button
          onClick={() => applyFormat('heading')}
          className="nodrag p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Heading"
          type="button"
        >
          <Hash className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => applyFormat('list')}
          className="nodrag p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="List"
          type="button"
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => applyFormat('link')}
          className="nodrag p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Link (Ctrl+K)"
          type="button"
        >
          <Link2 className="w-3.5 h-3.5" />
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => {
              setShowHelp(true);
              setIsPoppedOut((prev) => !prev);
            }}
            className={`nodrag p-1.5 rounded transition-colors hover:bg-gray-200 dark:hover:bg-gray-700`}
            title={isPoppedOut ? 'Dock toolbox' : 'Pop out toolbox'}
            type="button"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className={`nodrag p-1.5 rounded transition-colors ${
              showHelp 
                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            title="Markdown Reference"
            type="button"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
          <div className="text-xs text-gray-500 px-2 flex items-center gap-2">
            <span>History: {historyIndex + 1}/{history.length}</span>
            <span>•</span>
            <span>Spell check ✓</span>
          </div>
        </div>
      </div>
      
      {/* Comprehensive Markdown Reference Panel */}
      {showHelp && (
        <div
          className={`${isPoppedOut ? 'fixed z-[1000] max-w-[90vw] max-h-[85vh] p-2 shadow-xl' : 'mb-2'} bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-xs overflow-hidden`}
          style={
            isPoppedOut
              ? {
                  top: toolboxPos.top,
                  left: toolboxPos.left,
                  width: toolboxPos.width,
                  transform: toolboxPos.above ? 'translateY(-100%)' : undefined,
                }
              : undefined
          }
        >
          {isPoppedOut && (
            <div className="flex items-center justify-between mb-1 px-1">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Toolbox</div>
              <button onClick={() => setIsPoppedOut(false)} className="nodrag p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title="Dock toolbox" type="button">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {/* Search Bar */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search markdown syntax..."
                className="nodrag w-full pl-7 pr-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex items-center gap-1 p-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            <button
              onClick={() => setActiveTab('text')}
              className={`nodrag flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                activeTab === 'text' 
                  ? 'bg-blue-500 text-white' 
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              type="button"
            >
              <Type className="w-3 h-3" />
              <span>Text</span>
            </button>
            <button
              onClick={() => setActiveTab('headings')}
              className={`nodrag flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                activeTab === 'headings' 
                  ? 'bg-blue-500 text-white' 
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              type="button"
            >
              <Heading className="w-3 h-3" />
              <span>Headings</span>
            </button>
            <button
              onClick={() => setActiveTab('lists')}
              className={`nodrag flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                activeTab === 'lists' 
                  ? 'bg-blue-500 text-white' 
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              type="button"
            >
              <List className="w-3 h-3" />
              <span>Lists</span>
            </button>
            <button
              onClick={() => setActiveTab('links')}
              className={`nodrag flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                activeTab === 'links' 
                  ? 'bg-blue-500 text-white' 
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              type="button"
            >
              <Link2 className="w-3 h-3" />
              <span>Links</span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`nodrag flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                activeTab === 'code' 
                  ? 'bg-blue-500 text-white' 
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              type="button"
            >
              <Code className="w-3 h-3" />
              <span>Code</span>
            </button>
            <button
              onClick={() => setActiveTab('tables')}
              className={`nodrag flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                activeTab === 'tables' 
                  ? 'bg-blue-500 text-white' 
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              type="button"
            >
              <Table className="w-3 h-3" />
              <span>Tables</span>
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`nodrag flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                activeTab === 'advanced' 
                  ? 'bg-blue-500 text-white' 
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              type="button"
            >
              <Zap className="w-3 h-3" />
              <span>Advanced</span>
            </button>
            <button
              onClick={() => setActiveTab('extended')}
              className={`nodrag flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                activeTab === 'extended' 
                  ? 'bg-blue-500 text-white' 
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              type="button"
            >
              <Settings className="w-3 h-3" />
              <span>Extended</span>
            </button>
            <button
              onClick={() => setActiveTab('vars')}
              className={`nodrag flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                activeTab === 'vars' 
                  ? 'bg-blue-500 text-white' 
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              type="button"
            >
              <Calendar className="w-3 h-3" />
              <span>Variables</span>
            </button>
          </div>
          
          {/* Tab Content */}
          <div className="p-3 max-h-[400px] overflow-y-auto">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {/* The existing tab panels remain unchanged below */}
              {/* Text & Style Tab */}
              {activeTab === 'text' && (
                <>
                  {matchesSearch('**bold**', 'bold text') && (
                    <button
                      onClick={() => applyFormat('bold')}
                      className="nodrag flex items-center gap-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-left transition-colors cursor-pointer"
                      type="button"
                    >
                      <Bold className="w-3 h-3" />
                      <code className="bg-gray-200 dark:bg-gray-800 px-1">**bold**</code>
                      <span className="text-gray-500">→ <strong>bold</strong></span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => applyFormat('italic')}
                    className="nodrag flex items-center gap-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-left transition-colors cursor-pointer"
                    type="button"
                  >
                    <Italic className="w-3 h-3" />
                    <code className="bg-gray-200 dark:bg-gray-800 px-1">*italic*</code>
                    <span className="text-gray-500">→ <em>italic</em></span>
                  </button>
                  
                  <button
                    onClick={() => applyFormat('bold-italic')}
                    className="nodrag flex items-center gap-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-left transition-colors cursor-pointer"
                    type="button"
                  >
                    <Bold className="w-3 h-3" />
                    <code className="bg-gray-200 dark:bg-gray-800 px-1">***bold italic***</code>
                    <span className="text-gray-500">→ <strong><em>both</em></strong></span>
                  </button>
                  
                  <button
                    onClick={() => applyFormat('strike')}
                    className="nodrag flex items-center gap-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-left transition-colors cursor-pointer"
                    type="button"
                  >
                    <Type className="w-3 h-3" />
                    <code className="bg-gray-200 dark:bg-gray-800 px-1">~~strike~~</code>
                    <span className="text-gray-500">→ <del>strike</del></span>
                  </button>
                  
                  <button
                    onClick={() => applyFormat('underline')}
                    className="nodrag flex items-center gap-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-left transition-colors cursor-pointer"
                    type="button"
                  >
                    <Type className="w-3 h-3" />
                    <code className="bg-gray-200 dark:bg-gray-800 px-1">&lt;u&gt;text&lt;/u&gt;</code>
                    <span className="text-gray-500">→ <u>underline</u></span>
                  </button>
                  
                  <button
                    onClick={() => applyFormat('highlight')}
                    className="nodrag flex items-center gap-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-left transition-colors cursor-pointer"
                    type="button"
                  >
                    <Type className="w-3 h-3" />
                    <code className="bg-gray-200 dark:bg-gray-800 px-1">==highlight==</code>
                    <span className="text-gray-500">→ <mark>highlight</mark></span>
                  </button>
                  
                  <button
                    onClick={() => applyFormat('subscript')}
                    className="nodrag flex items-center gap-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-left transition-colors cursor-pointer"
                    type="button"
                  >
                    <Type className="w-3 h-3" />
                    <code className="bg-gray-200 dark:bg-gray-800 px-1">&lt;sub&gt;2&lt;/sub&gt;</code>
                    <span className="text-gray-500">→ H<sub>2</sub>O</span>
                  </button>
                  
                  <button
                    onClick={() => applyFormat('superscript')}
                    className="nodrag flex items-center gap-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-left transition-colors cursor-pointer"
                    type="button"
                  >
                    <Type className="w-3 h-3" />
                    <code className="bg-gray-200 dark:bg-gray-800 px-1">&lt;sup&gt;2&lt;/sup&gt;</code>
                    <span className="text-gray-500">→ X<sup>2</sup></span>
                  </button>
                </>
              )}
              
              {/* Headings Tab */}
              {activeTab === 'headings' && (
                <>
                  {[1, 2, 3, 4, 5, 6].map((level) => (
                    <button
                      key={`heading${level}`}
                      onClick={() => applyFormat(level === 1 ? 'heading1' : level === 2 ? 'heading' : `heading${level}`)}
                      className="nodrag flex items-center gap-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-left transition-colors cursor-pointer"
                      type="button"
                    >
                      <Hash className="w-3 h-3" />
                      <code className="bg-gray-200 dark:bg-gray-800 px-1">{`${'#'.repeat(level)} Heading`}</code>
                      <span className="text-gray-500">→ H{level}</span>
                    </button>
                  ))}
                  
                  <button
                    onClick={() => applyFormat('heading-alt1')}
                    className="nodrag flex items-center gap-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-left transition-colors cursor-pointer"
                    type="button"
                  >
                    <Hash className="w-3 h-3" />
                    <code className="bg-gray-200 dark:bg-gray-800 px-1">Alt H1 (===)</code>
                    <span className="text-gray-500">→ H1</span>
                  </button>
                  
                  <button
                    onClick={() => applyFormat('heading-alt2')}
                    className="nodrag flex items-center gap-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-left transition-colors cursor-pointer"
                    type="button"
                  >
                    <Hash className="w-3 h-3" />
                    <code className="bg-gray-200 dark:bg-gray-800 px-1">Alt H2 (---)</code>
                    <span className="text-gray-500">→ H2</span>
                  </button>
                </>
              )}
              
              {/* Lists Tab */}
              {activeTab === 'lists' && (
                <>
                  <button
                    onClick={() => applyFormat('list')}
                    className="nodrag flex items-center gap-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-left transition-colors cursor-pointer"
                    type="button"
                  >
                    <List className="w-3 h-3" />
                    <code className="bg-gray-200 dark:bg-gray-800 px-1">- item</code>
                    <span className="text-gray-500">→ • item</span>
                  </button>
                  
                  <button
                    onClick={() => applyFormat('numbered')}
                    className="nodrag flex items-center gap-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-left transition-colors cursor-pointer"
                    type="button"
                  >
                    <ListOrdered className="w-3 h-3" />
                    <code className="bg-gray-200 dark:bg-gray-800 px-1">1. item</code>
                    <span className="text-gray-500">→ 1. item</span>
                  </button>
                  
                  <button
                    onClick={() => applyFormat('task')}
                    className="nodrag flex items-center gap-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-left transition-colors cursor-pointer"
                    type="button"
                  >
                    <CheckSquare className="w-3 h-3" />
                    <code className="bg-gray-200 dark:bg-gray-800 px-1">- [ ] task</code>
                    <span className="text-gray-500">→ ☐ task</span>
                  </button>
                  
                  <button
                    onClick={() => applyFormat('task-checked')}
                    className="nodrag flex items-center gap-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-left transition-colors cursor-pointer"
                    type="button"
                  >
                    <CheckSquare className="w-3 h-3" />
                    <code className="bg-gray-200 dark:bg-gray-800 px-1">- [x] done</code>
                    <span className="text-gray-500">→ ☑ done</span>
                  </button>
                  
                  <button
                    onClick={() => applyFormat('nested-list')}
                    className="nodrag flex items-center gap-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-left transition-colors cursor-pointer"
                    type="button"
                  >
                    <List className="w-3 h-3" />
                    <code className="bg-gray-200 dark:bg-gray-800 px-1">  - nested</code>
                    <span className="text-gray-500">→ indented</span>
                  </button>
                  
                  <button
                    onClick={() => applyFormat('definition')}
                    className="nodrag flex items-center gap-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-left transition-colors cursor-pointer"
                    type="button"
                  >
                    <AlignLeft className="w-3 h-3" />
                    <code className="bg-gray-200 dark:bg-gray-800 px-1">Term\n: Def</code>
                    <span className="text-gray-500">→ definition list</span>
                  </button>
                </>
              )}
              
              {/* Links & Media Tab */}
              {activeTab === 'links' && (
                <>
                  <button
                    onClick={() => applyFormat('link')}
                    className="nodrag flex items-center gap-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-left transition-colors cursor-pointer"
                    type="button"
                  >
                    <Link2 className="w-3 h-3" />
                    <code className="bg-gray-200 dark:bg-gray-800 px-1">[text](url)</code>
                    <span className="text-gray-500">→ link</span>
                  </button>
                  
                  <button
                    onClick={() => applyFormat('reference-link')}
                    className="nodrag flex items-center gap-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-left transition-colors cursor-pointer"
                    type="button"
                  >
                    <Link2 className="w-3 h-3" />
                    <code className="bg-gray-200 dark:bg-gray-800 px-1">[text][ref]</code>
                    <span className="text-gray-500">→ ref link</span>
                  </button>
                  
                  <button
                    onClick={() => applyFormat('auto-link')}
                    className="nodrag flex items-center gap-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-left transition-colors cursor-pointer"
                    type="button"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <code className="bg-gray-200 dark:bg-gray-800 px-1">&lt;url&gt;</code>
                    <span className="text-gray-500">→ auto link</span>
                  </button>
                  
                  <button
                    onClick={() => applyFormat('image')}
                    className="nodrag flex items-center gap-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-left transition-colors cursor-pointer"
                    type="button"
                  >
                    <ImageIcon className="w-3 h-3" aria-hidden="true" />
                    <code className="bg-gray-200 dark:bg-gray-800 px-1">![alt](url)</code>
                    <span className="text-gray-500">→ image</span>
                  </button>
                  
                  <button
                    onClick={() => applyFormat('video')}
                    className="nodrag flex items-center gap-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-left transition-colors cursor-pointer"
                    type="button"
                  >
                    <FileCode className="w-3 h-3" />
                    <code className="bg-gray-200 dark:bg-gray-800 px-1">&lt;video&gt;</code>
                    <span className="text-gray-500">→ video</span>
                  </button>
                  
                  <button
                    onClick={() => applyFormat('badge')}
                    className="nodrag flex items-center gap-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-left transition-colors cursor-pointer"
                    type="button"
                  >
                    <Zap className="w-3 h-3" />
                    <code className="bg-gray-200 dark:bg-gray-800 px-1">![Badge](...)</code>
                    <span className="text-gray-500">→ badge</span>
                  </button>
                </>
              )}
              
              {/* Code Tab */}
              {activeTab === 'code' && (
                <>
                  <button
                    onClick={() => applyFormat('code')}
                    className="nodrag flex items-center gap-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-left transition-colors cursor-pointer"
                    type="button"
                  >
                    <Code className="w-3 h-3" />
                    <code className="bg-gray-200 dark:bg-gray-800 px-1">`code`</code>
                    <span className="text-gray-500">→ inline</span>
                  </button>
                  
                  <button
                    onClick={() => applyFormat('codeblock')}
                    className="nodrag flex items-center gap-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-left transition-colors cursor-pointer"
                    type="button"
                  >
                    <Terminal className="w-3 h-3" />
                    <code className="bg-gray-200 dark:bg-gray-800 px-1">```lang</code>
                    <span className="text-gray-500">→ block</span>
                  </button>
                  
                  <div className="col-span-2 p-2 bg-gray-100 dark:bg-gray-800 rounded">
                    <div className="text-xs font-semibold mb-1">Common Languages:</div>
                    <div className="flex flex-wrap gap-1">
                      {['js', 'json', 'python', 'java', 'cpp', 'html', 'css', 'sql', 'bash', 'typescript', 'jsx', 'tsx', 'yaml', 'xml', 'markdown'].map(lang => (
                        <button
                          key={lang}
                          onClick={() => {
                            const textarea = textareaRef.current;
                            if (!textarea) return;
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const selectedText = content.substring(start, end);
                            const newText = `\`\`\`${lang}\n${selectedText || 'code here'}\n\`\`\``;
                            const beforeText = content.substring(0, start);
                            const afterText = content.substring(end);
                            const updatedContent = beforeText + newText + afterText;
                            setContent(updatedContent);
                            updateNodeData({ content: updatedContent });
                          }}
                          className="nodrag px-2 py-0.5 bg-white dark:bg-gray-700 rounded text-xs hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                          type="button"
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              
              {/* Tables Tab */}
              {activeTab === 'tables' && (
                <>
                  <button
                    onClick={() => applyFormat('table')}
                    className="nodrag flex items-center gap-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-left transition-colors cursor-pointer col-span-2"
                    type="button"
                  >
                    <Table className="w-3 h-3" />
                    <code className="bg-gray-200 dark:bg-gray-800 px-1">| Col1 | Col2 |</code>
                    <span className="text-gray-500">→ table</span>
                  </button>
                  
                  <div className="col-span-2 p-2 bg-gray-100 dark:bg-gray-800 rounded">
                    <div className="text-xs font-semibold mb-1">Table Example:</div>
                    <pre className="text-xs bg-white dark:bg-gray-900 p-2 rounded overflow-x-auto">{`| Header 1 | Header 2 | Header 3 |
|----------|:--------:|---------:|
| Left     | Center   | Right    |
| Cell 1   | Cell 2   | Cell 3   |`}</pre>
                    <div className="text-xs text-gray-500 mt-1">
                      • Use : for alignment (left, center, right)
                    </div>
                  </div>
                </>
              )}
              
              {/* Advanced Tab */}
              {activeTab === 'advanced' && (
                <>
                  <button
                    onClick={() => applyFormat('blockquote')}
                    className="nodrag flex items-center gap-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-left transition-colors cursor-pointer"
                    type="button"
                  >
                    <Quote className="w-3 h-3" />
                    <code className="bg-gray-200 dark:bg-gray-800 px-1">&gt; quote</code>
                    <span className="text-gray-500">→ blockquote</span>
                  </button>
                  
                  <button
                    onClick={() => applyFormat('hr')}
                    className="nodrag flex items-center gap-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-left transition-colors cursor-pointer"
                    type="button"
                  >
                    <Minus className="w-3 h-3" />
                    <code className="bg-gray-200 dark:bg-gray-800 px-1">---</code>
                    <span className="text-gray-500">→ horizontal rule</span>
                  </button>
                  
                  <button
                    onClick={() => applyFormat('footnote')}
                    className="nodrag flex items-center gap-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-left transition-colors cursor-pointer"
                    type="button"
                  >
                    <Type className="w-3 h-3" />
                    <code className="bg-gray-200 dark:bg-gray-800 px-1">Text[^1]</code>
                    <span className="text-gray-500">→ footnote</span>
                  </button>
                  
                  <button
                    onClick={() => applyFormat('collapsible')}
                    className="nodrag flex items-center gap-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-left transition-colors cursor-pointer"
                    type="button"
                  >
                    <ChevronRight className="w-3 h-3" />
                    <code className="bg-gray-200 dark:bg-gray-800 px-1">&lt;details&gt;</code>
                    <span className="text-gray-500">→ collapsible</span>
                  </button>
                  
                  <button
                    onClick={() => applyFormat('comment')}
                    className="nodrag flex items-center gap-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-left transition-colors cursor-pointer"
                    type="button"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <code className="bg-gray-200 dark:bg-gray-800 px-1">&lt;!-- --&gt;</code>
                    <span className="text-gray-500">→ comment</span>
                  </button>
                  
                  <button
                    onClick={() => applyFormat('escape')}
                    className="nodrag flex items-center gap-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-left transition-colors cursor-pointer"
                    type="button"
                  >
                    <Code className="w-3 h-3" />
                    <code className="bg-gray-200 dark:bg-gray-800 px-1">\*escape\*</code>
                    <span className="text-gray-500">→ literal *</span>
                  </button>
                  
                  <button
                    onClick={() => applyFormat('math-inline')}
                    className="nodrag flex items-center gap-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-left transition-colors cursor-pointer"
                    type="button"
                  >
                    <Zap className="w-3 h-3" />
                    <code className="bg-gray-200 dark:bg-gray-800 px-1">$x=y^2$</code>
                    <span className="text-gray-500">→ inline math</span>
                  </button>
                  
                  <button
                    onClick={() => applyFormat('math-block')}
                    className="nodrag flex items-center gap-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-left transition-colors cursor-pointer"
                    type="button"
                  >
                    <Zap className="w-3 h-3" />
                    <code className="bg-gray-200 dark:bg-gray-800 px-1">$$...$$</code>
                    <span className="text-gray-500">→ math block</span>
                  </button>
                </>
              )}
              
              {/* Extended (GitHub/Platform-Specific) Tab */}
              {activeTab === 'extended' && (
                <>
                  <button
                    onClick={() => applyFormat('emoji')}
                    className="nodrag flex items-center gap-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-left transition-colors cursor-pointer"
                    type="button"
                  >
                    <Smile className="w-3 h-3" />
                    <code className="bg-gray-200 dark:bg-gray-800 px-1">:smile:</code>
                    <span className="text-gray-500">→ 😄</span>
                  </button>
                  
                  <button
                    onClick={() => applyFormat('mention')}
                    className="nodrag flex items-center gap-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-left transition-colors cursor-pointer"
                    type="button"
                  >
                    <User className="w-3 h-3" />
                    <code className="bg-gray-200 dark:bg-gray-800 px-1">@username</code>
                    <span className="text-gray-500">→ mention</span>
                  </button>
                  
                  <button
                    onClick={() => applyFormat('issue')}
                    className="nodrag flex items-center gap-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-left transition-colors cursor-pointer"
                    type="button"
                  >
                    <GitPullRequest className="w-3 h-3" />
                    <code className="bg-gray-200 dark:bg-gray-800 px-1">#123</code>
                    <span className="text-gray-500">→ issue/PR</span>
                  </button>
                  
                  <button
                    onClick={() => applyFormat('alert-note')}
                    className="nodrag flex items-center gap-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-left transition-colors cursor-pointer"
                    type="button"
                  >
                    <AlertCircle className="w-3 h-3" />
                    <code className="bg-gray-200 dark:bg-gray-800 px-1">&gt; **Note**</code>
                    <span className="text-gray-500">→ alert</span>
                  </button>
                  
                  <button
                    onClick={() => applyFormat('alert-warning')}
                    className="nodrag flex items-center gap-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-left transition-colors cursor-pointer"
                    type="button"
                  >
                    <AlertCircle className="w-3 h-3" />
                    <code className="bg-gray-200 dark:bg-gray-800 px-1">&gt; **Warning**</code>
                    <span className="text-gray-500">→ warning</span>
                  </button>
                  
                  <button
                    onClick={() => applyFormat('alert-important')}
                    className="nodrag flex items-center gap-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-left transition-colors cursor-pointer"
                    type="button"
                  >
                    <AlertCircle className="w-3 h-3" />
                    <code className="bg-gray-200 dark:bg-gray-800 px-1">&gt; **Important**</code>
                    <span className="text-gray-500">→ important</span>
                  </button>
                  
                  <div className="col-span-2 p-2 bg-gray-100 dark:bg-gray-800 rounded">
                    <div className="text-xs text-gray-500">
                      <strong>Note:</strong> These features depend on your Markdown processor (GitHub, Discord, etc.)
                    </div>
                  </div>
                </>
              )}

              {/* Variables Tab */}
              {activeTab === 'vars' && (
                <>
                  {[
                    { label: 'Current Date', value: 'Current Date: {{current_date}}', Icon: Calendar },
                    { label: 'Current User', value: 'Current User: {{current_user}}', Icon: User },
                    { label: 'UTC ISO Datetime', value: 'UTC ISO Datetime: {{iso_datetime}}', Icon: Clock },
                    { label: 'Current Date & Time', value: 'Current Date & Time: {{current_datetime}}', Icon: Clock },
                  ].filter(item => matchesSearch(item.value, item.label)).map(({ label, value, Icon }) => (
                    <button
                      key={label}
                      onClick={() => {
                        const textarea = textareaRef.current;
                        if (!textarea) return;
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const beforeText = content.substring(0, start);
                        const afterText = content.substring(end);
                        const updatedContent = beforeText + value + afterText;
                        setContent(updatedContent);
                        updateNodeData({ content: updatedContent });
                        setTimeout(() => {
                          textarea.focus();
                          const pos = start + value.length;
                          textarea.setSelectionRange(pos, pos);
                        }, 0);
                      }}
                      className="nodrag flex items-center gap-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-left transition-colors cursor-pointer col-span-2"
                      type="button"
                    >
                      <Icon className="w-3 h-3" />
                      <code className="bg-gray-200 dark:bg-gray-800 px-1 whitespace-pre">{value}</code>
                    </button>
                  ))}
                  <div className="col-span-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-500">
                    These variables will be rendered by the workflow runtime where supported.
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {!data?.childPanelOnly && (
        <div className="overflow-auto inline-block min-w-full">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            onWheel={handleWheel}
            spellCheck={true}
            autoCorrect="on"
            autoCapitalize="sentences"
            className="nodrag nowheel w-full min-w-full h-64 p-4 text-sm font-mono bg-white dark:bg-gray-900 border-2 border-blue-500 rounded-md overflow-auto focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize"
            placeholder="Enter markdown, code, or plain text... (Esc to close)"
          />
          <div className="mt-2 px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded-md flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 w-full">
            <div className="flex items-center gap-3">
              <span>{getContentStats().words} words</span>
              <span>{getContentStats().lines} lines</span>
              <span>~{getContentStats().tokens} tokens</span>
              {getContentStats().headings > 0 && (
                <span>{getContentStats().headings} headings</span>
              )}
              {getContentStats().codeBlocks > 0 && (
                <span>{getContentStats().codeBlocks} code blocks</span>
              )}
              {getContentStats().hasUnclosedCodeBlock && (
                <span className="text-yellow-500 font-semibold">⚠ Unclosed code block</span>
              )}
            </div>
            <span className="text-xs italic">Drag corner to resize</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <BaseNode className={`transition-all duration-300 ${isExpanded ? 'min-w-[640px]' : 'w-[320px]'}`}>
      <div ref={containerRef} className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4 text-blue-500" />
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            className="nodrag flex-1 px-2 py-1 text-sm font-semibold bg-transparent border-b border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-blue-500 focus:outline-none transition-colors"
            placeholder="Section Title"
          />
          {isExpanded && (
            <button
              onClick={handleClose}
              className="nodrag p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Close editor (Esc)"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
        
        {isExpanded ? (
          <ExpandedEditor />
        ) : (
          <div
            onDoubleClick={handleDoubleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`nodrag relative min-h-[120px] max-h-[120px] overflow-hidden p-3 text-sm font-mono rounded-md cursor-pointer whitespace-pre-wrap break-words transition-all ${
              isHovered 
                ? 'bg-white dark:bg-gray-900 border-2 border-blue-400 shadow-sm' 
                : 'bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700'
            }`}
            title="Double-click to expand and edit"
          >
            {content ? (
              <div className="relative">
                {content}
                {isHovered && (
                  <Maximize2 className="absolute top-0 right-0 w-4 h-4 text-blue-500 opacity-60" />
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <span className="text-center">
                  Double-click to edit
                  <br />
                  <span className="text-xs">(Markdown, code, or text)</span>
                </span>
              </div>
            )}
          </div>
        )}
      </div>
      
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-blue-500 !w-4 !h-4"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-blue-500 !w-4 !h-4"
      />
    </BaseNode>
  );
}

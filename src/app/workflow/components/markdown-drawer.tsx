'use client';

import React from 'react';
import {
  Search,
  Type,
  Hash,
  List,
  Code,
  Image,
  Link as LinkIcon,
  Table,
  Minus,
  Calendar,
  Clock,
  User,
  Quote,
  ChevronRight,
  MessageSquare,
  Zap,
  FileCode,
  Smile,
  AlertCircle,
  GitPullRequest,
} from 'lucide-react';
import { useAppStore } from '@/app/workflow/store';
import { Button } from '@/components/ui/button';

type ToolboxItem = { icon: any; label: string; snippet: string };

const toolboxItems: Record<string, ToolboxItem[]> = {
  Text: [
    { icon: Type, label: 'Bold', snippet: '**bold**' },
    { icon: Type, label: 'Italic', snippet: '*italic*' },
    { icon: Type, label: 'Bold Italic', snippet: '***bold italic***' },
    { icon: Type, label: 'Strikethrough', snippet: '~~strike~~' },
    { icon: Type, label: 'Highlight', snippet: '==highlight==' },
    { icon: Type, label: 'Underline', snippet: '<u>text</u>' },
    { icon: Type, label: 'Subscript', snippet: '<sub>2</sub>' },
    { icon: Type, label: 'Superscript', snippet: '<sup>2</sup>' },
    { icon: Code, label: 'Inline Code', snippet: '`code`' },
  ],
  Headings: [
    { icon: Hash, label: 'H1', snippet: '# Heading 1' },
    { icon: Hash, label: 'H2', snippet: '## Heading 2' },
    { icon: Hash, label: 'H3', snippet: '### Heading 3' },
    { icon: Hash, label: 'H4', snippet: '#### Heading 4' },
    { icon: Hash, label: 'H5', snippet: '##### Heading 5' },
    { icon: Hash, label: 'H6', snippet: '###### Heading 6' },
  ],
  Lists: [
    { icon: List, label: 'Bullet', snippet: '- Item' },
    { icon: List, label: 'Numbered', snippet: '1. Item' },
    { icon: List, label: 'Task', snippet: '- [ ] Task item' },
    { icon: List, label: 'Task Done', snippet: '- [x] Done item' },
  ],
  Links: [
    { icon: LinkIcon, label: 'Link', snippet: '[text](url)' },
    { icon: Image, label: 'Image', snippet: '![alt](url)' },
    { icon: FileCode, label: 'Video', snippet: '<video src="url" controls></video>' },
    { icon: FileCode, label: 'Audio', snippet: '<audio src="url" controls></audio>' },
    { icon: LinkIcon, label: 'Reference Link', snippet: '[text][ref]\n\n[ref]: url' },
  ],
  Code: [
    { icon: Code, label: 'Inline', snippet: '`code`' },
    { icon: Code, label: 'JavaScript', snippet: '```javascript\n// code here\n```' },
    { icon: Code, label: 'TypeScript', snippet: '```typescript\n// code here\n```' },
    { icon: Code, label: 'Python', snippet: '```python\n# code here\n```' },
    { icon: Code, label: 'HTML', snippet: '```html\n<!-- code here -->\n```' },
    { icon: Code, label: 'CSS', snippet: '```css\n/* code here */\n```' },
    { icon: Code, label: 'JSON', snippet: '```json\n{}\n```' },
    { icon: Code, label: 'Markdown', snippet: '```markdown\n# heading\n```' },
    { icon: Code, label: 'Bash', snippet: '```bash\n# command\n```' },
  ],
  Tables: [
    {
      icon: Table,
      label: 'Basic Table',
      snippet:
        '| Header 1 | Header 2 | Header 3 |\n|----------|:--------:|---------:|\n| Left     | Center   | Right    |\n| Cell 1   | Cell 2   | Cell 3   |',
    },
  ],
  Advanced: [
    { icon: Quote, label: 'Blockquote', snippet: '> quote' },
    { icon: Minus, label: 'Horizontal Rule', snippet: '---' },
    { icon: Type, label: 'Footnote', snippet: 'Text[^1]\n\n[^1]: Footnote content' },
    {
      icon: ChevronRight,
      label: 'Collapsible',
      snippet: '<details>\n<summary>Title</summary>\n\nContent...\n\n</details>',
    },
    { icon: MessageSquare, label: 'Comment', snippet: '<!-- comment -->' },
    { icon: Code, label: 'Escape *', snippet: '\\*escape\\*' },
    { icon: Zap, label: 'Inline Math', snippet: '$x=y^2$' },
    { icon: Zap, label: 'Math Block', snippet: '$$\nE=mc^2\n$$' },
  ],
  Extended: [
    { icon: Smile, label: 'Emoji', snippet: ':smile:' },
    { icon: User, label: 'Mention', snippet: '@username' },
    { icon: GitPullRequest, label: 'Issue/PR', snippet: '#123' },
    { icon: AlertCircle, label: 'Alert: Note', snippet: '> **Note**\n> This is a note' },
    { icon: AlertCircle, label: 'Alert: Warning', snippet: '> **Warning**\n> This is a warning' },
    { icon: AlertCircle, label: 'Alert: Important', snippet: '> **Important**\n> This is important' },
  ],
  Variables: [
    { icon: Calendar, label: 'Current Date', snippet: '{{current_date}}' },
    { icon: User, label: 'Current User', snippet: '{{current_user}}' },
    { icon: Clock, label: 'UTC ISO Datetime', snippet: '{{iso_datetime}}' },
    { icon: Clock, label: 'Current Date & Time', snippet: '{{current_datetime}}' },
  ],
};

interface MarkdownDrawerProps {
  onInsert: (text: string) => void;
}

export function MarkdownDrawer({ onInsert }: MarkdownDrawerProps) {
  const markdownDrawer = useAppStore((state) => state.markdownDrawer);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<keyof typeof toolboxItems>('Text');

  if (!markdownDrawer) return null;

  const filtered = searchTerm
    ? (Object.entries(toolboxItems).reduce((acc, [category, items]) => {
        const f = items.filter((item) =>
          item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.snippet.toLowerCase().includes(searchTerm.toLowerCase()),
        );
        if (f.length) acc[category] = f;
        return acc;
      }, {} as Record<string, ToolboxItem[]>) as typeof toolboxItems)
    : ({ [activeTab]: toolboxItems[activeTab] } as typeof toolboxItems);

  return (
    <div
      className="fixed right-0 top-0 h-full bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 z-50 flex flex-col"
      data-drawer-width={markdownDrawer.width}
    >
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold mb-2">Toolbox</h3>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search markdown syntax..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-7 pr-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded"
          />
        </div>
      </div>

      {!searchTerm && (
        <div className="flex gap-1 p-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {Object.keys(toolboxItems).map((tab) => (
            <Button
              key={tab}
              variant={activeTab === (tab as any) ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(tab as keyof typeof toolboxItems)}
              className="text-xs whitespace-nowrap"
            >
              {tab}
            </Button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2">
        {Object.entries(filtered).map(([category, items]) => (
          <div key={category}>
            {searchTerm && (
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 mt-2">
                {category}
              </h4>
            )}
            <div className="grid grid-cols-2 gap-1">
              {items.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => onInsert(item.snippet)}
                  className="flex items-center gap-1 p-1.5 text-xs bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded border border-gray-200 dark:border-gray-700 transition-colors"
                >
                  <item.icon className="h-3 w-3" />
                  <span className="flex-1 text-left">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

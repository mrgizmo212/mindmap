'use client';

import React from 'react';
import { Search, Type, Hash, List, Code, Image, Link, Table, Minus, Calendar, Clock, User } from 'lucide-react';
import { useAppStore } from '@/app/workflow/store';
import { Button } from '@/components/ui/button';

const toolboxItems = {
  Text: [
    { icon: Type, label: 'Bold', syntax: '**bold**', example: 'bold' },
    { icon: Type, label: 'Bold Italic', syntax: '***bold italic***', example: 'both' },
    { icon: Type, label: 'Underline', syntax: '<u>text</u>', example: 'underline' },
    { icon: Type, label: 'Subscript', syntax: '<sub>2</sub>', example: 'H₂O' },
    { icon: Type, label: 'Superscript', syntax: '<sup>2</sup>', example: 'x²' },
    { icon: Type, label: 'Strikethrough', syntax: '~~text~~', example: 'strike' },
    { icon: Type, label: 'Highlight', syntax: '==text==', example: 'highlight' },
    { icon: Type, label: 'Inline Code', syntax: '`code`', example: 'code' },
  ],
  Headings: [
    { icon: Hash, label: 'H1', syntax: '# ', example: 'Heading 1' },
    { icon: Hash, label: 'H2', syntax: '## ', example: 'Heading 2' },
    { icon: Hash, label: 'H3', syntax: '### ', example: 'Heading 3' },
    { icon: Hash, label: 'H4', syntax: '#### ', example: 'Heading 4' },
    { icon: Hash, label: 'H5', syntax: '##### ', example: 'Heading 5' },
    { icon: Hash, label: 'H6', syntax: '###### ', example: 'Heading 6' },
  ],
  Lists: [
    { icon: List, label: 'Bullet', syntax: '- ', example: 'Item' },
    { icon: List, label: 'Numbered', syntax: '1. ', example: 'Item' },
    { icon: List, label: 'Task', syntax: '- [ ] ', example: 'Task' },
    { icon: List, label: 'Task Done', syntax: '- [x] ', example: 'Done' },
  ],
  Code: [
    { icon: Code, label: 'JavaScript', syntax: '```javascript\n', example: '\n```' },
    { icon: Code, label: 'TypeScript', syntax: '```typescript\n', example: '\n```' },
    { icon: Code, label: 'Python', syntax: '```python\n', example: '\n```' },
    { icon: Code, label: 'HTML', syntax: '```html\n', example: '\n```' },
    { icon: Code, label: 'CSS', syntax: '```css\n', example: '\n```' },
    { icon: Code, label: 'JSON', syntax: '```json\n', example: '\n```' },
    { icon: Code, label: 'Markdown', syntax: '```markdown\n', example: '\n```' },
    { icon: Code, label: 'Bash', syntax: '```bash\n', example: '\n```' },
  ],
  Media: [
    { icon: Image, label: 'Image', syntax: '![alt](url)', example: 'Image' },
    { icon: Link, label: 'Link', syntax: '[text](url)', example: 'Link' },
    { icon: Minus, label: 'Divider', syntax: '---', example: '' },
    { icon: Table, label: 'Table', syntax: `| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |`, example: '' },
  ],
  Variables: [
    { icon: Calendar, label: 'Current Date', syntax: '{{current_date}}', example: '' },
    { icon: User, label: 'Current User', syntax: '{{current_user}}', example: '' },
    { icon: Clock, label: 'ISO DateTime', syntax: '{{iso_datetime}}', example: '' },
    { icon: Clock, label: 'Date & Time', syntax: '{{current_datetime}}', example: '' },
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

  const filteredItems = searchTerm
    ? Object.entries(toolboxItems).reduce((acc, [category, items]) => {
        const filtered = items.filter(item =>
          item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.syntax.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (filtered.length > 0) {
          acc[category as keyof typeof toolboxItems] = filtered;
        }
        return acc;
      }, {} as typeof toolboxItems)
    : { [activeTab]: toolboxItems[activeTab] };

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
              variant={activeTab === tab ? 'default' : 'ghost'}
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
        {Object.entries(filteredItems).map(([category, items]) => (
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
                  onClick={() => onInsert(item.syntax)}
                  className="flex items-center gap-1 p-1.5 text-xs bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded border border-gray-200 dark:border-gray-700 transition-colors"
                >
                  <item.icon className="h-3 w-3" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.example && (
                    <span className="text-[10px] text-gray-400">{item.example}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

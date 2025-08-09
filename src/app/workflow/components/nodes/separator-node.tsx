'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { BaseNode } from '@/components/base-node';
import { WorkflowNodeProps } from './index';

export function SeparatorNode({ data }: WorkflowNodeProps) {
  const separatorType = data?.separatorType || 'line';
  
  const getSeparatorDisplay = () => {
    switch (separatorType) {
      case 'line':
        return '———————';
      case 'space':
        return '⏎ Line Break';
      case 'page-break':
        return '═══ Page Break ═══';
      default:
        return '———————';
    }
  };

  return (
    <BaseNode className="min-w-[260px]" style={{ height: '50px' }}>
      <div className="h-full flex items-center justify-center">
        <div className="text-sm font-semibold text-gray-500 dark:text-gray-400">
          {getSeparatorDisplay()}
        </div>
      </div>
      
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-gray-400 !w-3 !h-3"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-gray-400 !w-3 !h-3"
      />
    </BaseNode>
  );
}

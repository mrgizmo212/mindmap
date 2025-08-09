import { Position } from '@xyflow/react';
import { AppNodeType, NodeConfig } from './components/nodes';

export const NODE_SIZE = { width: 260, height: 50 };

export const nodesConfig: Record<AppNodeType, NodeConfig> = {
  'initial-node': {
    id: 'initial-node',
    title: 'Initial Node',
    status: 'initial',
    handles: [
      {
        type: 'source',
        position: Position.Bottom,
        x: NODE_SIZE.width * 0.5,
        y: NODE_SIZE.height,
      },
    ],
    icon: 'Rocket',
    tooltip: 'Starts your workflow and triggers the first action. Use this to begin any automated process or data pipeline.',
  },
  'transform-node': {
    id: 'transform-node',
    title: 'Transform Node',
    handles: [
      {
        type: 'source',
        position: Position.Bottom,
        x: NODE_SIZE.width * 0.5,
        y: NODE_SIZE.height,
      },
      {
        type: 'target',
        position: Position.Top,
        x: NODE_SIZE.width * 0.5,
        y: 0,
      },
    ],
    icon: 'Spline',
    tooltip: 'Processes and modifies data as it flows through your workflow. Perfect for formatting text, converting data types, or applying calculations.',
  },
  'join-node': {
    id: 'join-node',
    title: 'Join Node',
    status: 'initial',
    handles: [
      {
        id: 'true',
        type: 'target',
        position: Position.Top,
        x: NODE_SIZE.width - NODE_SIZE.width / 3,
        y: 0,
      },
      {
        id: 'false',
        type: 'target',
        position: Position.Top,
        x: NODE_SIZE.width / 3,
        y: 0,
      },
      {
        type: 'source',
        position: Position.Bottom,
        x: NODE_SIZE.width * 0.5,
        y: NODE_SIZE.height,
      },
    ],
    icon: 'Split',
    tooltip: 'Combines multiple workflow paths back into a single flow. Use this to merge data from different branches or wait for multiple tasks to complete.',
  },
  'branch-node': {
    id: 'branch-node',
    title: 'Branch Node',
    status: 'initial',
    handles: [
      {
        type: 'target',
        position: Position.Top,
        x: NODE_SIZE.width * 0.5,
        y: 0,
      },
      {
        id: 'true',
        type: 'source',
        position: Position.Bottom,
        x: NODE_SIZE.width / 3,
        y: NODE_SIZE.height,
      },
      {
        id: 'false',
        type: 'source',
        position: Position.Bottom,
        x: NODE_SIZE.width - NODE_SIZE.width / 3,
        y: NODE_SIZE.height,
      },
    ],
    icon: 'Merge',
    tooltip: 'Creates different paths in your workflow based on conditions. Use this to send data down different routes depending on specific criteria or rules.',
  },
  'output-node': {
    id: 'output-node',
    title: 'Output Node',
    handles: [
      {
        type: 'target',
        position: Position.Top,
        x: NODE_SIZE.width * 0.5,
        y: 0,
      },
    ],
    icon: 'CheckCheck',
    tooltip: 'Completes your workflow and delivers the final result. Use this to save data, send notifications, or trigger external actions.',
  },
  'markdown-node': {
    id: 'markdown-node',
    title: 'Markdown Node',
    handles: [
      {
        type: 'source',
        position: Position.Bottom,
        x: NODE_SIZE.width * 0.5,
        y: NODE_SIZE.height,
      },
      {
        type: 'target',
        position: Position.Top,
        x: NODE_SIZE.width * 0.5,
        y: 0,
      },
    ],
    icon: 'FileText',
    tooltip: 'Create and edit markdown content, code snippets, or plain text. Each node represents a section of your document.',
  },
  'separator-node': {
    id: 'separator-node',
    title: 'Separator Node',
    handles: [
      {
        type: 'source',
        position: Position.Bottom,
        x: NODE_SIZE.width * 0.5,
        y: NODE_SIZE.height,
      },
      {
        type: 'target',
        position: Position.Top,
        x: NODE_SIZE.width * 0.5,
        y: 0,
      },
    ],
    icon: 'Minus',
    tooltip: 'Adds a visual separator or line break between content sections in your markdown output.',
  },
};

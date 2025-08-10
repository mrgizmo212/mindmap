import { Node, NodeProps, XYPosition } from '@xyflow/react';
import { nanoid } from 'nanoid';

import { NODE_SIZE, nodesConfig } from '../../config';
import { iconMapping } from '@/app/workflow/utils/icon-mapping';
import { OutputNode } from './output-node';
import { InitialNode } from './initial-node';
import { TransformNode } from './transform-node';
import { BranchNode } from './branch-node';
import { JoinNode } from './join-node';
import { MarkdownNode } from './markdown-node';
import { SeparatorNode } from './separator-node';

/* WORKFLOW NODE DATA PROPS ------------------------------------------------------ */

export type WorkflowNodeData = {
  title?: string;
  label?: string;
  icon?: keyof typeof iconMapping;
  status?: 'loading' | 'success' | 'error' | 'initial';
  tooltip?: string;
  content?: string;
  separatorType?: 'line' | 'space' | 'page-break';
  /** When present, this node acts as a temporary child editor for the given parent node id */
  childOf?: string;
  /** If true, the node should render in expanded editor mode initially */
  forceExpanded?: boolean;
  /** When true and used with childOf, render only the reference panel (search + tabs) */
  childPanelOnly?: boolean;
};

export type WorkflowNodeProps = NodeProps<Node<WorkflowNodeData>> & {
  type: AppNodeType;
  children?: React.ReactNode;
};

export type NodeConfig = {
  id: AppNodeType;
  title: string;
  status?: 'loading' | 'success' | 'error' | 'initial';
  handles: NonNullable<Node['handles']>;
  icon: keyof typeof iconMapping;
  tooltip?: string;
};

export const nodeTypes = {
  'initial-node': InitialNode,
  'output-node': OutputNode,
  'transform-node': TransformNode,
  'branch-node': BranchNode,
  'join-node': JoinNode,
  'markdown-node': MarkdownNode,
  'separator-node': SeparatorNode,
};

export const createNodeByType = ({
  type,
  id,
  position = { x: 0, y: 0 },
  data,
}: {
  type: AppNodeType;
  id?: string;
  position?: XYPosition;
  data?: WorkflowNodeData;
}): AppNode => {
  const node = nodesConfig[type];

  const newNode: AppNode = {
    id: id ?? nanoid(),
    data: data ?? {
      title: node.title,
      status: node.status,
      icon: node.icon,
      tooltip: node.tooltip,
    },
    position: {
      x: position.x - NODE_SIZE.width * 0.5,
      y: position.y - NODE_SIZE.height * 0.5,
    },
    type,

    // If you want to render nodes and edges on the server, you need to uncomment the following lines

    // width: NODE_SIZE.width,
    // height: NODE_SIZE.height,
    // handles: node.handles,
  };

  return newNode;
};

export type AppNode =
  | Node<WorkflowNodeData, 'initial-node'>
  | Node<WorkflowNodeData, 'transform-node'>
  | Node<WorkflowNodeData, 'join-node'>
  | Node<WorkflowNodeData, 'branch-node'>
  | Node<WorkflowNodeData, 'output-node'>
  | Node<WorkflowNodeData, 'markdown-node'>
  | Node<WorkflowNodeData, 'separator-node'>;

export type AppNodeType = NonNullable<AppNode['type']>;

'use client';

import React, { useState, useEffect } from 'react';
import {
  Background,
  ReactFlow,
  ConnectionLineType,
  ColorMode,
  SelectionMode,
} from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';
import { useTheme } from 'next-themes';
import { useSearchParams } from 'next/navigation';

import { nodeTypes } from '@/app/workflow/components/nodes';
import { WorkflowEdge } from '@/app/workflow/components/edges/workflow-edge';
import { useAppStore } from '@/app/workflow/store';
import { WorkflowControls } from './controls';
import FlowContextMenu from '@/app/workflow/components/flow-context-menu';
import { AppStore } from '@/app/workflow/store/app-store';
import { useDragAndDrop } from '@/app/workflow/hooks/useDragAndDrop';
import { FlowRunButton } from '@/app/workflow/components/flow-run-button';
import { fetchFlow as fetchFlowApi } from '@/app/workflow/utils/persist';
import { useReactFlow } from '@xyflow/react';

const edgeTypes = {
  workflow: WorkflowEdge,
};

const defaultEdgeOptions = { type: 'workflow' };

const selector = (state: AppStore) => ({
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
  onNodeDragStart: state.onNodeDragStart,
  onNodeDragStop: state.onNodeDragStop,
});

function WorkflowInner() {
  const store = useAppStore(useShallow(selector));
  const { onDragOver, onDrop } = useDragAndDrop();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const setNodes = useAppStore((s) => s.setNodes);
  const setEdges = useAppStore((s) => s.setEdges);
  const { fitView, getNodes: rfGetNodes, getEdges: rfGetEdges } = useReactFlow();
  
  // Expose React Flow's actual nodes/edges globally for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__RF_GET_NODES = rfGetNodes;
      (window as any).__RF_GET_EDGES = rfGetEdges;
    }
  }, [rfGetNodes, rfGetEdges]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-load a flow when `?flow=<id>` is present
  useEffect(() => {
    const id = searchParams.get('flow');
    if (!id) return;
    (async () => {
      try {
        const flow = await fetchFlowApi(id);
        if (!flow) return;
        setNodes(flow.nodes ?? []);
        setEdges(flow.edges ?? []);
        requestAnimationFrame(() => {
          try { fitView({ padding: 0.2, duration: 300 }); } catch {}
        });
      } catch {
        // no-op; page remains usable
      }
    })();
  }, [searchParams, setNodes, setEdges, fitView]);

  return (
    <ReactFlow
      nodes={store.nodes}
      edges={store.edges}
      onNodesChange={store.onNodesChange}
      onEdgesChange={store.onEdgesChange}
      onConnect={store.onConnect}
      connectionLineType={ConnectionLineType.SmoothStep}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onNodeDragStart={store.onNodeDragStart}
      onNodeDragStop={store.onNodeDragStop}
      colorMode={mounted ? (theme as ColorMode) : undefined}
      defaultEdgeOptions={defaultEdgeOptions}
      selectionMode={SelectionMode.Partial}
      selectionOnDrag={true}
      multiSelectionKeyCode="Shift"
      deleteKeyCode={['Delete', 'Backspace']}
      panOnDrag={[1, 2]}
      fitView
    >
      <Background />
      <WorkflowControls />
      <FlowContextMenu />
      <FlowRunButton />
    </ReactFlow>
  );
}

// Wrapper to ensure ReactFlow is inside its provider
export default function Workflow() {
  return <WorkflowInner />;
}

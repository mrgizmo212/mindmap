'use client';

import { useState, useRef, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useAppStore } from '@/app/workflow/store';
import { AppNode } from '@/app/workflow/components/nodes';
import { AppEdge } from '@/app/workflow/components/edges';
import { AppStore } from '@/app/workflow/store/app-store';

const selector = (state: AppStore) => ({
  getNodes: state.getNodes,
  setNodes: state.setNodes,
  getEdges: state.getEdges,
});

/**
 * This is a demo workflow runner that runs a simplified version of a workflow.
 * You can customize how nodes are processed by overriding `processNode` or
 * even replacing the entire `collectNodesToProcess` function with your own logic.
 */
export function useWorkflowRunner() {
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const isRunning = useRef(false);
  const { getNodes, setNodes, getEdges } = useAppStore(useShallow(selector));

  const stopWorkflow = useCallback(() => {
    isRunning.current = false;
    setLogMessages((prev) => [...prev, 'Workflow stopped.']);
  }, []);

  const resetNodeStatus = useCallback(() => {
    setNodes(
      getNodes().map((node) => ({
        ...node,
        data: { ...node.data, status: 'initial' },
      })),
    );
  }, [getNodes, setNodes]);

  const updateNodeStatus = useCallback(
    (nodeId: string, status: string) => {
      setNodes(
        getNodes().map((node) =>
          node.id === nodeId
            ? ({ ...node, data: { ...node.data, status } } as AppNode)
            : node,
        ),
      );
    },
    [setNodes, getNodes],
  );

  const processNode = useCallback(
    async (node: AppNode) => {
      updateNodeStatus(node.id, 'loading');
      setLogMessages((prev) => [...prev, `${node.data.title} processing...`]);

      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (!isRunning.current) {
        resetNodeStatus();
        return;
      }

      updateNodeStatus(node.id, 'success');
    },
    [updateNodeStatus, resetNodeStatus],
  );

  const exportMarkdown = useCallback(() => {
    const nodes = getNodes();
    const edges = getEdges();
    
    // Find the start node
    const startNode = nodes.find((node) => !edges.some((e) => e.target === node.id));
    if (!startNode) {
      alert('No starting node found in the workflow');
      return;
    }

    // Collect nodes in order
    const orderedNodes = collectNodesToProcess(nodes, edges, startNode.id);
    
    // Build markdown content
    let markdownContent = '';
    
    for (const node of orderedNodes) {
      if (node.type === 'markdown-node') {
        const title = node.data.title || 'Untitled';
        const content = node.data.content || '';
        
        // Add title as heading
        markdownContent += `# ${title}\n\n`;
        
        // Add content
        markdownContent += `${content}\n\n`;
      } else if (node.type === 'separator-node') {
        const separatorType = node.data.separatorType || 'line';
        
        switch (separatorType) {
          case 'line':
            markdownContent += '---\n\n';
            break;
          case 'space':
            markdownContent += '\n\n';
            break;
          case 'page-break':
            markdownContent += '\\pagebreak\n\n';
            break;
        }
      }
    }
    
    // Create and download the file
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workflow-export.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setLogMessages(['Markdown file exported successfully!']);
  }, [getNodes, getEdges]);

  const runWorkflow = useCallback(
    async (startNodeId?: string) => {
      if (isRunning.current) return;
      const nodes = getNodes();
      const edges = getEdges();
      
      // Check if we have markdown nodes - if yes, export markdown instead
      const hasMarkdownNodes = nodes.some(node => 
        node.type === 'markdown-node' || node.type === 'separator-node'
      );
      
      if (hasMarkdownNodes) {
        exportMarkdown();
        return;
      }
      
      isRunning.current = true;

      // for this demo, we'll start with the passed start node
      // or the first node that doesn't have any incoming edges
      const _startNodeId =
        startNodeId ||
        nodes.find((node) => !edges.some((e) => e.target === node.id))?.id;

      if (!_startNodeId) {
        return;
      }

      setLogMessages(['Starting workflow...']);

      const nodesToProcess = collectNodesToProcess(nodes, edges, _startNodeId);

      for (const node of nodesToProcess) {
        if (!isRunning.current) break;
        await processNode(node);
      }

      if (isRunning.current) {
        setLogMessages((prev) => [...prev, 'Workflow processing complete.']);
      }

      isRunning.current = false;
    },
    [getNodes, getEdges, processNode, exportMarkdown],
  );

  return {
    logMessages,
    runWorkflow,
    stopWorkflow,
    isRunning: isRunning.current,
  };
}

/**
 * This is a very simplified example of how you might traverse a graph and collect nodes to process.
 * It's not meant to be used in production, but you can use it as a starting point for your own logic.
 */
function collectNodesToProcess(
  nodes: AppNode[],
  edges: AppEdge[],
  startNodeId: string,
) {
  const nodesToProcess: AppNode[] = [];
  const visited = new Set();

  function visit(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    nodesToProcess.push(node);

    const outgoingEdges = edges.filter((e) => e.source === nodeId);
    for (const edge of outgoingEdges) {
      visit(edge.target);
    }
  }

  visit(startNodeId);

  return nodesToProcess;
}

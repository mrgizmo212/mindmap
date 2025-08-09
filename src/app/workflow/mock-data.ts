import { AppEdge, createEdge } from './components/edges';
import { AppNode, createNodeByType } from './components/nodes';
import { layoutGraph } from './utils/layout-helper';

// Commented out demo nodes - starting with blank canvas
// const initialNodes: AppNode[] = [
//   createNodeByType({ type: 'initial-node', id: 'workflowNode_1' }),
//   createNodeByType({ type: 'branch-node', id: 'workflowNode_2' }),
//   createNodeByType({ type: 'transform-node', id: 'workflowNode_3' }),
//   createNodeByType({ type: 'output-node', id: 'workflowNode_4' }),
//   createNodeByType({ type: 'output-node', id: 'workflowNode_5' }),
// ];

// const initialEdges: AppEdge[] = [
//   createEdge('workflowNode_1', 'workflowNode_2'),
//   createEdge('workflowNode_2', 'workflowNode_3', 'true'),
//   createEdge('workflowNode_3', 'workflowNode_4'),
//   createEdge('workflowNode_2', 'workflowNode_5', 'false'),
// ];

// Start with blank canvas
const initialNodes: AppNode[] = [];
const initialEdges: AppEdge[] = [];

export async function loadData() {
  // If there are nodes, layout them, otherwise return empty arrays
  if (initialNodes.length > 0) {
    const layoutedNodes = await layoutGraph(initialNodes, initialEdges);
    return {
      nodes: layoutedNodes,
      edges: initialEdges,
    };
  }
  
  return {
    nodes: initialNodes,
    edges: initialEdges,
  };
}

import { Panel, useReactFlow, useStore } from '@xyflow/react';
import { Route, Save, Download, List } from 'lucide-react';
import { FlowsModal } from './flows-modal';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useLayout } from '@/app/workflow/hooks/use-layout';
import { ZoomSlider } from '../../../components/zoom-slider';
import { useAppStore } from '@/app/workflow/store';
import type { AppStore } from '@/app/workflow/store/app-store';
import { saveFlow as saveFlowApi, listFlows as listFlowsApi, fetchFlow as fetchFlowApi } from '@/app/workflow/utils/persist';

export function WorkflowControls() {
  const runLayout = useLayout();
  const { fitView, getNodes: getRFNodes, getEdges: getRFEdges } = useReactFlow();
  const [showFlows, setShowFlows] = useState(false);
  const getNodes = useAppStore((s: AppStore) => s.getNodes);
  const getEdges = useAppStore((s: AppStore) => s.getEdges);
  const setNodes = useAppStore((s: AppStore) => s.setNodes);
  const setEdges = useAppStore((s: AppStore) => s.setEdges);
  
  // Debug: Expose store globally
  if (typeof window !== 'undefined') {
    const globalWindow = window as Window & {
      __DEBUG_GET_NODES?: typeof getNodes;
      __DEBUG_GET_EDGES?: typeof getEdges;
    };
    globalWindow.__DEBUG_GET_NODES = getNodes;
    globalWindow.__DEBUG_GET_EDGES = getEdges;
  }

  async function onSave(): Promise<void> {
    try {
      const name = typeof window !== 'undefined' ? window.prompt('Flow name? (must be unique)') : undefined;
      if (!name || name.trim().length === 0) return;
      const description = typeof window !== 'undefined' ? window.prompt('Description (optional)') || undefined : undefined;
      // Ensure any active editor (e.g., markdown textarea) commits its value via onBlur
      if (typeof window !== 'undefined') {
        const active = document.activeElement as HTMLElement | null;
        if (active) active.blur();
        // Wait a frame so store updates propagate
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      }
      
      // Get nodes/edges from React Flow instance
      const rfNodes = getRFNodes ? getRFNodes() : [];
      const rfEdges = getRFEdges ? getRFEdges() : [];
      
      // Debug what we have
      console.log('DEBUG: rfNodes from React Flow:', rfNodes);
      console.log('DEBUG: rfEdges from React Flow:', rfEdges);
      console.log('DEBUG: getNodes() from Zustand:', getNodes());
      
      // Use React Flow nodes if available, otherwise Zustand
      let nodes = [];
      let edges = [];
      
      if (rfNodes.length > 0) {
        nodes = rfNodes.map((n: any) => ({
          id: n.id,
          type: n.type,
          position: n.position,
          data: n.data
        }));
      } else {
        const zustandNodes = getNodes();
        nodes = zustandNodes.map((n: any) => ({
          id: n.id,
          type: n.type,
          position: n.position,
          data: n.data
        }));
      }
      
      if (rfEdges.length > 0) {
        edges = rfEdges.map((e: any) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle,
          type: e.type
        }));
      }
      
      console.log('DEBUG: Final nodes to save:', nodes, 'edges:', edges);
      await saveFlowApi(name.trim(), description, nodes, edges);
      if (typeof window !== 'undefined') window.alert('Flow saved');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      if (typeof window !== 'undefined') window.alert(`Save failed: ${message}`);
    }
  }

  async function onLoadLatest(): Promise<void> {
    try {
      const flows = await listFlowsApi();
      if (!Array.isArray(flows) || flows.length === 0) {
        if (typeof window !== 'undefined') window.alert('No saved flows');
        return;
      }
      const latest = flows[0];
      const flow = await fetchFlowApi(latest.id);
      if (!flow) {
        if (typeof window !== 'undefined') window.alert('Flow not found');
        return;
      }
      setNodes(flow.nodes ?? []);
      setEdges(flow.edges ?? []);
      // Ensure loaded nodes are brought into view
      requestAnimationFrame(() => {
        try {
          fitView({ padding: 0.2, duration: 300 });
        } catch {}
      });
      if (typeof window !== 'undefined') window.alert(`Loaded: ${flow.name}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      if (typeof window !== 'undefined') window.alert(`Load failed: ${message}`);
    }
  }

  return (
    <>
      <ZoomSlider position="bottom-left" className="bg-card" />
      <Panel
        position="bottom-right"
        className="bg-card text-foreground rounded-md"
      >
        <Button onClick={onSave} variant="ghost" title="Save flow">
          <Save />
        </Button>
        <Button onClick={onLoadLatest} variant="ghost" title="Load latest flow">
          <Download />
        </Button>
        <button onClick={() => setShowFlows(true)} className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent" title="View saved flows" type="button">
          <List />
        </button>
        <Button onClick={runLayout} variant="ghost">
          <Route />
        </Button>
        <button 
          onClick={() => {
            const rfNodes = getRFNodes ? getRFNodes() : [];
            console.log('Zustand nodes:', getNodes());
            console.log('React Flow nodes:', rfNodes);
            alert(`Zustand: ${getNodes().length} nodes\nReact Flow: ${rfNodes.length} nodes`);
          }}
          className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent"
          title="Debug stores"
          type="button"
        >
          ?
        </button>
      </Panel>
      <FlowsModal open={showFlows} onOpenChange={setShowFlows} />
    </>
  );
}

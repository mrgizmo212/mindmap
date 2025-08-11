'use client';

import { useEffect, useState, useTransition } from 'react';
import { useAppStore } from '@/app/workflow/store';
import { useReactFlow } from '@xyflow/react';
import { fetchFlow as fetchFlowApi } from '@/app/workflow/utils/persist';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

type Flow = {
  id: string;
  name: string;
  description?: string;
  nodes: unknown[];
  edges: unknown[];
  updated_at?: string;
};

export function FlowsModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [isPending, startTransition] = useTransition();
  const setNodes = useAppStore((s) => s.setNodes);
  const setEdges = useAppStore((s) => s.setEdges);
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const res = await fetch('/api/flows', { cache: 'no-store' });
        const data = (await res.json()) as { flows?: Flow[] };
        setFlows(Array.isArray(data.flows) ? data.flows : []);
      } catch {
        setFlows([]);
      }
    })();
  }, [open]);

  async function onLoad(id: string) {
    try {
      const flow = await fetchFlowApi(id);
      if (!flow) return;
      setNodes((flow as any).nodes ?? []);
      setEdges((flow as any).edges ?? []);
      requestAnimationFrame(() => {
        try {
          fitView({ padding: 0.2, duration: 300 });
        } catch {}
      });
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      alert(`Load failed: ${msg}`);
    }
  }

  async function onDelete(id: string) {
    try {
      const res = await fetch(`/api/flows/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) {
        const text = await res.text();
        alert(`Delete failed: ${text}`);
        return;
      }
      startTransition(() => {
        setFlows((prev) => prev.filter((f) => f.id !== id));
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      alert(`Delete failed: ${msg}`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Saved Flows</DialogTitle>
          <DialogDescription>Select a flow to load it into the editor.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {flows.length === 0 ? (
            <div className="text-sm text-gray-500">No flows saved yet.</div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-800 border rounded-md">
              {flows.map((f) => (
                <li key={f.id} className="p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{f.name}</div>
                    {f.description ? (
                      <div className="text-xs text-gray-500 truncate">{f.description}</div>
                    ) : null}
                    <div className="text-[11px] text-gray-400">{(f.updated_at ?? '').toString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onLoad(f.id)}
                      className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
                      disabled={isPending}
                      type="button"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => onDelete(f.id)}
                      className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700"
                      disabled={isPending}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}



'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';

type Flow = {
  id: string;
  name: string;
  description?: string;
  nodes: unknown[];
  edges: unknown[];
  updated_at?: string;
};

export default function FlowListClient({ initialFlows }: { initialFlows: Flow[] }) {
  const [flows, setFlows] = useState<Flow[]>(initialFlows);
  const [isPending, startTransition] = useTransition();

  async function refresh() {
    const res = await fetch('/api/flows', { cache: 'no-store' });
    const data = await res.json();
    setFlows(data.flows ?? []);
  }

  async function deleteFlow(id: string) {
    const res = await fetch(`/api/flows/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) {
      const text = await res.text();
      alert(`Delete failed: ${text}`);
      return;
    }
    startTransition(() => refresh());
  }

  return (
    <div className="space-y-3">
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
                <Link
                  href={`/workflow?flow=${encodeURIComponent(f.id)}`}
                  className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  Load
                </Link>
                <button
                  onClick={() => deleteFlow(f.id)}
                  className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700"
                  disabled={isPending}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}



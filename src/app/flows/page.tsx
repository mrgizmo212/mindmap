// Server component page

import Link from 'next/link';
import { listFlows } from '@/lib/surreal';
import FlowListClient from './FlowListClient';

export const dynamic = 'force-dynamic' as const;

export type FlowRecord = {
  id: string;
  name: string;
  description?: string;
  nodes: unknown[];
  edges: unknown[];
  created_at?: string;
  updated_at?: string;
};

export default async function Page() {
  const flows = (await listFlows()) as FlowRecord[];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Saved Flows</h1>
        <Link href="/workflow" className="text-blue-600 hover:underline">Back to Editor</Link>
      </div>
      <FlowListClient initialFlows={flows} />
    </div>
  );
}



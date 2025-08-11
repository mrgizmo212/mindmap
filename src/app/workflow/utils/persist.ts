export async function saveFlow(name: string, description: string | undefined, nodes: any[], edges: any[]) {
  const res = await fetch("/api/flows", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description, nodes, edges }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.flow;
}

export async function listFlows() {
  const res = await fetch("/api/flows", { method: "GET" });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return (data.flows ?? []) as any[];
}

export async function fetchFlow(id: string) {
  const res = await fetch(`/api/flows/${encodeURIComponent(id)}`, { method: "GET" });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.flow;
}

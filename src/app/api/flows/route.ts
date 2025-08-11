import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const flows = await prisma.flow.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ flows });
  } catch (err: any) {
    console.error("Failed to list flows:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, nodes, edges } = body ?? {};

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const flow = await prisma.flow.create({
      data: {
        name,
        description,
        nodes: nodes || [],
        edges: edges || []
      }
    });

    return NextResponse.json({ flow });
  } catch (err: any) {
    console.error("Failed to create flow:", err);
    if (err.code === 'P2002') {
      return NextResponse.json({ error: "A flow with this name already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
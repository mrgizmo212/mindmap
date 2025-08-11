import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const flow = await prisma.flow.findUnique({
      where: { id }
    });
    
    if (!flow) {
      return NextResponse.json({ error: "Flow not found" }, { status: 404 });
    }
    
    return NextResponse.json({ flow });
  } catch (err: any) {
    console.error("Failed to get flow:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { name, description, nodes, edges } = body ?? {};

    const flow = await prisma.flow.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(nodes !== undefined && { nodes }),
        ...(edges !== undefined && { edges })
      }
    });

    return NextResponse.json({ flow });
  } catch (err: any) {
    console.error("Failed to update flow:", err);
    if (err.code === 'P2025') {
      return NextResponse.json({ error: "Flow not found" }, { status: 404 });
    }
    if (err.code === 'P2002') {
      return NextResponse.json({ error: "A flow with this name already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await prisma.flow.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Failed to delete flow:", err);
    if (err.code === 'P2025') {
      return NextResponse.json({ error: "Flow not found" }, { status: 404 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
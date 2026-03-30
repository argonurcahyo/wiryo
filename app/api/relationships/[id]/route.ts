import { NextRequest } from "next/server";
import { createRelationship, deleteRelationship } from "@/lib/relationships";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  try {
    const body = await request.json();
    if (!body.memberAId || !body.memberBId) {
      return Response.json({ error: "memberAId dan memberBId wajib diisi." }, { status: 400 });
    }

    const relationship = await createRelationship({
      memberAId: body.memberAId,
      memberBId: body.memberBId,
      status: body.status === "former" ? "former" : "current",
    });

    if (relationship.id !== id) {
      return Response.json({ relationship });
    }

    return Response.json({ relationship });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  try {
    const deleted = await deleteRelationship(id);
    if (!deleted) {
      return Response.json({ error: "Relationship not found." }, { status: 404 });
    }
    return Response.json({ success: true });
  } catch (err) {
    console.error(`[DELETE /api/relationships/${id}]`, err);
    return Response.json({ error: "Failed to delete relationship." }, { status: 500 });
  }
}

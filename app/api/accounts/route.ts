import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const accounts = await prisma.account.findMany({ orderBy: { connectedAt: "desc" } });
    return NextResponse.json(accounts);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const platformId = typeof body.platformId === "string" ? body.platformId : "";
    const handle = typeof body.handle === "string" ? body.handle : "";
    const displayName = typeof body.displayName === "string" ? body.displayName : handle;

    if (!platformId || !handle) {
      return NextResponse.json(
        { error: "platformId and handle are required" },
        { status: 400 }
      );
    }

    const account = await prisma.account.upsert({
      where: { platformId_handle: { platformId, handle } },
      update: { displayName, status: "active" },
      create: { platformId, handle, displayName, status: "active" },
    });

    return NextResponse.json(account, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create account" },
      { status: 500 }
    );
  }
}

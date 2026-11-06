import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import type { ArkivJobEntity } from "@/lib/arkiv";

const DATA_FILE = path.join(process.cwd(), "src", "data", "arkiv-entities.json");

async function readEntities(): Promise<ArkivJobEntity[]> {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeEntities(entities: ArkivJobEntity[]): Promise<void> {
  const dir = path.dirname(DATA_FILE);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(entities, null, 2), "utf-8");
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    const all = await readEntities();
    const now = Date.now();

    // Filter unexpired active entities
    const active = all.filter((e) => {
      const expiresAt = Number(e.expiresAt || 0);
      return !expiresAt || expiresAt > now;
    });

    if (key) {
      const found = active.find((e) => e.key.toLowerCase() === key.toLowerCase());
      if (!found) {
        return NextResponse.json({ error: "Entity not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, entity: found });
    }

    return NextResponse.json({ success: true, entities: active });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to read entities" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || !body.key || !body.title) {
      return NextResponse.json({ error: "Invalid entity data" }, { status: 400 });
    }

    const all = await readEntities();
    const updated = [body, ...all.filter((e) => e.key !== body.key)];
    await writeEntities(updated);

    return NextResponse.json({ success: true, entity: body });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to save entity" }, { status: 500 });
  }
}


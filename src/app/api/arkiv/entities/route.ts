import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import os from "os";
import type { ArkivJobEntity } from "@/lib/arkiv";
import seedData from "@/data/arkiv-entities.json";

// Vercel serverless has a writable /tmp directory
const TMP_DATA_FILE = path.join(os.tmpdir(), "arkiv-entities.json");
const LOCAL_DATA_FILE = path.join(process.cwd(), "src", "data", "arkiv-entities.json");

// In-memory cache across serverless warm invocations
let inMemoryEntities: ArkivJobEntity[] = Array.isArray(seedData) ? (seedData as ArkivJobEntity[]) : [];

export async function readEntities(): Promise<ArkivJobEntity[]> {
  const mergedMap = new Map<string, ArkivJobEntity>();

  // 1. Base seed data (bundled directly in JS bundle)
  for (const item of inMemoryEntities) {
    if (item?.key) mergedMap.set(item.key.toLowerCase(), item);
  }

  // 2. Read from /tmp if available on Vercel
  try {
    const tmpContent = await fs.readFile(TMP_DATA_FILE, "utf-8");
    const tmpParsed = JSON.parse(tmpContent);
    if (Array.isArray(tmpParsed)) {
      for (const item of tmpParsed) {
        if (item?.key) mergedMap.set(item.key.toLowerCase(), item);
      }
    }
  } catch {
    // /tmp file not created yet or unreadable
  }

  // 3. Read from local src/data if accessible
  try {
    const localContent = await fs.readFile(LOCAL_DATA_FILE, "utf-8");
    const localParsed = JSON.parse(localContent);
    if (Array.isArray(localParsed)) {
      for (const item of localParsed) {
        if (item?.key) mergedMap.set(item.key.toLowerCase(), item);
      }
    }
  } catch {
    // Read-only filesystem or file missing in serverless
  }

  return Array.from(mergedMap.values());
}

export async function writeEntities(entities: ArkivJobEntity[]): Promise<void> {
  inMemoryEntities = entities;

  // Try writing to /tmp
  try {
    await fs.writeFile(TMP_DATA_FILE, JSON.stringify(entities, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not write entities to /tmp:", err);
  }

  // Try writing to src/data (local development)
  try {
    await fs.writeFile(LOCAL_DATA_FILE, JSON.stringify(entities, null, 2), "utf-8");
  } catch {
    // Ignored in read-only environment like Vercel
  }
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
    const updated = [body, ...all.filter((e) => e.key.toLowerCase() !== body.key.toLowerCase())];
    await writeEntities(updated);

    return NextResponse.json({ success: true, entity: body });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to save entity" }, { status: 500 });
  }
}

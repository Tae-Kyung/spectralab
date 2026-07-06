import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const datasetId = searchParams.get('dataset_id') || undefined;
    const tracks = await db.getPeakTracks(datasetId);
    return NextResponse.json({ data: tracks });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const track = await db.createPeakTrack(body);
    return NextResponse.json({ data: track });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const datasetId = searchParams.get('dataset_id');
    if (!datasetId) return NextResponse.json({ error: 'Missing dataset_id' }, { status: 400 });
    const count = await db.deletePeakTracksByDataset(datasetId);
    return NextResponse.json({ data: { deleted: count } });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

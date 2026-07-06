import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const datasets = await db.getDatasets();
    return NextResponse.json({ data: datasets });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const dataset = await db.createDataset(body);
    return NextResponse.json({ data: dataset });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const ok = await db.deleteDataset(id);
    return NextResponse.json({ data: ok });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

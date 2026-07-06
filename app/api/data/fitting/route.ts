import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const spectrumId = searchParams.get('spectrum_id') || undefined;
    const datasetId = searchParams.get('dataset_id');

    if (datasetId) {
      const results = await db.getFittingResultsByDataset(datasetId);
      return NextResponse.json({ data: results });
    }

    const results = await db.getFittingResults(spectrumId);
    return NextResponse.json({ data: results });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (Array.isArray(body.results)) {
      const results = await db.createManyFittingResults(body.results);
      return NextResponse.json({ data: results });
    }
    const result = await db.createFittingResult(body);
    return NextResponse.json({ data: result });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const datasetId = searchParams.get('dataset_id');
    if (!datasetId) return NextResponse.json({ error: 'Missing dataset_id' }, { status: 400 });
    const count = await db.deleteFittingResultsByDataset(datasetId);
    return NextResponse.json({ data: { deleted: count } });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

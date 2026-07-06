import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const datasetId = searchParams.get('dataset_id') || undefined;
    const spectra = await db.getSpectra(datasetId);
    return NextResponse.json({ data: spectra });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const spectra = await db.createManySpectra(body.spectra);
    return NextResponse.json({ data: spectra });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

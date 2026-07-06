import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    const list = await db.getExternalDataList();
    return NextResponse.json({ data: list });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const name = (formData.get('name') as string) || file.name;

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const ws = workbook.Sheets[workbook.SheetNames[0]];
      const rows: number[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: 0 });

      // Assume first row may be headers
      let startRow = 0;
      if (rows.length > 0 && typeof rows[0][0] === 'string') {
        startRow = 1;
      }

      const xData: number[] = [];
      const yData: number[] = [];
      for (let i = startRow; i < rows.length; i++) {
        const x = Number(rows[i][0]);
        const y = Number(rows[i][1]);
        if (!isNaN(x) && !isNaN(y)) {
          xData.push(x);
          yData.push(y);
        }
      }

      const result = await db.createExternalData({
        name,
        x_label: null,
        y_label: null,
        x_data: xData,
        y_data: yData,
      });
      return NextResponse.json({ data: result });
    }

    const body = await req.json();
    const result = await db.createExternalData(body);
    return NextResponse.json({ data: result });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const ok = await db.deleteExternalData(id);
    return NextResponse.json({ data: ok });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'Terminal premium telah dihentikan. Gunakan dashboard.' }, { status: 410 });
}

import { NextResponse } from 'next/server';

// Marking this endpoint explicitly as dynamic to avoid static caching in builds if necessary, 
// though for a simple JSON return it is fine.
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}

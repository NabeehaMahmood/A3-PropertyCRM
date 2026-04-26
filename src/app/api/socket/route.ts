import { NextRequest, NextResponse } from 'next/server';
import { initSocket, emitLeadCreated } from '@/lib/socket';
import { Server as NetServer } from 'http';

let ioInitialized = false;

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const params = request.headers.get('x-forwarded-host') || url.host;

  if (!ioInitialized) {
    const httpServer = new NetServer();
    initSocket(httpServer);
    ioInitialized = true;
  }

  return NextResponse.json({ message: 'Socket.io endpoint ready' });
}
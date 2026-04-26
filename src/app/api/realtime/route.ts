import { NextRequest, NextResponse } from 'next/server';

const channels = new Map<string, ReadableStream<Uint8Array>>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get('leadId') || 'global';

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      channels.set(leadId, stream);
      
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: keep-alive\n\n`));
        } catch {
          clearInterval(keepAlive);
          channels.delete(leadId);
        }
      }, 15000);
    },
    cancel() {
      channels.delete(leadId);
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

export function publishUpdate(leadId: string, data: unknown) {
  const channel = channels.get(leadId);
  if (channel) {
    const encoder = new TextEncoder();
    const message = `data: ${JSON.stringify(data)}\n\n`;
  }
}
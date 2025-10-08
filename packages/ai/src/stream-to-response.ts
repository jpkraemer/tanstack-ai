import type { StreamChunk } from "./types";

/**
 * Convert a StreamChunk async iterable to a ReadableStream
 * for use in HTTP responses (Server-Sent Events format)
 */
export function toReadableStream(
  stream: AsyncIterable<StreamChunk>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          // Send each chunk as Server-Sent Events format
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
          );
        }

        // Send completion marker
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error: any) {
        // Send error chunk
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "error",
              error: {
                message: error.message || "Unknown error occurred",
                code: error.code,
              },
            })}\n\n`
          )
        );
        controller.close();
      }
    },
  });
}

/**
 * Create a streaming HTTP response from a StreamChunk async iterable
 * Includes proper headers for Server-Sent Events
 */
export function toStreamResponse(
  stream: AsyncIterable<StreamChunk>,
  init?: ResponseInit
): Response {
  return new Response(toReadableStream(stream), {
    ...init,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      ...(init?.headers || {}),
    },
  });
}

import type { Request, Response } from "express";

export type ChatEventType =
  | "message_created"
  | "message_read"
  | "chat_assigned"
  | "presence_updated"
  | "typing_updated";

export type ChatEventPayload = Record<string, unknown>;

export type ChatRealtimeEvent = {
  id: string;
  type: ChatEventType;
  payload: ChatEventPayload;
  timestamp: string;
};

type SseClient = {
  id: string;
  response: Response;
};

const clients = new Map<string, SseClient>();
let eventSequence = 0;

function buildEventId() {
  eventSequence += 1;
  return `${Date.now()}-${eventSequence}`;
}

function writeSse(response: Response, eventName: string, payload: unknown) {
  response.write(`event: ${eventName}\n`);
  response.write(`data: ${JSON.stringify(payload)}\n\n`);
}

export function publishChatEvent(type: ChatEventType, payload: ChatEventPayload = {}) {
  const event: ChatRealtimeEvent = {
    id: buildEventId(),
    type,
    payload,
    timestamp: new Date().toISOString(),
  };

  for (const client of clients.values()) {
    writeSse(client.response, type, event);
  }
}

export function streamChatEvents(req: Request, res: Response) {
  const clientId = buildEventId();

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders?.();

  const client: SseClient = { id: clientId, response: res };
  clients.set(clientId, client);

  writeSse(res, "connected", {
    id: clientId,
    timestamp: new Date().toISOString(),
  });

  const heartbeat = setInterval(() => {
    writeSse(res, "heartbeat", {
      id: buildEventId(),
      timestamp: new Date().toISOString(),
    });
  }, 25_000);

  req.on("close", () => {
    clearInterval(heartbeat);
    clients.delete(clientId);
  });
}

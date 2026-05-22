const clientsByUserId = new Map();

const toUserKey = (userId) => String(userId);

const writeSseEvent = (res, eventType, payload) => {
  res.write(`event: ${eventType}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
};

export const addNotificationClient = (userId, res) => {
  const userKey = toUserKey(userId);
  const clients = clientsByUserId.get(userKey) || new Set();
  clients.add(res);
  clientsByUserId.set(userKey, clients);
};

export const removeNotificationClient = (userId, res) => {
  const userKey = toUserKey(userId);
  const clients = clientsByUserId.get(userKey);

  if (!clients) {
    return;
  }

  clients.delete(res);
  if (clients.size === 0) {
    clientsByUserId.delete(userKey);
  }
};

export const broadcast = (userId, eventType, payload = {}) => {
  const clients = clientsByUserId.get(toUserKey(userId));

  if (!clients || clients.size === 0) {
    return 0;
  }

  let sent = 0;
  for (const res of clients) {
    try {
      writeSseEvent(res, eventType, {
        ...payload,
        eventType,
        createdAt: payload.createdAt || new Date().toISOString(),
      });
      sent += 1;
    } catch {
      clients.delete(res);
    }
  }

  return sent;
};

export const broadcastAll = (eventType, payload = {}) => {
  let sent = 0;

  for (const userId of clientsByUserId.keys()) {
    sent += broadcast(userId, eventType, payload);
  }

  return sent;
};

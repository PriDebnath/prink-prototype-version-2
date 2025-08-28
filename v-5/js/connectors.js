function createConnector(aId, bId) {
  if (!aId || !bId || aId === bId) return null;
  const exists = connectors.some(c => (c.aId === aId && c.bId === bId) || (c.aId === bId && c.bId === aId));
  if (exists) return null;
  const conn = { id: connectorIdCounter++, aId, bId };
  connectors.push(conn);
  pushHistory();
  draw();
  return conn;
}

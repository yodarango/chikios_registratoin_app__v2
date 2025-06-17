export function createResponse(res, { error, data, success }) {
  res.status(200).json({ error, data, success });
}

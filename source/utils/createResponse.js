export function createResponse(res, { error, data }) {
  res.status(200).json({ error, data });
}

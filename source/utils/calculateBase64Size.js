export function calculateBase64SizeInMB(base64String) {
  // Remove header (e.g., "data:image/png;base64,") if present
  const base64WithoutHeader = base64String.split(",")[1] || base64String;

  // Calculate the length of the base64 string
  const base64Length = base64WithoutHeader.length;

  // Approximate the size of the original data in bytes
  const byteLength =
    (base64Length * 3) / 4 -
    (base64WithoutHeader.endsWith("==")
      ? 2
      : base64WithoutHeader.endsWith("=")
      ? 1
      : 0);

  // Convert bytes to megabytes
  const sizeInMB = byteLength / 1048576;

  return sizeInMB;
}

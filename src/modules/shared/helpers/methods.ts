export function extractTokenFromHeader(authorization: string) {
  if (!authorization) return;
  return authorization.slice(7);
}

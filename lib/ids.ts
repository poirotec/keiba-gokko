export function nowIso() {
  return new Date().toISOString();
}

export function randomId(prefix = "id") {
  // 企画用の簡易ID
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

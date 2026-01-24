export function normalizeOptionName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

export function normalizeOptionValue(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function canonicalizeOptions(options: Record<string, string> | undefined | null) {
  const out: Record<string, string> = {};
  if (!options) return out;
  const entries = Object.entries(options)
    .map(([k, v]) => [normalizeOptionName(k), normalizeOptionValue(v)] as const)
    .filter(([k, v]) => k.length > 0 && v.length > 0)
    .sort(([a], [b]) => a.localeCompare(b));
  for (const [k, v] of entries) out[k] = v;
  return out;
}

export function optionsKey(options: Record<string, string> | undefined | null) {
  return JSON.stringify(canonicalizeOptions(options));
}

export function formatOptions(options: Record<string, string> | undefined | null) {
  const normalized = canonicalizeOptions(options);
  const entries = Object.entries(normalized);
  if (!entries.length) return "Default";
  return entries.map(([k, v]) => `${k}: ${v}`).join(" · ");
}

export function pickFirstTwoOptions(options: Record<string, string> | undefined | null) {
  const normalized = canonicalizeOptions(options);
  const entries = Object.entries(normalized);
  return {
    first: entries[0]?.[1] ?? "Default",
    second: entries[1]?.[1] ?? "Default"
  };
}

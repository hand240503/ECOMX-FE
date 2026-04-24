/** Serialized to `order.description` / `orderDetails[].description` — see docs/API_add_order.md */
export type OrderDescriptionPayload = {
  unit: string;
  message: string;
  note: string;
};

export function stringifyOrderDescription(payload: OrderDescriptionPayload): string {
  return JSON.stringify({
    unit: payload.unit,
    message: payload.message,
    note: payload.note,
  });
}

/** Parse an `order.description` / line `description` JSON string; `null` nếu không phải JSON hợp lệ. */
export function parseOrderDescriptionJson(raw: string | null | undefined): OrderDescriptionPayload | null {
  if (raw == null || String(raw).trim() === '') return null;
  try {
    const o = JSON.parse(String(raw)) as unknown;
    if (!o || typeof o !== 'object') return null;
    const rec = o as Record<string, unknown>;
    return {
      unit: typeof rec.unit === 'string' ? rec.unit : '',
      message: typeof rec.message === 'string' ? rec.message : '',
      note: typeof rec.note === 'string' ? rec.note : '',
    };
  } catch {
    return null;
  }
}

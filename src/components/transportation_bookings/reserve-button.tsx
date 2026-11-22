type HoldsValue =
  | Record<string, boolean | string | null | undefined>
  | (string | null)[]
  | string
  | null
  | undefined;

interface ReserveButtonProps {
  containerStatus?: string | null;
  holds?: HoldsValue;
  onClick: () => void;
}

function normalizeHolds(holds?: HoldsValue): string[] {
  if (!holds) return [];

  // Handle AWSJSON if it arrives as a serialized JSON string
  let parsed: unknown = holds;
  if (typeof holds === "string") {
    const trimmed = holds.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        return trimmed
          .split(",")
          .map((h) => h.trim())
          .filter(Boolean);
      }
    } else {
      return trimmed
        .split(",")
        .map((h) => h.trim())
        .filter(Boolean);
    }
  }

  if (Array.isArray(parsed)) {
    return Array.from(
      new Set(
        parsed
          .filter((h): h is string => typeof h === "string")
          .map((h) => h.trim())
          .filter(Boolean),
      ),
    );
  }

  if (typeof parsed === "object" && parsed !== null) {
    return Object.entries(parsed as Record<string, unknown>)
      .filter(([, value]) => {
        if (typeof value === "boolean") return value;
        if (typeof value === "string") {
          const v = value.trim().toLowerCase();
          return v !== "" && v !== "false" && v !== "cleared" && v !== "none";
        }
        return Boolean(value);
      })
      .map(([key]) => key.trim())
      .filter(Boolean);
  }

  return [];
}
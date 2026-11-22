import { Button } from "../ui/button.tsx";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

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

export function ReserveButton({
  containerStatus,
  holds,
  onClick,
}: ReserveButtonProps) {
  const status = containerStatus?.trim().toLowerCase() ?? "";
  const activeHolds = normalizeHolds(holds);
  const reasons: string[] = [];

  if (status === "on-ship" || status === "on ship") {
    reasons.push("Cargo unit is still on ship.");
  } else if (status === "discharged") {
    reasons.push("Cargo unit is not yet released.");
  }

  if (activeHolds.length > 0) {
    const label = activeHolds.length === 1 ? "Hold" : "Holds";
    reasons.push(`${label}: ${activeHolds.join(", ")}.`);
  }

  const isDisabled = reasons.length > 0;

  if (!isDisabled) {
    return (
      <Button variant="outline" onClick={onClick}>
        Reserve
      </Button>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <span className="inline-block cursor-not-allowed" tabIndex={0}>
            <Button
              type="button"
              variant="outline"
              disabled
              className="pointer-events-none bg-gray-100 text-gray-400"
            >
              Reserve
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-[240px] text-left text-xs">
          <p className="font-medium">Cannot reserve:</p>
          {reasons.map((reason) => (
            <p key={reason}>{reason}</p>
          ))}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
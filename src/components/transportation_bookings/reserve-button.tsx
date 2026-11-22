import { Button } from "../ui/button.tsx";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface ReserveButtonProps {
  containerStatus?: string | null;
  holds?: (string | null)[] | string | null;
  onClick: () => void;
}

function normalizeHolds(
  holds?: (string | null)[] | string | null,
): string[] {
  if (!holds) return [];
  const list = Array.isArray(holds) ? holds : holds.split(",");
  return Array.from(
    new Set(
      list
        .filter((h): h is string => typeof h === "string")
        .map((h) => h.trim())
        .filter(Boolean),
    ),
  );
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
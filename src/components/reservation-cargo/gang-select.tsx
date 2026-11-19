import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "../ui/select";
import { GangOption } from "./reservation-manager-client";

type GangSelectProps = {
  gangs: GangOption[];
  equipmentType: string;
  equipmentLabel: string;
  value: string | undefined;
  onChange: (gangId: string) => void;
};

// One gang per move. Gangs qualified for the move's equipment are listed first, then the others.
export function GangSelect({ gangs, equipmentType, equipmentLabel, value, onChange }: GangSelectProps) {
  const qualified = gangs.filter((g) => g.equipmentTypes.includes(equipmentType));
  const others = gangs.filter((g) => !g.equipmentTypes.includes(equipmentType));
  const selected = gangs.find((g) => g.gangId === value);

  return (
    <Select value={value} onValueChange={onChange} disabled={gangs.length === 0}>
      <SelectTrigger className="w-[260px]">
        <SelectValue placeholder={gangs.length === 0 ? "No gangs set up for this terminal" : "Select gang"}>
          {selected?.name}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {qualified.length > 0 && (
          <SelectGroup>
            <SelectLabel>Qualified for {equipmentLabel}</SelectLabel>
            {qualified.map((g) => (
              <SelectItem key={g.gangId} value={g.gangId}>
                {g.name}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
        {others.length > 0 && (
          <SelectGroup>
            <SelectLabel>Other gangs</SelectLabel>
            {others.map((g) => (
              <SelectItem key={g.gangId} value={g.gangId}>
                {g.name}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  );
}


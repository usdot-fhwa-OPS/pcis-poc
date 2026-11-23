import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

type TwicQuestionProps = {
  value: boolean | undefined;
  onChange: (value: boolean) => void;
  idPrefix: string;
};

// "Is a TWIC escort required?" Yes/No, with no default so the TO has to answer.
export function TwicQuestion({ value, onChange, idPrefix }: TwicQuestionProps) {
  return (
    <div>
      <p className="text-sm font-semibold mb-3">
        Is a{" "}
        <abbr className="decoration-[1px] decoration-dotted underline-offset-4" title="Transportation Worker Identification Credential">
          TWIC
        </abbr>{" "}
        escort required for this reservation?
      </p>
      <RadioGroup
        value={value === undefined ? undefined : String(value)}
        onValueChange={(v) => onChange(v === "true")}
        className="grid-cols-2 grid-rows-1 gap-6 w-fit"
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem value="true" id={`${idPrefix}-twic-yes`} />
          <Label className="text-sm font-normal" htmlFor={`${idPrefix}-twic-yes`}>Yes</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="false" id={`${idPrefix}-twic-no`} />
          <Label className="text-sm font-normal" htmlFor={`${idPrefix}-twic-no`}>No</Label>
        </div>
      </RadioGroup>
    </div>
  );
}

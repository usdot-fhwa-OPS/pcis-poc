import { ClosureDomain } from "./closure-domain"
import { EquipmentDomain } from "./equipment-domain"
import { GangDomain } from "./gang-domain"
import { OutageDomain } from "./outage-domain"
import { UnitDomain } from "./unit-domain"

export type TerminalResourceDomian = {
    terminalId: string,           // UUID, same as the BerthConfig terminalId
    sk: string,                   // Sort key; format depends on entityType (shown per record below)
    entityType: string,           // "EQTYPE" | "UNIT" | "GANG" | "CLOSURE" | "OUTAGE"
    createdAt: string,            // ISO 8601 UTC, e.g. "2026-10-30T14:00:00Z"
    createdBy: string,            // Email of the user who created it
    updatedAt: string,            // ISO 8601 UTC
    updatedBy: string,            // Email of the user who last changed it

    record: EquipmentDomain | UnitDomain | GangDomain | UnitDomain | ClosureDomain | OutageDomain;
}
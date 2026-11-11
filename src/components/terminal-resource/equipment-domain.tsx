export type EquipmentDomain = {
    sk: string,                   // "EQTYPE#<equipmentType>", e.g. "EQTYPE#HEAVY_LIFT_CRANE"
    entityType: "EQTYPE",
    equipmentType: string,        // Uppercase code, e.g. "FORKLIFT" | "CRANE" | "HEAVY_LIFT_CRANE". Never changes
    label: string,                // Display name, e.g. "Heavy-Lift Crane". Editable
    defaultDurationMins: number,  // Default job length in minutes, 1–1440
    gangsRequired: number,        // Gangs needed per job, 0–10 (usually 1)
    active: boolean,              // false = hidden from new requests (soft delete)
}
import { fetchAuthSession } from "aws-amplify/auth";
import { TerminalResourceDomian } from "./terminal-resource-domain";

const BASE_URL = "https://d4fnq7xnlc.execute-api.us-east-1.amazonaws.com/dev";

// Sends the Cognito access token; the Lambda verifies it and allows Terminal Operators only.
// Throws an Error with the server's message on any non-2xx response.
async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const session = await fetchAuthSession();
    const response = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        },
        body: body === undefined ? undefined : JSON.stringify(body)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(result?.message || `Request failed (${response.status})`);
    }
    return result as T;
}

// Lists cover all of the user's terminals unless terminalId is given. Deleted items are left out
// unless includeDeleted is true.
function listPath(path: string, terminalId?: string, includeDeleted?: boolean): string {
    const params = new URLSearchParams();
    if (terminalId) params.set("terminalId", terminalId);
    if (includeDeleted) params.set("includeDeleted", "true");
    const qs = params.toString();
    return qs ? `${path}?${qs}` : path;
}

export const getTerminalResource = (sk: string, terminalId?: string) =>
    request<TerminalResourceDomian[]>("GET", `/getTerminalResource?${new URLSearchParams({ sk, ...(terminalId ? { terminalId } : {}) })}`);

export const listTerminalResource = (terminalId?: string, includeDeleted?: boolean) =>
    request<TerminalResourceDomian[]>("GET", listPath("/listTerminalResource", terminalId, includeDeleted));

// The route name's spelling ("Equipemnts") is what API Gateway has.
export const listEquipments = (terminalId?: string, includeDeleted?: boolean) =>
    request<TerminalResourceDomian[]>("GET", listPath("/listEquipemnts", terminalId, includeDeleted));

export const listGangs = (terminalId?: string, includeDeleted?: boolean) =>
    request<TerminalResourceDomian[]>("GET", listPath("/listGangs", terminalId, includeDeleted));

export const listUnits = (terminalId?: string, includeDeleted?: boolean) =>
    request<TerminalResourceDomian[]>("GET", listPath("/listUnits", terminalId, includeDeleted));

export const listClosures = (terminalId?: string, includeDeleted?: boolean) =>
    request<TerminalResourceDomian[]>("GET", listPath("/listClosures", terminalId, includeDeleted));

export const listOutages = (terminalId?: string, includeDeleted?: boolean) =>
    request<TerminalResourceDomian[]>("GET", listPath("/listOutages", terminalId, includeDeleted));

// Creates take a flat record plus terminalId, e.g. { terminalId: "NNMT", name: "Gang A" }, and
// return the stored item.
export const createTerminalResource = (terminalResource: TerminalResourceDomian) =>
    request<TerminalResourceDomian>("POST", "/createTerminalResource", terminalResource);

export const createClosure = (closure: Record<string, unknown>) => request<TerminalResourceDomian>("POST", "/createClosure", closure);

export const createOutage = (outage: Record<string, unknown>) => request<TerminalResourceDomian>("POST", "/createOutage", outage);

export const createGang = (gang: Record<string, unknown>) => request<TerminalResourceDomian>("POST", "/createGang", gang);

export const createUnit = (unit: Record<string, unknown>) => request<TerminalResourceDomian>("POST", "/createUnit", unit);

export const createEquipment = (equipment: Record<string, unknown>) => request<TerminalResourceDomian>("POST", "/createEquipment", equipment);

// { terminalId, sk, record: { ...only the fields to change } }. Returns the stored item.
export const updateTerminalResource = (terminalResource: { terminalId: string, sk: string, record: Record<string, unknown> }) =>
    request<TerminalResourceDomian>("PUT", "/saveTerminalResource", terminalResource);

// Soft delete (closures are removed outright).
export const deleteTerminalResource = (terminalId: string, sortKey: string) =>
    request<{ terminalId: string, sk: string, deleted: boolean }>(
        "DELETE",
        `/deleteTerminalResource?${new URLSearchParams({ terminalId, sk: sortKey })}`
    );

// ---------- Weekly hours (stored in BerthConfig.weeklyHours) ----------

export type DayCode = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
export type OpenInterval = { open: string, close: string };  // "HH:mm", 24-hour
export type WeeklyHours = Record<DayCode, OpenInterval[]>;   // [] = closed that day

export type TerminalHours = {
    terminalId: string,
    terminalName: string | null,
    timezone: string | null,
    configured: boolean,          // false = no BerthConfig record yet, so hours can't be saved
    weeklyHours: WeeklyHours,
    updatedAt: string | null,
    updatedBy: string | null,
};

export const listTerminalHours = (terminalId?: string) =>
    request<TerminalHours[]>("GET", listPath("/listTerminalHours", terminalId));

// Updates only weeklyHours on the terminal's BerthConfig record.
export const saveTerminalHours = (terminalId: string, weeklyHours: Partial<WeeklyHours>) =>
    request<{ terminalId: string, weeklyHours: WeeklyHours }>("PUT", "/saveTerminalHours", { terminalId, weeklyHours });

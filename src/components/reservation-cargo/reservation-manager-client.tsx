import { fetchAuthSession } from "aws-amplify/auth";
import { ReservationDomain } from "./reservation-domain";
import { ReservationEventDomain } from "./reservation-event-domain";
import { ReservationMoveDomain } from "./reservation-move-domain";

export const listReservations = async (): Promise<ReservationDomain[]> => {
    const session = await fetchAuthSession();
    let url = 'https://ubw4jy0m7j.execute-api.us-east-1.amazonaws.com/dev/listReservations'
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    const result = (await response.json()).items as ReservationDomain[];
    return result;
}

export const listReservationMoves = async (): Promise<ReservationMoveDomain[]> => {
    const session = await fetchAuthSession();
    let url = 'https://ubw4jy0m7j.execute-api.us-east-1.amazonaws.com/dev/listReservationMoves'
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    const result = (await response.json()).items as ReservationMoveDomain[];
    return result;
}

export const listReservationEvents = async (): Promise<ReservationEventDomain[]> => {
    const session = await fetchAuthSession();
    let url = 'https://ubw4jy0m7j.execute-api.us-east-1.amazonaws.com/dev/listReservationEvents'
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    const result = (await response.json()).items as ReservationEventDomain[];
    return result;
}

export const getReservation = async (reservationId:string): Promise<ReservationDomain> => {
    const session = await fetchAuthSession();
    let url = 'https://ubw4jy0m7j.execute-api.us-east-1.amazonaws.com/dev/listReservations'
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        },
        body:JSON.stringify({
            "reservationId":reservationId
        })
    });
    const result = (await response.json()).items[0] as ReservationDomain;
    return result;
}

export const updateReservation = async (reservation:ReservationDomain): Promise<any> => {
    const session = await fetchAuthSession();
    let url = 'https://ubw4jy0m7j.execute-api.us-east-1.amazonaws.com/dev/saveReservation'
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        },
        body:JSON.stringify(reservation)
    });
    const result = (await response.json())
    return result;
}

export const deleteReservation = async (reservationId:string): Promise<any> => {
    const session = await fetchAuthSession();
    let url = `https://ubw4jy0m7j.execute-api.us-east-1.amazonaws.com/dev/deleteReservation?reservationId=${reservationId}`
    
    const response = await fetch(url, {
        method: 'DELETE',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    const result = (await response.json())
    return result;
}

export const createReservation = async (reservation:ReservationDomain): Promise<any> => {
    const session = await fetchAuthSession();
    let url = 'https://ubw4jy0m7j.execute-api.us-east-1.amazonaws.com/dev/createReservation'
    
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        },
        body:JSON.stringify(reservation)
    });
    const result = (await response.json())
    return result;
}


export const getReservationMove = async (moveId:string): Promise<ReservationMoveDomain> => {
    const session = await fetchAuthSession();
    let url = 'https://ubw4jy0m7j.execute-api.us-east-1.amazonaws.com/dev/listReservationMoves'
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        },
        body:JSON.stringify({
            "moveId":moveId
        })
    });
    const result = (await response.json()).items[0] as ReservationMoveDomain;
    return result;
}
export const updateReservationMove = async (reservationMove:ReservationMoveDomain): Promise<any> => {
    const session = await fetchAuthSession();
    let url = 'https://ubw4jy0m7j.execute-api.us-east-1.amazonaws.com/dev/saveReservationMove'
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        },
        body:JSON.stringify(reservationMove)
    });
    const result = (await response.json())
    return result;
}

export const deleteReservationMove = async (moveId:string): Promise<any> => {
    const session = await fetchAuthSession();
    let url = `https://ubw4jy0m7j.execute-api.us-east-1.amazonaws.com/dev/deleteReservationMove?moveId=${moveId}`
    
    const response = await fetch(url, {
        method: 'DELETE',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    const result = (await response.json())
    return result;
}

export const createReservationMove = async (reservationMove:ReservationMoveDomain): Promise<any> => {
    const session = await fetchAuthSession();
    let url = 'https://ubw4jy0m7j.execute-api.us-east-1.amazonaws.com/dev/createReservationMove'
    
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        },
        body:JSON.stringify(reservationMove)
    });
    const result = (await response.json())
    return result;
}

export const getReservationEvent = async (eventId:string): Promise<ReservationEventDomain> => {
    const session = await fetchAuthSession();
    let url = 'https://ubw4jy0m7j.execute-api.us-east-1.amazonaws.com/dev/listReservationEvents'
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        },
        body:JSON.stringify({
            "eventId":eventId
        })
    });
    const result = (await response.json()).items[0] as ReservationEventDomain;
    return result;
}

export const deleteReservationEvent = async (eventId:string): Promise<any> => {
    const session = await fetchAuthSession();
    let url = `https://ubw4jy0m7j.execute-api.us-east-1.amazonaws.com/dev/deleteReservationEvent?eventId=${eventId}`
    
    const response = await fetch(url, {
        method: 'DELETE',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    const result = (await response.json())
    return result;
}

export const createReservationEvent = async (reservationEvent:ReservationEventDomain): Promise<any> => {
    const session = await fetchAuthSession();
    let url = 'https://ubw4jy0m7j.execute-api.us-east-1.amazonaws.com/dev/createReservationEvent'
    
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        },
        body:JSON.stringify(reservationEvent)
    });
    const result = (await response.json())
    return result;
}



// I-3: equipment types and reservation requests.
// These routes verify the caller's ID token, so they send it instead of the access token.
const RESERVATIONS_API = 'https://ubw4jy0m7j.execute-api.us-east-1.amazonaws.com/dev'

export type EquipmentTypeOption = {
    equipmentType: string,
    label: string,
    defaultDurationMins: number,
    gangsRequired: number
}

export type ReservationRequestInput = {
    preferredStartAt: string,
    moves: { cargoUnitID: string, equipmentType: string }[]
}

export type ReservationRequestResult = {
    reservationId: string,
    confirmationCode: string,
    status: string,
    terminalId: string,
    startAt: string,
    endAt: string,
    durationMins: number
}

const idTokenHeaders = async () => {
    const session = await fetchAuthSession();
    return {
        "Authorization": `Bearer ${session.tokens?.idToken?.toString()}`,
        "Content-Type": "application/json",
        "Accept": "*/*"
    };
}

const readJsonOrThrow = async (response: Response) => {
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(body?.message || `Request failed (${response.status})`);
    }
    return body;
}

export const listEquipmentTypesForCargoUnit = async (cargoUnitID: string): Promise<EquipmentTypeOption[]> => {
    const response = await fetch(`${RESERVATIONS_API}/listEquipmentTypes?cargoUnitID=${encodeURIComponent(cargoUnitID)}`, {
        method: 'GET',
        headers: await idTokenHeaders()
    });
    const body = await readJsonOrThrow(response);
    return body.items as EquipmentTypeOption[];
}

export const createReservationRequest = async (request: ReservationRequestInput): Promise<ReservationRequestResult> => {
    const response = await fetch(`${RESERVATIONS_API}/createReservationRequest`, {
        method: 'PUT',
        headers: await idTokenHeaders(),
        body: JSON.stringify(request)
    });
    return (await readJsonOrThrow(response)) as ReservationRequestResult;
}

// I-4: terminal review. These routes are for Terminal Operators of the reservation's terminal.
export type ReviewMove = {
    moveId: string,
    sequence: number,
    cargoUnitID: string,
    moveType: string,
    equipmentType: string,
    equipmentLabel: string,
    durationMins: number,
    vesselID?: string,
    origin?: string,
    bcoName?: string,
    bcoEmail?: string,
    transopName?: string,
    transopEmail?: string
}

export type ReservationForReview = {
    reservationId: string,
    confirmationCode: string,
    status: string,
    terminalId: string,
    preferredStartAt: string,
    startAt: string,
    endAt: string,
    durationMins: number,
    requestingUserEmail: string,
    requestingUserName?: string,
    createdAt: string,
    moves: ReviewMove[]
}

export type GangOption = {
    gangId: string,
    name: string,
    equipmentTypes: string[]
}

export type GangAssignment = { moveId: string, gangId: string }

export type ReservationRequestsResult = {
    items: ReservationForReview[],
    // Active gangs per terminal the TO belongs to.
    gangs: Record<string, GangOption[]>
}

export const listReservationRequests = async (): Promise<ReservationRequestsResult> => {
    const response = await fetch(`${RESERVATIONS_API}/listReservationRequests`, {
        method: 'GET',
        headers: await idTokenHeaders()
    });
    const body = await readJsonOrThrow(response);
    return { items: body.items as ReservationForReview[], gangs: (body.gangs || {}) as Record<string, GangOption[]> };
}

export const acceptReservation = async (reservationId: string, twicEscortRequired: boolean, gangAssignments: GangAssignment[]) => {
    const response = await fetch(`${RESERVATIONS_API}/acceptReservation`, {
        method: 'POST',
        headers: await idTokenHeaders(),
        body: JSON.stringify({ reservationId, twicEscortRequired, gangAssignments })
    });
    return readJsonOrThrow(response);
}

export const modifyReservation = async (request: {
    reservationId: string,
    startAt: string,
    // durationMins overrides the equipment type's default for that move.
    moves: { moveId: string, equipmentType: string, durationMins: number }[],
    twicEscortRequired: boolean,
    gangAssignments: GangAssignment[]
}) => {
    const response = await fetch(`${RESERVATIONS_API}/modifyReservation`, {
        method: 'POST',
        headers: await idTokenHeaders(),
        body: JSON.stringify(request)
    });
    return readJsonOrThrow(response);
}

// Marks the request DENIED with a reason and keeps its history (the old version deleted moves and events).
export const denyReservation = async (reservationId: string, reason: string) => {
    const response = await fetch(`${RESERVATIONS_API}/denyReservation`, {
        method: 'POST',
        headers: await idTokenHeaders(),
        body: JSON.stringify({ reservationId, reason })
    });
    return readJsonOrThrow(response);
}

export const listEquipmentTypesForTerminal = async (terminalId: string): Promise<EquipmentTypeOption[]> => {
    const response = await fetch(`${RESERVATIONS_API}/listEquipmentTypes?terminalId=${encodeURIComponent(terminalId)}`, {
        method: 'GET',
        headers: await idTokenHeaders()
    });
    return (await readJsonOrThrow(response)).items as EquipmentTypeOption[];
}

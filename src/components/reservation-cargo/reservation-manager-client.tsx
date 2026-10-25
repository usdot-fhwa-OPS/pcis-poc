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



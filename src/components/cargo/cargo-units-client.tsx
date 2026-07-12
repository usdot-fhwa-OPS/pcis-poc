import { fetchAuthSession } from "aws-amplify/auth";
import { UpcomingCargo } from "../../routes/cargo";
import { BCOCompletedBooking, BCOOngoingBooking, BCOUpcomingBookings, TerminalOPOngoingBookings, TransOpOngoingBookings, TransOpUpcomingBookings } from "../../routes/reservation";
import { TerminalOpModifiedBookings, TermOperatorCompletedBookings, TransOperatorCompletedBookings } from "../../routes";
import { Notifications } from "../app-sidebar/app-sidebar";

export const listCargoUnits = async (): Promise<UpcomingCargo[]> => {
    const session = await fetchAuthSession();
    let url = `https://dd1jp7oh40.execute-api.us-east-1.amazonaws.com/dev/list`
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    const result = (await response.json()).items as UpcomingCargo[];
    return result;
}

export const getCargoBookingsAmount = async (reservationDate: string): Promise<number> => {
    const session = await fetchAuthSession();
    let url = `https://dd1jp7oh40.execute-api.us-east-1.amazonaws.com/dev/getBookingsAmount?date=${reservationDate}`
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    const result = (await response.json());
    return result.count;
}

// export const fetchLimit = async (id: string): Promise<string[]> => {
//     const session = await fetchAuthSession();
//     let url = `https://dd1jp7oh40.execute-api.us-east-1.amazonaws.com/dev/fetchLimit?id=${id}`
    
//     const response = await fetch(url, {
//         method: 'GET',
//         headers: {
//             "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
//             "Content-Type": "application/json",
//             "Accept": "*/*"
//         }
//     });
//     const result = (await response.json());
//     return result;
// }


export const saveCargoUnit = async (cargoUnit:any): Promise<string> => {
    const session = await fetchAuthSession();
    const response = await fetch(`https://dd1jp7oh40.execute-api.us-east-1.amazonaws.com/dev/saveCargoUnit`, {
        method: 'PUT',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        },
        body: JSON.stringify(cargoUnit)
    });
    const result = (await response.json());
    return result;
}


export const fetchBcoNotifications = async (bcoEmail: string): Promise<Notifications[]> => {
    const session = await fetchAuthSession();

    let url = `https://dd1jp7oh40.execute-api.us-east-1.amazonaws.com/dev/fetchBcoNotifications?bcoEmail=${bcoEmail}`
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    const result = (await response.json()).items as Notifications[];
    return result;
}

export const fetchTransportationNotifications = async (): Promise<Notifications[]> => {
    const session = await fetchAuthSession();

    let url = `https://dd1jp7oh40.execute-api.us-east-1.amazonaws.com/dev/fetchTransportationNotifications`
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    const result = (await response.json()).items as Notifications[];
    return result;
}

export const fetchTerminalNotifications = async (): Promise<Notifications[]> => {
    const session = await fetchAuthSession();

    let url = `https://dd1jp7oh40.execute-api.us-east-1.amazonaws.com/dev/fetchTerminalNotifications`
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    const result = (await response.json()).items as Notifications[];
    return result;
}


export const listTermOpRequestedCargoUnits = async (): Promise<TerminalOPOngoingBookings[]> => {
    const session = await fetchAuthSession();
    let url = `https://dd1jp7oh40.execute-api.us-east-1.amazonaws.com/dev/fetchTerminalOpRequested`
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    const result = (await response.json()).items as TerminalOPOngoingBookings[];
    return result;
}


export const listTermOpModifiedRequestedCargoUnits = async (): Promise<TerminalOpModifiedBookings[]> => {
    const session = await fetchAuthSession();
    let url = `https://dd1jp7oh40.execute-api.us-east-1.amazonaws.com/dev/fetchTerminalOpModifiedRequested`
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    const result = (await response.json()).items as TerminalOpModifiedBookings[];
    return result;
}

export const listTermOpOnGoingCargoUnits = async (): Promise<TerminalOPOngoingBookings[]> => {
    const session = await fetchAuthSession();
    let url = `https://dd1jp7oh40.execute-api.us-east-1.amazonaws.com/dev/fetchTerminalOpOnGoing`
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    const result = (await response.json()).items as TerminalOPOngoingBookings[];
    return result;
}


export const listTransOpCompleted = async (email: string): Promise<TransOperatorCompletedBookings> => {
    const session = await fetchAuthSession();
    let url = `https://dd1jp7oh40.execute-api.us-east-1.amazonaws.com/dev/fetchTransOpBookings?transopEmail=${email}`
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    const result = (await response.json()).items as TransOperatorCompletedBookings[];
    return result;
}

export const listTransOpUpcoming = async (email: string): Promise<TransOpUpcomingBookings> => {
    const session = await fetchAuthSession();
    let url = `https://dd1jp7oh40.execute-api.us-east-1.amazonaws.com/dev/fetchTransOpUpcoming?transopEmail=${email}`
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    const result = (await response.json()).items as TransOpUpcomingBookings[];
    return result;
}
export const listTermOpCompleted = async (): Promise<TermOperatorCompletedBookings> => {
    const session = await fetchAuthSession();
    let url = `https://dd1jp7oh40.execute-api.us-east-1.amazonaws.com/dev/fetchTerminalOpCompleted`
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    const result = (await response.json()).items as TermOperatorCompletedBookings[];
    return result;
}

export const listTermOpOngoing = async (transopEmail: string): Promise<TransOpOngoingBookings> => {
    const session = await fetchAuthSession();
    let url = `https://dd1jp7oh40.execute-api.us-east-1.amazonaws.com/dev/fetchTransOpOngoing?transopEmail=${transopEmail}`
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    const result = (await response.json()).items as TransOpOngoingBookings[];
    return result;
}


export const listBcoUpcoming = async (bcoEmail: string): Promise<BCOUpcomingBookings> => {
    const session = await fetchAuthSession();
    let url = `https://dd1jp7oh40.execute-api.us-east-1.amazonaws.com/dev/fetchBcoUpcoming?bcoEmail=${bcoEmail}`
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    const result = (await response.json()).items as BCOUpcomingBookings[];
    return result;
}

export const listBcoOngoing = async (bcoEmail: string): Promise<BCOOngoingBooking> => {
    const session = await fetchAuthSession();
    let url = `https://dd1jp7oh40.execute-api.us-east-1.amazonaws.com/dev/fetchBcoOngoing?bcoEmail=${bcoEmail}`
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    const result = (await response.json()).items as BCOOngoingBooking[];
    return result;
}

export const listBcoCompleted = async (bcoEmail: string): Promise<BCOCompletedBooking> => {
    const session = await fetchAuthSession();
    let url = `https://dd1jp7oh40.execute-api.us-east-1.amazonaws.com/dev/fetchBcoCompleted?bcoEmail=${bcoEmail}`
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    const result = (await response.json()).items as BCOCompletedBooking[];
    return result;
}



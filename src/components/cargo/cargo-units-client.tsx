import { fetchAuthSession } from "aws-amplify/auth";
import { UpcomingCargo } from "../../routes/cargo";
import { BCOCompletedBooking, BCOOngoingBooking, BCOUpcomingBookings, TerminalOPOngoingBookings, TransOpOngoingBookings, TransOpUpcomingBookings } from "../../routes/reservation";
import { TerminalOpModifiedBookings, TermOperatorCompletedBookings, TransOperatorCompletedBookings } from "../../routes";



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

export const onCargoUpdate = () => {
    const subscribers: { next: any, error: any }[] = [];

    return {
        // Add a subscriber to the list
        subscribe: (item: { next: any, error: any }) => {
            subscribers.push(item);
            return { // Remove a subscriber from the list
                unsubscribe: () => {
                    const index = subscribers.indexOf(item);

                    if (index > -1) {
                        subscribers.splice(index, 1); // 1 means remove exactly one item
                    }
                }
            };
        },



        // notify next to all subscribers
        next: () => {
            subscribers.forEach((item: { next: any, error: (error: any) => {} }) => item.next());
        },
        error: (error: any) => {
            subscribers.forEach((item: { next: any, error: (error: any) => {} }) => item.error(error));
        },

    }
}
export const saveHazardousCargo = async (UpcomingCargo: UpcomingCargo): Promise<string> => {
    const session = await fetchAuthSession();
    const response = await fetch(`https://bubcodjacl.execute-api.us-east-1.amazonaws.com/dev/hazardousCargos/${UpcomingCargo.vesselId}`, {
        method: 'PUT',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        },
        body: JSON.stringify(UpcomingCargo)
    });
    const result = (await response.json());
    onCargoUpdate().next();
    return result;
}

export const deleteHazardousCargo = async (vesselId:string): Promise<any> => {
    const session = await fetchAuthSession();
    const response = await fetch(`https://bubcodjacl.execute-api.us-east-1.amazonaws.com/dev/hazardousCargos/${vesselId}`, {
        method: 'DELETE',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    return response;
}

export const getHazardousCargo = async (vesselId:string, cargoUnitID:string): Promise<UpcomingCargo> => {
    const session = await fetchAuthSession();
    const response = await fetch(`https://bubcodjacl.execute-api.us-east-1.amazonaws.com/dev/hazardousCargos/${vesselId}/${cargoUnitID}`, {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    const result = (await response.json()) as UpcomingCargo;
    return result;
}

export const requestAdditionalDocument = async (vesselId:string, cargoUnitID:string): Promise<UpcomingCargo> => {
    const session = await fetchAuthSession();
    const response = await fetch(`https://bubcodjacl.execute-api.us-east-1.amazonaws.com/dev/requestAdditionalDocument?vesselId=${vesselId}&cargoUnitID=${cargoUnitID}`, {
        method: 'PUT',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    const result = (await response.json()) as UpcomingCargo;
    return result;
}

export const flagHazardousCargo = async (vesselId:string, cargoUnitID:string): Promise<UpcomingCargo> => {
    const session = await fetchAuthSession();
    const response = await fetch(`https://bubcodjacl.execute-api.us-east-1.amazonaws.com/dev/flag?vesselId=${vesselId}&cargoUnitID=${cargoUnitID}`, {
        method: 'PUT',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    const result = (await response.json()) as UpcomingCargo;
    return result;
}

export const approveHazardousCargo = async (vesselId:string, cargoUnitID:string): Promise<UpcomingCargo> => {
    const session = await fetchAuthSession();
    const response = await fetch(`https://bubcodjacl.execute-api.us-east-1.amazonaws.com/dev/approve?vesselId=${vesselId}&cargoUnitID=${cargoUnitID}`, {
        method: 'PUT',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    const result = (await response.json()) as UpcomingCargo;
    return result;
}

export const completeDocumentCheck = async (vesselId:string, cargoUnitID:string): Promise<UpcomingCargo> => {
    const session = await fetchAuthSession();
    const response = await fetch(`https://bubcodjacl.execute-api.us-east-1.amazonaws.com/dev/completeDocumentCheck?vesselId=${vesselId}&cargoUnitID=${cargoUnitID}`, {
        method: 'PUT',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    const result = (await response.json()) as UpcomingCargo;
    return result;
}

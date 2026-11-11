import { fetchAuthSession } from "aws-amplify/auth";
import { TerminalResourceDomian } from "./terminal-resource-domain";

export const getTerminalResource = async (sk:string): Promise<TerminalResourceDomian[]> => {
    
    let url = `https://d4fnq7xnlc.execute-api.us-east-1.amazonaws.com/dev/getTerminalResource?sk=${encodeURIComponent(sk)}`
    const session = await fetchAuthSession();
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    const result = (await response.json()) as TerminalResourceDomian[];
    return result;
}

export const listTerminalResource = async (): Promise<TerminalResourceDomian[]> => {
    
    let url = 'https://d4fnq7xnlc.execute-api.us-east-1.amazonaws.com/dev/listTerminalResource'
    const session = await fetchAuthSession();
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    const result = (await response.json()) as TerminalResourceDomian[];
    return result;
}
export const listEquipments = async (): Promise<TerminalResourceDomian[]> => {
    
    let url = 'https://d4fnq7xnlc.execute-api.us-east-1.amazonaws.com/dev//listEquipemnts'
    const session = await fetchAuthSession();
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    const result = (await response.json()) as TerminalResourceDomian[];
    return result;
}
export const listGangs = async (): Promise<TerminalResourceDomian[]> => {
    
    let url = 'https://d4fnq7xnlc.execute-api.us-east-1.amazonaws.com/dev/listGangs'
    const session = await fetchAuthSession();
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    const result = (await response.json()) as TerminalResourceDomian[];
    return result;
}


export const listUnits = async (): Promise<TerminalResourceDomian[]> => {
    
    let url = 'https://d4fnq7xnlc.execute-api.us-east-1.amazonaws.com/dev/listUnits'
    const session = await fetchAuthSession();
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    const result = (await response.json()) as TerminalResourceDomian[];
    return result;
}
export const listClosures  = async (): Promise<TerminalResourceDomian[]> => {
    
    let url = 'https://d4fnq7xnlc.execute-api.us-east-1.amazonaws.com/dev/listClosures'
    const session = await fetchAuthSession();
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    const result = (await response.json()) as TerminalResourceDomian[];
    return result;
}
export const listOutages = async (): Promise<TerminalResourceDomian[]> => {
    
    let url = 'https://d4fnq7xnlc.execute-api.us-east-1.amazonaws.com/dev/listOutages '
    const session = await fetchAuthSession();
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    const result = (await response.json()) as TerminalResourceDomian[];
    return result;
}

export const createTerminalResource = async (terninalResource: TerminalResourceDomian): Promise<any> => {
    
    let url = 'https://d4fnq7xnlc.execute-api.us-east-1.amazonaws.com/dev/createTerminalResource'
    const session = await fetchAuthSession();
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        },
        body:JSON.stringify(terninalResource)
    });
    const result = (await response.json()) as TerminalResourceDomian[];
    return result;
}
export const createClosure = async (closure: any): Promise<any> => {
    
    let url = 'https://d4fnq7xnlc.execute-api.us-east-1.amazonaws.com/dev/createClosure'
    const session = await fetchAuthSession();
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        },
        body:JSON.stringify(closure)
    });
    const result = (await response.json()) as TerminalResourceDomian[];
    return result;
}
export const createOutage = async (outage: any): Promise<any> => {
    
    let url = 'https://d4fnq7xnlc.execute-api.us-east-1.amazonaws.com/dev/createOutage'
    const session = await fetchAuthSession();
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        },
        body:JSON.stringify(outage)
    });
    const result = (await response.json()) as TerminalResourceDomian[];
    return result;
}
export const createGang = async (gang: any): Promise<any> => {
    
    let url = 'https://d4fnq7xnlc.execute-api.us-east-1.amazonaws.com/dev/createGang'
    const session = await fetchAuthSession();
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        },
        body:JSON.stringify(gang)
    });
    const result = (await response.json()) as TerminalResourceDomian[];
    return result;
}
export const createUnit = async (unit: any): Promise<any> => {
    
    let url = 'https://d4fnq7xnlc.execute-api.us-east-1.amazonaws.com/dev/createUnit'
    const session = await fetchAuthSession();
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        },
        body:JSON.stringify(unit)
    });
    const result = (await response.json()) as TerminalResourceDomian[];
    return result;
}
export const createEquipment = async (equipment: any): Promise<any> => {
    
    let url = 'https://d4fnq7xnlc.execute-api.us-east-1.amazonaws.com/dev/createEquipment'
    const session = await fetchAuthSession();
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        },
        body:JSON.stringify(equipment)
    });
    const result = (await response.json()) as TerminalResourceDomian[];
    return result;
}

export const updateTerminalResource = async (terminalResource: any): Promise<any> => {
    
    let url = 'https://d4fnq7xnlc.execute-api.us-east-1.amazonaws.com/dev/saveTerminalResource'
    const session = await fetchAuthSession();
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        },
        body:JSON.stringify(terminalResource)
    });
    const result = (await response.json()) 
    return result;
}

export const deleteTerminalResource = async (terminalId: string, sortKey: string): Promise<any> => {
    
    let url = `https://d4fnq7xnlc.execute-api.us-east-1.amazonaws.com/dev/deleteTerminalResource?terminalId=${terminalId}&sk=${encodeURIComponent(sortKey)}`
    const session = await fetchAuthSession();
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

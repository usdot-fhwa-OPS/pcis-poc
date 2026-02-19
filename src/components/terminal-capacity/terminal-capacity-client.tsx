import { fetchAuthSession } from "aws-amplify/auth";
import { TerminalCapacityDomian } from "./terminal-capacity-domain";



export const terminalCapacityList = async (): Promise<TerminalCapacityDomian[]> => {
    const session = await fetchAuthSession();
    const response = await fetch("https://xlj2x9eurh.execute-api.us-east-1.amazonaws.com/dev/terminalCapacityList", {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    const result = (await response.json()) as TerminalCapacityDomian[];
    return result;
}

export const saveTerminalCapacity = async (termCapDomain: TerminalCapacityDomian): Promise<string> => {
    const session = await fetchAuthSession();
    const response = await fetch("https://xlj2x9eurh.execute-api.us-east-1.amazonaws.com/dev/terminalCapacity", {
        method: 'PUT',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        },
        body: JSON.stringify(termCapDomain)
    });
    const result = (await response.json());
    return result;
}

export const deleteTerrminalCapacity = async (terminalCapacityUid:string): Promise<any> => {
    const session = await fetchAuthSession();
    const response = await fetch(`https://xlj2x9eurh.execute-api.us-east-1.amazonaws.com/dev/terminalCapacity/${terminalCapacityUid}`, {
        method: 'DELETE',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    return response;
}

export const getTerrminalCapacity = async (terminalCapacityUid:string): Promise<TerminalCapacityDomian> => {
    const session = await fetchAuthSession();
    const response = await fetch(`https://xlj2x9eurh.execute-api.us-east-1.amazonaws.com/dev/terminalCapacity/${terminalCapacityUid}`, {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    const result = (await response.json()) as TerminalCapacityDomian;
    return result;
}
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
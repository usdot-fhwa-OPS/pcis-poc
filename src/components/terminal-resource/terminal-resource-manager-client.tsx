import { fetchAuthSession } from "aws-amplify/auth";
import { TerminalResourceDomian } from "./terminal-resource-domain";

export const getTerminalResource = async (sk:string): Promise<TerminalResourceDomian> => {
    const session = await fetchAuthSession();
    let url = `https://d4fnq7xnlc.execute-api.us-east-1.amazonaws.com/dev/getTerminalResource?sk=${encodeURIComponent(sk)}`
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    const result = (await response.json()) as TerminalResourceDomian;
    return result;
}


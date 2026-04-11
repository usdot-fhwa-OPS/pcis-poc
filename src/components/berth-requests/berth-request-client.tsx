import { fetchAuthSession } from "aws-amplify/auth";
import { BerthRequestDomain } from "./berth-request-domain";
import { format } from "date-fns"
import { BerthConfigDomain } from "./berth-config-domain";


export const berthConfigList = async (): Promise<BerthConfigDomain[]> => {
    const session = await fetchAuthSession();
    const response = await fetch("https://ewutyf2fml.execute-api.us-east-1.amazonaws.com/dev/berthConfig/list", {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    const result = (await response.json()) as BerthConfigDomain[];
    return result;
}

export const berthRequestList = async (): Promise<BerthRequestDomain[]> => {
    const session = await fetchAuthSession();
    const response = await fetch("https://ewutyf2fml.execute-api.us-east-1.amazonaws.com/dev/berthRequests", {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    const result = (await response.json()).items as BerthRequestDomain[];
    result.map((item)=>{
        try{
            item.etaAt= format(item.etaAt?item.etaAt:'', "MM/dd/yyyy");
            item.etdAt = format(item.etdAt?item.etdAt:'', "MM/dd/yyyy");

        }catch(e){
            console.error(e);
        }
    })
    return result;
}

export const saveBerthRequest = async (berthRequestDomain: BerthRequestDomain): Promise<string> => {
    const session = await fetchAuthSession();
    const response = await fetch("https://ewutyf2fml.execute-api.us-east-1.amazonaws.com/dev/berthRequests", {
        method: 'POST',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        },
        body: JSON.stringify(berthRequestDomain)
    });
    const result = (await response.json());
    return result;
}

export const deleteBerthRequest = async (berthRequestUid:string): Promise<any> => {
    const session = await fetchAuthSession();
    const response = await fetch(`https://xlj2x9eurh.execute-api.us-east-1.amazonaws.com/dev/berthRequest/${berthRequestUid}`, {
        method: 'DELETE',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    return response;
}

export const getTerrminalCapacity = async (berthRequestUid:string): Promise<BerthRequestDomain> => {
    const session = await fetchAuthSession();
    const response = await fetch(`https://xlj2x9eurh.execute-api.us-east-1.amazonaws.com/dev/berthRequest/${berthRequestUid}`, {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    const result = (await response.json()) as BerthRequestDomain;
    return result;
}
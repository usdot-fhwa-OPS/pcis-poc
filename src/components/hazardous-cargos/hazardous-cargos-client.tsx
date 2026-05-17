import { fetchAuthSession } from "aws-amplify/auth";
import { format } from "date-fns"
import { HazardousCargoDomain } from "./hazardous-cargo-domain";


export const hazardousCargoList = async (vesselId:string, vesselAgentEmail: string): Promise<HazardousCargoDomain[]> => {
    const session = await fetchAuthSession();
    const response = await fetch(`https://bubcodjacl.execute-api.us-east-1.amazonaws.com/dev/hazardousCargos?vesselId=${vesselId},vesselAgentEmail=${vesselAgentEmail}`, {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    const result = (await response.json()) as HazardousCargoDomain[];
    result.map((item)=>{
        try{
            item.arrivalDate= format(item.arrivalDate?item.arrivalDate:'', "MM/dd/yyyy");

        }catch(e){
            console.error(e);
        }
    })
    return result;
}

export const saveHazardousCargo = async (hazardousCargoDomain: HazardousCargoDomain): Promise<string> => {
    const session = await fetchAuthSession();
    const response = await fetch(`https://bubcodjacl.execute-api.us-east-1.amazonaws.com/dev/hazardousCargos/${hazardousCargoDomain.vesselId}`, {
        method: 'PUT',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        },
        body: JSON.stringify(hazardousCargoDomain)
    });
    const result = (await response.json());
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

export const getHazardousCargo = async (vesselId:string, cargoUnitID:string): Promise<HazardousCargoDomain> => {
    const session = await fetchAuthSession();
    const response = await fetch(`https://bubcodjacl.execute-api.us-east-1.amazonaws.com/dev/hazardousCargos/${vesselId}/${cargoUnitID}`, {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    const result = (await response.json()) as HazardousCargoDomain;
    return result;
}
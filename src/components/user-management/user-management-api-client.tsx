import { fetchAuthSession } from "aws-amplify/auth";
import { UserInfoDomain } from "./user-info-domain";


export const listUsers = async (): Promise<UserInfoDomain[]> => {
    const session = await fetchAuthSession();
    const response = await fetch("https://2472g0pixa.execute-api.us-east-1.amazonaws.com/dev/listUsers", {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    const result = (await (response.json())).users as UserInfoDomain[];
    return result;
}

export const enableUser = async (userName:string): Promise<string> => {
    const session = await fetchAuthSession();
    const response = await fetch(`https://2472g0pixa.execute-api.us-east-1.amazonaws.com/dev/enableUser?username=${userName}`, {
        method: 'Post',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    const result = (await (response.json()));
    return result;
}

export const disableUser = async (userName:string): Promise<string> => {
    const session = await fetchAuthSession();
    const response = await fetch(`https://2472g0pixa.execute-api.us-east-1.amazonaws.com/dev/disableUser?username=${userName}`, {
        method: 'Post',
        headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
        }
    });
    const result = (await (response.json()));
    return result;
}

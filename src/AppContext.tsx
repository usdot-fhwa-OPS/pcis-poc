import { createContext, } from 'react';
import { UserAttributes } from './routes/__root';
// initialize the context with an empty object
export const UserContext = createContext<UserAttributes>({});



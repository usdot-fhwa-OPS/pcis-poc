import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import '../App.css';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchUserAttributes } from 'aws-amplify/auth';
import  { useEffect, useState } from 'react';
import { SidebarProvider } from "../components/ui/sidebar";
import { AppSidebar } from "../components/app-sidebar/app-sidebar"
import UserButton from '../components/userButton/userButton';
import '../index.css';
import { Toaster } from 'sonner';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { UserContext } from '../AppContext';


export interface UserAttributes {
  given_name?: string;
  family_name?: string;
  'custom:role'?: string;
}


export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: () => {
    return (
      <div>
        <p>This is the notFoundComponent configured on root route</p>
        <Link to="/">Start Over</Link>
      </div>
    )
  },
})
const client = generateClient<Schema>();

function RootComponent() {
  const { user } = useAuthenticator()
  const [userAttributes, setUserAttributes] = useState<{ fullName: string; role: string }>({ fullName: "", role: "" })
  const [bookingLimit, setBookingLimit] = useState<number>(0);

  const [userSecurityAttrubutes, setUserSecurityAttrubutes] = useState<UserAttributes>({});
  
  useEffect(() => {
    const getUserAttributes = async () => {
      try {
        const attributes: UserAttributes = await fetchUserAttributes()

        const fullName =
          attributes.given_name && attributes.family_name
            ? `${attributes.given_name} ${attributes.family_name}`
            : "Unknown"

        setUserAttributes({
          fullName,
          role: attributes["custom:role"] ?? "No role assigned",
        })
        setUserSecurityAttrubutes({...attributes});
      } catch (error) {
        console.error("Error fetching user attributes:", error)
      }
    }

    if (user) {
      getUserAttributes()
      fetchBookingLimit();
    }
  }, [user])

  async function fetchBookingLimit() {
    try {
      const { data: limit } = await client.models.Limit.get(
        {id: '240f1ba3-a8dd-4482-89dc-bba67fe620b7'},
        {
          authMode: 'apiKey',
        }
      );
      
      if (limit) {
        setBookingLimit(limit.terminalCapacity); // changed port to terminal
      }
    } catch (error) {
      console.error('Error fetching booking limit', error);
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarProvider>
        <AppSidebar />
        {userSecurityAttrubutes.given_name && <UserContext.Provider value={userSecurityAttrubutes} >  
        <div className="flex-1">
          <Toaster position="top-center" richColors={true} expand={true} />
          <div className="flex items-center justify-end p-4">
            <UserButton fullName={userAttributes.fullName} role={userAttributes.role} limit={bookingLimit ?? 0} />
          </div>
         
          
            <Outlet /> 
            
            
          
         
        </div>
        </UserContext.Provider>}
      </SidebarProvider>
    </div>
  )
}
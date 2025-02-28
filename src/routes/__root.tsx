import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import '../App.css';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { useEffect, useState } from 'react';
import { SidebarProvider } from "../components/ui/sidebar";
import { AppSidebar } from "../components/app-sidebar/app-sidebar"
import UserButton from '../components/userButton/userButton';
import '../index.css';
import { Toaster } from 'sonner';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

interface UserAttributes {
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
        {id: 'fb06313f-66fa-47e7-830c-20f343b9339c'},
        {
          authMode: 'apiKey',
        }
      );
      
      if (limit) {
        setBookingLimit(limit.portCapacity);
        console.log('Booking limit:', limit.portCapacity);
      }
    } catch (error) {
      console.error('Error fetching booking limit', error);
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarProvider>
        <AppSidebar />
        <div className="flex-1">
          <Toaster position="bottom-right" richColors={true} />
          <div className="flex items-center justify-end p-4">
            <UserButton fullName={userAttributes.fullName} role={userAttributes.role} limit={bookingLimit ?? 0} />
          </div>
          <Outlet />
        </div>
      </SidebarProvider>
    </div>
  )
}
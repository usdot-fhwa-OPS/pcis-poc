import { SelectionSet } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useEffect, useState } from "react";
import { onCargoUpdate } from '../components/real-time-call';
import { fetchBcoNotifications, fetchTerminalNotifications, fetchTransportationNotifications } from '../components/cargo/cargo-units-client';

const selectionSet = ['cargoUnitID', 'reservationStatus', "updatedAt", "isBCONotify", "isTransportationNotify"] as const; 
export type Notifications = SelectionSet<Schema['Container']['type'], typeof selectionSet>

export function useNotifications() {

    const { user } = useAuthenticator();
    
      const [userAttributes, setUserAttributes] = useState<{ role: string; email: string }>({
        role: '',
        email: '',
      });
    
    const [userNotifications, setUserNotifications] = useState<Notifications[]>([]);
    const [refresh, setRefresh] = useState(0);

    // Fetch user attributes.
    useEffect(() => {
    async function getUserAttributes() {
      if (user) {
        try {
          const attributes = await fetchUserAttributes();
          const roleAttribute = attributes['custom:role'] ?? 'No role assigned';
          setUserAttributes({
            role: roleAttribute,
            email: attributes.email ?? 'No email found',
          });
        } catch (error) {
          console.error('Error fetching user attributes', error);
        }
      }
    }

    getUserAttributes();
    }, [user]);

    // Subscribe to updates and trigger a refresh.
    useEffect(() => {
        const updateSubscription =  onCargoUpdate.subscribe({
        next: () => setRefresh((prev) => prev + 1),
        error: (error: any) => console.warn(error),
        })
        return () => updateSubscription.unsubscribe()
    }, [])    

    // Subscribe to notifications based on user attributes and refresh state.
    useEffect(() => {
        if (!userAttributes.role) return;
        
        if (userAttributes.role === "Beneficiary Cargo Owner") {
            fetchBcoNotifications(userAttributes.email).then(items => {
                setUserNotifications(items)
            });
        } else if ((userAttributes.role === 'Trucking Operator')
            || (userAttributes.role === 'Rail Operator')
            || (userAttributes.role === 'Third Party Logistics Provider')) {

            fetchTransportationNotifications().then((list) => {
                setUserNotifications(list);
            })
        } else if (userAttributes.role === 'Terminal Operator') {

            fetchTerminalNotifications().then((list) => {
                setUserNotifications(list);
            })
        }

    }, [userAttributes, refresh]);

    return { userNotifications, userAttributes };
}

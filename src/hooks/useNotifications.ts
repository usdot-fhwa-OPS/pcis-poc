import { fetchUserAttributes } from 'aws-amplify/auth';
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useEffect, useState } from "react";

import { generateClient, SelectionSet } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { Subscription } from "rxjs";

const client = generateClient<Schema>();
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

    // Fetch user attributes
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
        const updateSubscription = client.models.Container.onUpdate().subscribe({
        next: () => {
            // Increment the refresh counter to trigger re-running the observeQuery.
            setRefresh((prev) => prev + 1);
        },
        error: (error) => console.warn(error),
        });
        return () => updateSubscription.unsubscribe();
    }, []);

    // Subscribe to notifications based on user attributes and refresh state.
    useEffect(() => {
        if (!userAttributes.role) return;
        let notisSub: Subscription;

        if (userAttributes.role === "Beneficiary Cargo Owner") {
        notisSub = client.models.Container.observeQuery({
            filter: {
            and: [
                { bcoEmail: { eq: userAttributes.email } },
                { isBCONotify: { eq: true } },
            ],
            },
        }).subscribe({
            next: ({ items }) => {
            setUserNotifications(items);
            },
        });
        } else if ((userAttributes.role === 'Trucking Operator') 
            || (userAttributes.role === 'Rail Operator')
            || (userAttributes.role === 'Third Party Logistics Provider')) {
        notisSub = client.models.Container.observeQuery({
            filter: {
            isTransportationNotify: { eq: true },
            },
        }).subscribe({
            next: ({ items }) => {
            setUserNotifications(items);
            },
        });
        } else if (userAttributes.role === 'Terminal Operator') {
        notisSub = client.models.Container.observeQuery({
            filter: {
            isTerminalNotify: { eq: true },
            },
        }).subscribe({
            next: ({ items }) => {
            setUserNotifications(items);
            },
        });
        }

        return () => notisSub.unsubscribe();
    }, [userAttributes, refresh]);

    return { userNotifications, userAttributes };
}

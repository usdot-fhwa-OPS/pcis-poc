import { createFileRoute } from '@tanstack/react-router'

import { Badge } from "../components/ui/badge";
import { Bell } from "lucide-react"

// Start new

import { fetchUserAttributes } from 'aws-amplify/auth';
import { NotificationsButton } from "../components/notifications-button/notifications-button";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useEffect, useState } from "react";

import { generateClient, SelectionSet } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { Subscription } from "rxjs";

import { Link } from "@tanstack/react-router"
import { format } from "date-fns"

const client = generateClient<Schema>();
const selectionSet = ['cargoUnitID', 'reservationStatus', "updatedAt", "isBCONotify", "isTransportationNotify"] as const; 
export type Notifications = SelectionSet<Schema['Container']['type'], typeof selectionSet> 

// End new

export const Route = createFileRoute('/notifications')({
  component: RouteComponent,
})

function RouteComponent() {

  // Start New

  const { user } = useAuthenticator();

  const [userAttributes, setUserAttributes] = useState<{ role: string; email: string }>({
    role: '',
    email: '',
  });

  const [userNotifications, setUserNotifications] = useState<Notifications[]>([]);

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


  const [refresh, setRefresh] = useState(0);

  // Subscribe to updates and trigger refresh.
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
    } else {
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

    return () => {
      notisSub.unsubscribe();
    };
  }, [userAttributes, refresh]);

  const unreadCount = userNotifications.length

  const getNotificationMessage = (role: string, notification: Notifications) => {
    if (role === "Beneficiary Cargo Owner") {
      switch (notification.reservationStatus) {
        case "Pickup Modification Requested":
          return `Modified Reservation for Cargo Unit ${notification.cargoUnitID} has been requested by transportation Coordinator. Awaiting approval by the terminal operator.`; 
        case "Pending Reservation Approval":
          return `Reservation for Cargo Unit ${notification.cargoUnitID} has been requested by transportation Coordinator. Awaiting approval by the terminal operator.`; 
        case "Pending Pick Up":
          return `Reservation for Cargo Unit ${notification.cargoUnitID} has been approved by the terminal operator.`; 
        case "unassigned":
          if (notification.isBCONotify && notification.isTransportationNotify) return `Terminal Operator has denied the reservation for Cargo unit ${notification.cargoUnitID}.`; 
          else return `Transportation Coordinator has denied the assignment for Cargo unit ${notification.cargoUnitID}.`
        case "Late for Pick Up":
          return `Terminal Operator has marked Late for Pick Up for Cargo Unit ${notification.cargoUnitID}.`; 
        
      }
    } else if ((role === 'Trucking Operator') 
          || (role === 'Rail Operator')
          || (role === 'Third Party Logistics Provider')) {
      switch (notification.reservationStatus) {
        case "Pending Transportation Coordinator Approval":
          return `Assignment of Cargo Unit ${notification.cargoUnitID} requires your approval`; 
        case "Pending Pick Up":
          return `Reservation for Cargo Unit ${notification.cargoUnitID} has been approved by terminal operator.`; 
        case "unassigned":
          return `Terminal Operator has denied the reservation for Cargo Unit ${notification.cargoUnitID}.`; 
        case "Late for Pick Up":
          return `Terminal Operator has marked Late for Pick Up for Cargo Unit ${notification.cargoUnitID}.`; 
        
      }
    } else {
      switch (notification.reservationStatus) {
        case "Pending Reservation Approval":
          return `Reservation for Cargo Unit ${notification.cargoUnitID} requires your approval`; 
        case "Pickup Modification Requested":
          return `Modified Reservation for Cargo Unit ${notification.cargoUnitID} requires your approval`; 
        
      }
    } 
  };

  // End new


  return (
    <div className="pt-6 px-16 pb-16">
      <h1 className="flex items-center gap-2 text-2xl leading-4 font-semibold text-gray-900">
        <Bell className="w-6 h-6 text-gray-700" />
        Notifications

        {unreadCount > 0 && (
          <Badge variant="destructive">{unreadCount} New</Badge>
        )}

      </h1>
      <div className="mt-[3.75rem]">
        <p>Notifications will display here.</p>
        <NotificationsButton notifications={userNotifications} role={userAttributes.role} />

        <div>

            {userNotifications.map((notification) => {
              const dateObj = new Date(notification.updatedAt);
              const formattedDate = format(dateObj, 'MM/dd/yyyy');
              const formattedTime = format(dateObj, 'hh:mm a'); 
              return (
                <div
                  key={notification.cargoUnitID}
                  className="flex items-start justify-between gap-4 p-4 border-b last:border-b-0"
                >
                  <div className="space-y-1">
                    <p className="text-sm">{getNotificationMessage(userAttributes.role, notification)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formattedDate} • {formattedTime}
                    </p>
                  </div>
                  <Link to="/reservation" className="text-blue-500 hover:underline">
                    View
                  </Link>
                </div>
              )
            })}

        </div>

      </div>
    </div>
  )
}

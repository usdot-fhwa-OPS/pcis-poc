import { createFileRoute } from '@tanstack/react-router'

import { Badge } from "../components/ui/badge";
import { Bell, Clock } from "lucide-react"

// Start new

import { fetchUserAttributes } from 'aws-amplify/auth';
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useEffect, useState } from "react";

import { generateClient, SelectionSet } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { Subscription } from "rxjs";

import { Link } from "@tanstack/react-router"
import { format, formatDistanceToNow, isAfter, subHours } from "date-fns"

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

  const notificationCount = userNotifications.length

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

  const twentyFourHoursAgo = subHours(new Date(), 24);

  // End new


  return (
    <div className="pt-6 px-16 pb-16">
      <h1 className="flex items-center gap-2 text-2xl leading-4 font-semibold text-gray-900">
        <Bell className="w-6 h-6 text-gray-700" />
        Notifications
        {notificationCount > 0 && (
          <Badge className="px-[0.75rem] py-[0.375rem] ml-4 rounded-full leading-none" variant="destructive">{notificationCount} new</Badge>
        )}
      </h1>
        {notificationCount > 0 && (
          <p className="mt-3 leading-none text-sm text-muted-foreground">
            {notificationCount} notifications
          </p>
        )}
      <div className="max-w-4xl mt-[3.75rem]">
      {userNotifications.map((notification) => {
        const dateObj = new Date(notification.updatedAt);
        const isRecent = isAfter(dateObj, twentyFourHoursAgo);
        const displayTime = isRecent
          ? formatDistanceToNow(dateObj, { addSuffix: true })
          : `${format(dateObj, 'MM/dd/yyyy')} • ${format(dateObj, 'hh:mm a')}`;

        return (
        <div
          key={notification.cargoUnitID}
          className="flex items-center justify-between gap-4 bg-white p-4 border mb-2 last:mb-0 rounded-xl shadow"
        ><div className="flex flex-col gap-1">
            <p className="font-semibold">{notification.reservationStatus}</p>
            <p className="text-sm">
              <span className="mr-2">{getNotificationMessage(userAttributes.role, notification)}</span>
              <Link to="/reservation" className="text-blue-600 hover:underline">View</Link>
            </p>
          </div>
          <div className="self-start flex items-center gap-1 text-xs text-muted-foreground text-nowrap leading-none">
            <Clock className="w-3 h-3" />
            <span key={notification.id}>{displayTime}</span>
          </div>
        </div>
        )
      })}
      </div>
    </div>
  )
}

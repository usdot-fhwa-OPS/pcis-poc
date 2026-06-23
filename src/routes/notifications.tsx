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

  const notificationCount = userNotifications.length;
  const unreadNotificationCount = 1;

  const highPriorityBadgesCount = () => {
    return [...document.querySelectorAll('div.bg-red-100')]
      .filter(el => el.textContent.trim() === 'High')
      .length;
  };

  const getNotificationMessage = (role: string, notification: Notifications) => {
    if (role === "Beneficiary Cargo Owner") {
      switch (notification.reservationStatus) {
        case "Pickup Modification Requested":
          return `The Transportation Coordinator has requested a modification to the reservation for Cargo Unit ${notification.cargoUnitID}. Awaiting approval by the Terminal Operator.`; 
        case "Pending Reservation Approval":
          return `The Transportation Coordinator has requested a reservation for Cargo Unit ${notification.cargoUnitID}. Awaiting approval by the Terminal Operator.`; 
        case "Pending Pick Up":
          return `The reservation for Cargo Unit ${notification.cargoUnitID} has been approved by the Terminal Operator.`; 
        case "unassigned":
          if (notification.isBCONotify && notification.isTransportationNotify) return `The Terminal Operator has denied the reservation for Cargo Unit ${notification.cargoUnitID}.`; 
          else return `The Transportation Coordinator has denied the assignment for Cargo Unit ${notification.cargoUnitID}.`
        case "Late for Pick Up":
          return `The Terminal Operator has marked Cargo Unit ${notification.cargoUnitID} as late for pick up.`; 
        
      }
    } else if ((role === 'Trucking Operator') 
          || (role === 'Rail Operator')
          || (role === 'Third Party Logistics Provider')) {
      switch (notification.reservationStatus) {
        case "Pending Transportation Coordinator Approval":
          return `The assignment of Cargo Unit ${notification.cargoUnitID} requires your approval.`; 
        case "Pending Pick Up":
          return `The reservation for Cargo Unit ${notification.cargoUnitID} has been approved by the Terminal Operator.`; 
        case "unassigned":
          return `The Terminal Operator has denied the reservation for Cargo Unit ${notification.cargoUnitID}.`; 
        case "Late for Pick Up":
          return `The Terminal Operator has marked Cargo Unit ${notification.cargoUnitID} as late for pick up.`; 
        
      }
    } else {
      switch (notification.reservationStatus) {
        case "Pending Reservation Approval":
          return `The reservation for Cargo Unit ${notification.cargoUnitID} requires your approval.`; 
        case "Pickup Modification Requested":
          return `The modified reservation for Cargo Unit ${notification.cargoUnitID} requires your approval.`; 
        
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
          <Badge className="px-[0.75rem] py-[0.375rem] ml-4 rounded-full leading-none" variant="destructive">{unreadNotificationCount} new</Badge>
        )}
      </h1>
      {notificationCount > 0 && (
        <div className="flex items-center gap-6 mt-3 leading-none text-sm text-muted-foreground">
          <span className="">{notificationCount} notifications</span>
          {unreadNotificationCount > 0 && (
            <span className="border-l pl-6">{unreadNotificationCount} unread</span>
          )}
          <span className="border-l pl-6">{highPriorityBadgesCount()} high priority</span>
        </div>
      )}
      <div className="max-w-4xl mt-[3.75rem]">
      {userNotifications.map((notification) => {

        const notificationTitle = () => { 
          if ((notification.reservationStatus === 'Pending Transportation Coordinator Approval') 
            || (notification.reservationStatus === 'Pending Reservation Approval') 
            || (notification.reservationStatus === 'Pickup Modification Requested')) {
              return `Reservation Approval Required`;
          } else if ((notification.reservationStatus === 'unassigned')) {
            return `Reservation Denied`;
          } else {
            return `${notification.reservationStatus}`;
          }
        };

        const notificationBadge = () => {
          if ((notificationTitle() === 'Late for Pick Up') 
            || (notificationTitle() === 'Reservation Approval Required')) {
            return(
              <Badge className="bg-red-100 hover:bg-red-100/80 border-red-300 text-red-700 rounded-full">High</Badge>
            )
          }
        };

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
            <h2 className="flex items-center gap-2 text-base font-semibold">{notificationTitle()} {notificationBadge()}</h2>
            <p className="text-sm">
              {getNotificationMessage(userAttributes.role, notification)}
              <Link to="/reservation" className="ml-2 text-blue-600 hover:underline">View</Link>
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

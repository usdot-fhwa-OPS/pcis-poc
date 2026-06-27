import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { Badge } from "../components/ui/badge";
import { Bell, CalendarCheck, Clock, Info, Settings, TriangleAlert } from "lucide-react"
import { format, formatDistanceToNow, isAfter, subHours } from "date-fns"
import { useNotifications, Notifications } from '../hooks/useNotifications';

export const Route = createFileRoute('/notifications')({
  component: RouteComponent,
})

function RouteComponent() {

  const { userNotifications, userAttributes } = useNotifications();

  const notificationCount = userNotifications.length;
  const unreadNotificationCount = 1;

  // Provides count of high priority notifications.
  const highPriorityBadgesCount = userNotifications.filter((notification) => {
    const title =
      notification.reservationStatus === "Pending Transportation Coordinator Approval" ||
      notification.reservationStatus === "Pending Reservation Approval" ||
      notification.reservationStatus === "Pickup Modification Requested"
        ? "Reservation Approval Required"
        : notification.reservationStatus === "unassigned"
        ? "Reservation Denied"
        : notification.reservationStatus;

    return title === "Late for Pick Up" || title === "Reservation Approval Required";
  }).length;

  // Get notification message content.
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
    } else if (role === 'Terminal Operator') {
      switch (notification.reservationStatus) {
        case "Pending Reservation Approval":
          return `The reservation for Cargo Unit ${notification.cargoUnitID} requires your approval.`; 
        case "Pickup Modification Requested":
          return `The modified reservation for Cargo Unit ${notification.cargoUnitID} requires your approval.`; 
        
      }
    } 
  };

  const navigate = useNavigate();

  // For relative date/time calculation in timestamp.
  const twentyFourHoursAgo = subHours(new Date(), 24);

  return (
    <div className="pt-6 px-6 sm:px-16 pb-16">
      <h1 className="flex items-center gap-2 text-2xl leading-4 font-semibold text-gray-900">
        <Bell className="w-6 h-6 text-gray-700" />
        Notifications
        {notificationCount > 0 && (
          <Badge className="px-[0.75rem] py-[0.375rem] ml-4 rounded-full leading-none" variant="destructive">{unreadNotificationCount} new</Badge>
        )}
      </h1>
      {notificationCount > 0 && (
        <div className="flex items-center gap-4 sm:gap-6 mt-3 leading-none text-sm text-muted-foreground">
          <span className="">{notificationCount} notifications</span>
          {unreadNotificationCount > 0 && (
            <span className="border-l border-gray-400 pl-4 sm:pl-6">{unreadNotificationCount} unread</span>
          )}
          {highPriorityBadgesCount > 0 && (
            <span className="border-l border-gray-400 pl-4 sm:pl-6">{highPriorityBadgesCount} high priority</span>
          )}
        </div>
      )}
      <div className="max-w-4xl mt-[3.75rem]">
        {notificationCount == 0 && (
          <div className="bg-white p-4 border rounded-xl shadow text-base">Notifications will appear here when available.</div>
        )}
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

          const notificationIcon = () => {
            if ((notificationTitle() === 'Late for Pick Up') 
              || (notificationTitle() === 'Reservation Approval Required')
              || (notificationTitle() === 'Pending Pick Up')) { // For reservation and scheduling notifications
              return(
                <span className="inline-flex rounded-full p-3 bg-blue-50">
                  <CalendarCheck className="size-4 stroke-blue-600" />
                </span>
              )
            } else if (notificationTitle() === 'Terminal Capacity Warning') { // For system notifications (future)
              return(
                <span className="inline-flex rounded-full p-3 bg-amber-50">
                  <Settings className="size-4 stroke-amber-600" />
                </span>
              )
            } else if (notificationTitle() === 'Hazardous Cargo Submission') { // For hazardous cargo notifications (future)
              return(
                <span className="inline-flex rounded-full p-3 bg-red-50">
                  <TriangleAlert className="size-4 stroke-red-600" />
                </span>
              )
            } else { // For all other notifications
              return(
                <span className="inline-flex rounded-full p-3 bg-gray-50">
                  <Info className="size-4 stroke-gray-600" />
                </span>
              )
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
            onClick={() => navigate({ to: "/reservation" })}
            className="flex flex-wrap sm:flex-nowrap items-start sm:items-center gap-4 bg-white p-4 border mb-2 last:mb-0 rounded-xl shadow cursor-pointer hover:border-blue-200 transition-colors"
          >
            {notificationIcon()}
            <div className="max-w-[calc(100%-3.5rem)] sm:max-w-none flex flex-col gap-1">
              <h2 className="flex items-center gap-2 text-base font-semibold">{notificationTitle()} {notificationBadge()}</h2>
              <p className="text-sm">{getNotificationMessage(userAttributes.role, notification)}</p>
            </div>
            <div className="ml-auto self-start flex items-center gap-1 text-xs text-muted-foreground text-nowrap leading-none">
              <Clock className="w-3 h-3" />
              <span key={notification.cargoUnitID}>{displayTime}</span>
            </div>
          </div>
          )
        })}
      </div>
    </div>
  )
}

import { createFileRoute } from '@tanstack/react-router'

import { Bell } from "lucide-react"
import { format } from "date-fns"
import { Notifications } from "../components/user-header/userHeader"

export const Route = createFileRoute('/notifications')({
  component: RouteComponent,
})

interface NotificationsButtonProps {
    notifications: Notifications[]
    role: string
}

function RouteComponent({notifications, role}: NotificationsButtonProps) {

  const unreadCount = notifications.length

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

  return (
    <div className="p-4 pt-3 pl-[4.125rem]">
      <h3 className="text-2xl font-semibold text-gray-900"><Bell className="h-6 w-6" /> Notifications</h3>
      {unreadCount > 0 && (
        <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">{unreadCount} new</span>
      )}
      <div>
            {notifications.map((notification) => {
              const dateObj = new Date(notification.updatedAt);
              const formattedDate = format(dateObj, 'MM/dd/yyyy');
              const formattedTime = format(dateObj, 'hh:mm a'); 
              return (
                <div
                  key={notification.cargoUnitID}
                  className="flex items-start justify-between gap-4 p-4 border-b last:border-b-0"
                >
                  <div className="space-y-1">
                    <p className="text-sm">{getNotificationMessage(role, notification)}</p>
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
  )
}

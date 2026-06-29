"use client"

import { Bell } from "lucide-react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader } from "../ui/dialog"
import { ScrollArea } from "../ui/scroll-area"
import { SidebarMenuItem, SidebarMenuButton, SidebarMenuBadge } from "../ui/sidebar"
import { Notifications } from '../../hooks/useNotifications';
import { Link } from "@tanstack/react-router"
import { format } from "date-fns"
interface NotificationsButtonProps {
    notifications: Notifications[]
    role: string
}

export function NotificationsButton({notifications, role}: NotificationsButtonProps) {
  const [open, setOpen] = useState(false)
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
    <>
      <SidebarMenuItem>
        <SidebarMenuButton onClick={() => setOpen(true)}>
          <Bell className="h-4 w-4" />
          <span>Notifications</span>
        </SidebarMenuButton>
        {unreadCount > 0 && (
          <SidebarMenuBadge className="bg-red-500 text-white hover:bg-red-500">{unreadCount}</SidebarMenuBadge>
        )}
      </SidebarMenuItem>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl p-0">
          <DialogHeader className="p-4 border-b">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Notifications</h2>
              {unreadCount > 0 && (
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">{unreadCount} Notifications</span>
              )}
            </div>
          </DialogHeader>
          <ScrollArea className="h-[calc(80vh-100px)]">
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
                  <Link to="/reservation" onClick={() => setOpen(false)} className="text-blue-500 hover:underline">
                    View
                  </Link>
                </div>
              )
            })}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}

"use client"

import { Bell } from "lucide-react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader } from "../ui/dialog"
import { ScrollArea } from "../ui/scroll-area"
import { SidebarMenuItem, SidebarMenuButton, SidebarMenuBadge } from "../ui/sidebar"
import { Notifications } from "../app-sidebar/app-sidebar"
import { Link } from "@tanstack/react-router"

interface NotificationsButtonProps {
    notifications: Notifications[]
    role: string
}


export function NotificationsButton({notifications, role }: NotificationsButtonProps) {
  const [open, setOpen] = useState(false)
  const unreadCount = notifications.length

  const getNotificationMessage = (role: string, notification: Notifications) => {
    if (role === "Beneficiary Cargo Owner") {
      switch (notification.bookingStatus) {
        case "Pickup Modification Requested":
          return `Modified Booking for Container ${notification.containerID} has been requested by transportation operator. Awaiting approval by the terminal operator.`;
        case "Pending Booking Approval":
          return `Booking for Container ${notification.containerID} has been requested by transportation operator. Awaiting approval by the terminal operator.`;
        case "Pending Pick Up":
          return `Booking for Container ${notification.containerID} has been approved by the terminal operator.`;
        case "unassigned":
          return `Terminal Operator has denied the booking for Container ${notification.containerID}.`;
        
      }
    } else if (role === "Transportation Operator") {
      switch (notification.bookingStatus) {
        case "Pending Transportation Operator Approval":
          return `Assignment of Container ${notification.containerID} requires your approval`;
        case "Pending Pick Up":
          return `Booking for Container ${notification.containerID} has been approved by terminal operator.`;
        case "unassigned":
          return `Terminal Operator has denied the booking for Container ${notification.containerID}.`;
        
      }
    } else {
      switch (notification.bookingStatus) {
        case "Pending Booking Approval":
          return `Booking for Container ${notification.containerID} requires your approval`;
        case "Pickup Modification Requested":
          return `Modified Booking for Container ${notification.containerID} requires your approval`;
        
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
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">{unreadCount} unread</span>
            </div>
          </DialogHeader>
          <ScrollArea className="h-[calc(80vh-100px)]">
            {notifications.map((notification) => (
              <div
                key={notification.containerID}
                className="flex items-start justify-between gap-4 p-4 border-b last:border-b-0"
              >
                <div className="space-y-1">
                  <p className="text-sm">{getNotificationMessage(role, notification)}</p>
                </div>
                <Link to="/booking" onClick={() => setOpen(false)} className="text-blue-500 hover:underline">
                  View
                </Link>
              </div>
            ))}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}


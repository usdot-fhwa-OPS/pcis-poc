"use client"

import { Bell } from "lucide-react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader } from "../ui/dialog"
import { ScrollArea } from "../ui/scroll-area"
import { Button } from "../ui/button"
import { SidebarMenuItem, SidebarMenuButton, SidebarMenuBadge } from "../ui/sidebar"

// Mock notifications data
const notifications = [
  {
    id: 1,
    message: "Terminal operator assignment is required for container YH798.",
    date: "January 12, 2024",
    time: "10:00am",
  },
  {
    id: 2,
    message: "Terminal operator assignment is required for container YH798.",
    date: "January 12, 2024",
    time: "10:00am",
  },
  {
    id: 3,
    message: "Terminal operator assignment is required for container YH798.",
    date: "January 12, 2024",
    time: "10:00am",
  },
  {
    id: 4,
    message: "Terminal operator assignment is required for container YH798.",
    date: "January 12, 2024",
    time: "10:00am",
  },
  {
    id: 5,
    message: "Terminal operator assignment is required for container YH798.",
    date: "January 12, 2024",
    time: "10:00am",
  },
  {
    id: 6,
    message: "Terminal operator assignment is required for container YH798.",
    date: "January 12, 2024",
    time: "10:00am",
  },
]

export function NotificationsButton() {
  const [open, setOpen] = useState(false)
  const unreadCount = notifications.length

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
                key={notification.id}
                className="flex items-start justify-between gap-4 p-4 border-b last:border-b-0"
              >
                <div className="space-y-1">
                  <p className="text-sm">{notification.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {notification.date} • {notification.time}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="shrink-0">
                  View
                </Button>
              </div>
            ))}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}


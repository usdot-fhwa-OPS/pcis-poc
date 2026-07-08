import React from "react"
import { FileUp, Home, Ship, User, CalendarClock, BarChart, Anchor, Container, TriangleAlert, Gauge, LogOut } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../../components/ui/sidebar"

import { cn } from "../../lib/utils"
import { useAuthenticator } from "@aws-amplify/ui-react"
import { fetchUserAttributes } from 'aws-amplify/auth'
import { useEffect, useState } from "react"
import { NotificationsButton } from "../notifications-button/notifications-button"
import { generateClient, SelectionSet } from 'aws-amplify/data'
import type { Schema } from '../../../amplify/data/resource'
import { useNavigate, useRouterState } from "@tanstack/react-router"
import { fetchBcoNotifications, fetchTerminalNotifications, fetchTransportationNotifications, onCargoUpdate } from "../cargo/cargo-units-client"

const client = generateClient<Schema>()

const selectionSet = ['cargoUnitID', 'reservationStatus', "updatedAt", "isBCONotify", "isTransportationNotify"] as const
export type Notifications = SelectionSet<Schema['Container']['type'], typeof selectionSet>

type NavItem = { title: string; url: string; icon: React.ElementType }

const itemsByRole: Record<string, NavItem[]> = {
  "Terminal Operator": [
    { title: "Home", url: "/", icon: Home },
    { title: "Capacity Planning", url: "/capacity", icon: Gauge },
    { title: "Vessel Activity", url: "/vessel-activity", icon: Ship },
    { title: "Available Users", url: "/operators", icon: User },
    { title: "Upload Manifest", url: "/import", icon: FileUp },
    { title: "Upcoming Cargo", url: "/cargo", icon: Container },
    { title: "Cargo Reservations", url: "/reservation", icon: CalendarClock },
    { title: "Hazardous Cargo", url: "/hazardous-cargo", icon: TriangleAlert },
    { title: "Berth Reservations", url: "/berth-vessel", icon: Anchor },
    { title: "Analytics", url: "/analytics", icon: BarChart },
  ],
  "Beneficiary Cargo Owner": [
    { title: "Home", url: "/", icon: Home },
    { title: "Cargo Reservations", url: "/reservation", icon: CalendarClock },
    { title: "Analytics", url: "/analytics", icon: BarChart },
  ],
  "Vessel Agent": [
    { title: "Request Berth", url: "/berth-requests", icon: Ship },
    { title: "Vessel Activity", url: "/vessel-activity", icon: Ship },
    { title: "Berth Reservations", url: "/berth-vessel", icon: Anchor },
    { title: "Hazardous Cargo", url: "/hazardous-cargo", icon: TriangleAlert },
    { title: "Analytics", url: "/analytics", icon: BarChart },
  ],
  "Trucking Operator": [
    { title: "Home", url: "/", icon: Home },
    { title: "Cargo Reservations", url: "/reservation", icon: CalendarClock },
  ],
  "Rail Operator": [
    { title: "Home", url: "/", icon: Home },
    { title: "Cargo Reservations", url: "/reservation", icon: CalendarClock },
  ],
  "Third Party Logistics Provider": [
    { title: "Home", url: "/", icon: Home },
    { title: "Cargo Reservations", url: "/reservation", icon: CalendarClock },
  ],
}

export function AppSidebar() {
  const { user, signOut } = useAuthenticator()
  const navigate = useNavigate()
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  const [userAttributes, setUserAttributes] = useState<{ role: string; email: string }>({
    role: '',
    email: '',
  })

  const [userNotifications, setUserNotifications] = useState<Notifications[]>([])

  useEffect(() => {
    async function getUserAttributes() {
      if (user) {
        try {
          const attributes = await fetchUserAttributes()
          const roleAttribute = attributes['custom:role'] ?? 'No role assigned'
          setUserAttributes({
            role: roleAttribute,
            email: attributes.email ?? 'No email found',
          })
        } catch (error) {
          console.error('Error fetching user attributes', error)
        }
      }
    }
    getUserAttributes()
  }, [user])

  const filteredItems = itemsByRole[userAttributes.role] ?? []

  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    const updateSubscription =  onCargoUpdate.subscribe({
      next: () => setRefresh((prev) => prev + 1),
      error: (error: any) => console.warn(error),
    })
    return () => updateSubscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!userAttributes.role) return

    if (userAttributes.role === "Beneficiary Cargo Owner") {
      fetchBcoNotifications(userAttributes.email).then(items => {
        setUserNotifications(items)
      });

    } else if (
      userAttributes.role === 'Trucking Operator' ||
      userAttributes.role === 'Rail Operator' ||
      userAttributes.role === 'Third Party Logistics Provider'
    ) {
      fetchTransportationNotifications().then((list) =>{
        setUserNotifications(list);
      })
      
    } else {
      fetchTerminalNotifications().then((list) =>{
        setUserNotifications(list);
      })
       
    }

    //return () => notisSub.unsubscribe()
  }, [userAttributes, refresh])

  const handleSignOut = () => {
    signOut()
    navigate({ to: "/" })
  }

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarContent className="bg-white">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 py-4">
            PCIS POC
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1 px-2">
              {filteredItems.map((item) => {
                const isActive = item.url === "/"
                  ? currentPath === "/"
                  : currentPath.startsWith(item.url)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={cn(
                        "h-10 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-gray-900 text-white hover:bg-gray-900 hover:text-white"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      )}
                    >
                      <a href={item.url}>
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
              <NotificationsButton notifications={userNotifications} role={userAttributes.role} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-white border-t border-gray-100 p-3">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 h-10 px-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Logout</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  )
}

import React from "react"
import { FileUp, Home, Ship, User, CalendarClock, BarChart, Anchor, Container, TriangleAlert, Gauge } from "lucide-react"

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

import { Button } from "../ui/button";

import { useAuthenticator } from "@aws-amplify/ui-react";

import { fetchUserAttributes } from 'aws-amplify/auth';
import { useEffect, useState } from "react";
import { NotificationsButton } from "../notifications-button/notifications-button";

import { generateClient, SelectionSet } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { Subscription } from "rxjs";
import { useNavigate } from "@tanstack/react-router";

const client = generateClient<Schema>();

const selectionSet = ['cargoUnitID', 'reservationStatus', "updatedAt", "isBCONotify", "isTransportationNotify"] as const; 
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
  const { user, signOut } = useAuthenticator();
  const navigate = useNavigate();

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

  const filteredItems = itemsByRole[userAttributes.role] ?? []

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
  
  const handleSignOut = () => {
    signOut();
    navigate({ to: "/" });
  };

  return (
    <Sidebar>
      <SidebarContent className="bg-white">
        <SidebarGroup>
          <SidebarGroupLabel>PCIS POC</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <NotificationsButton notifications={userNotifications} role={userAttributes.role} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarFooter>
          <Button onClick={handleSignOut} variant={"destructive"}>Sign out</Button>
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  )
}

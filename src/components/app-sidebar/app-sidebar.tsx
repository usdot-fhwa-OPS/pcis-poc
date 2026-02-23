import { FileUp, Home, Ship, User , CalendarClock, BarChart, Anchor } from "lucide-react"

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


// Menu items.
const items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Available Operators",
    url: "/operators",
    icon: User,
  },
  {
    title: "Import Stow Plan",
    url: "/import",
    icon: FileUp,
  },
  {
    title: "Upcoming Cargo",
    url: "/cargo",
    icon: Ship,
  },
  {
    title: "Reservation Status",
    url: "/reservation",
    icon: CalendarClock,
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart,
  },
    {
    title: "Berth Reservation",
    url: "/analytics",
    icon: Anchor,
  },
]

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

  // Define which menu items are allowed for limited roles.
  const allowedForLimitedRoles = ["Home", "Reservation Status", "Notifications"];

  // Filter menu items based on the custom role.
  const filteredItems = items.filter((item) => {
    if (userAttributes.role === "Terminal Operator") {
      // Terminal Operators have access to all items.
      return true;
    }

    if (
      (userAttributes.role === 'Trucking Operator') 
          || (userAttributes.role === 'Rail Operator')
          || (userAttributes.role === 'Third Party Logistics Provider') ||
      userAttributes.role === "Beneficiary Cargo Owner"
    ) {
      // These roles only have access to the allowed items.
      return allowedForLimitedRoles.includes(item.title);
    }

    // If role is undefined or unrecognized, do not show any items.
    return false;
  });

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
      <SidebarContent>
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

import { FileUp, Home, Ship, User , CalendarClock } from "lucide-react"

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

const client = generateClient<Schema>();

const selectionSet = ['containerID', 'bookingStatus'] as const;
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
    title: "Booking Status",
    url: "/booking",
    icon: CalendarClock,
  },
]

export function AppSidebar() {
  const { user, signOut } = useAuthenticator();

  const [userAttributes, setUserAttributes] = useState<{ role: string; email: string }>({
    role: '',
    email: '',
  });
  let notisSub: Subscription;

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
  const allowedForLimitedRoles = ["Home", "Booking Status", "Notifications"];

  // Filter menu items based on the custom role.
  const filteredItems = items.filter((item) => {
    if (userAttributes.role === "Terminal Operator") {
      // Terminal Operators have access to all items.
      return true;
    }

    if (
      userAttributes.role === "Transportation Operator" ||
      userAttributes.role === "Beneficiary Cargo Owner"
    ) {
      // These roles only have access to the allowed items.
      return allowedForLimitedRoles.includes(item.title);
    }

    // If role is undefined or unrecognized, do not show any items.
    return false;
  });

  useEffect(() => {
    if (!userAttributes.role) return;
    console.log(userAttributes.role)
    if (userAttributes.role == "Beneficiary Cargo Owner") {
      console.log("I AM BCO")
      notisSub = client.models.Container.observeQuery(
        {
          filter: {
            and: [
              {
                bcoEmail: { eq: userAttributes.email }
              },
              {
                isBCONotify: {
                  eq: true
                }
              },
            ]
          }
        }
      ).subscribe({  
        next: ({ items }) => {
          setUserNotifications(items);
          console.log(items)
        },
      });
    } else if (userAttributes.role == "Transportation Operator") {
      console.log("I AM TRANSPORTATION")
      notisSub = client.models.Container.observeQuery(
        {
          filter: {
            and: [
              {
                transopEmail: { eq: userAttributes.email }
              },
              {
                isTransportationNotify: {
                  eq: true
                }
              },
            ]
          }
        }
      ).subscribe({  
        next: ({ items }) => {
          setUserNotifications(items);
          console.log(items)
        },
      });
    } else {
      console.log("I AM TERMINAL OP")
      notisSub = client.models.Container.observeQuery(
        {
          filter: {
            isTerminalNotify: {
              eq: true
            }
          }
        }
      ).subscribe({  
        next: ({ items }) => {
          setUserNotifications(items);
        },
      });
    }
    
  }, [userAttributes]);
  
  const handleSignOut = () => {
    if (notisSub) {
      notisSub.unsubscribe();
    }
    signOut();
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

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
    title: "Import BAPLIE Data",
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
  // {
  //   title: "Notifications",
  //   url: "/notifications",
  //   icon: Bell,
  // },
]

export function AppSidebar() {
  const { user, signOut } = useAuthenticator();

  const [role, setRole] = useState<{ role: string }>({ role: '' });

  useEffect(() => {
    async function getRole() {
      if (user) {
        try {
          // fetchUserAttributes returns an array of objects with Name and Value properties.
          const attributes = await fetchUserAttributes();
          const roleAttribute = attributes['custom:role'] ?? 'No role assigned';
          setRole({ role: roleAttribute });
        } catch (error) {
          console.error("Error fetching user attributes", error);
        }
      }
    }

    getRole();
  }, [user, fetchUserAttributes]);

  // Define which menu items are allowed for limited roles.
  const allowedForLimitedRoles = ["Home", "Booking Status", "Notifications"];

  // Filter menu items based on the custom role.
  const filteredItems = items.filter((item) => {
    if (role.role === "Terminal Operator") {
      // Terminal Operators have access to all items.
      return true;
    }

    if (
      role.role === "Transportation Operator" ||
      role.role === "Beneficiary Cargo Owner"
    ) {
      // These roles only have access to the allowed items.
      return allowedForLimitedRoles.includes(item.title);
    }

    // If role is undefined or unrecognized, do not show any items.
    return false;
  });

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
              <NotificationsButton />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarFooter>
          <Button onClick={signOut} variant={"destructive"}>Sign out</Button>
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  )
}

import { createFileRoute } from '@tanstack/react-router'
import { RequestedBerthTable } from "../components/berth-requests/requested-berth-table.tsx"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs.tsx"
import { Button } from "../components/ui/button.tsx"
import { fetchUserAttributes } from 'aws-amplify/auth';
import { useEffect, useState } from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";

import { BerthRequest } from "../components/berth-requests/berth-request.tsx";
import { BerthAvailability } from "../components/berth/berth-availability"

export const Route = createFileRoute('/reservation')({
  component: RouteComponent,
})

export const sampleBerthRequests: BerthRequest[] = [/* 
  {
    id: "BR-1001",
    vesselId: "VSL-7782",
    terminalName: "Port of Los Angeles - Terminal 3",
    terminalEmail: "t3.ops@portla.gov",
    eta: "2026-04-18T08:30:00Z",
    etd: "2026-04-19T22:00:00Z",
    requestedAt: "2026-04-15T14:12:00Z",
  },
  {
    id: "BR-1002",
    vesselId: "VSL-5521",
    terminalName: "Port of Long Beach - Pier A",
    terminalEmail: "piera@polb.com",
    eta: "2026-04-20T05:00:00Z",
    etd: "2026-04-21T18:30:00Z",
    requestedAt: "2026-04-16T09:45:00Z",
  },
  {
    id: "BR-1003",
    vesselId: "VSL-9934",
    terminalName: "Port of New York - Red Hook Terminal",
    terminalEmail: "ops@redhookterminals.com",
    eta: "2026-04-22T11:15:00Z",
    etd: "2026-04-23T23:00:00Z",
    requestedAt: "2026-04-16T12:20:00Z",
  },
  {
    id: "BR-1004",
    vesselId: "VSL-6610",
    terminalName: "Port of Houston - Bayport Terminal",
    terminalEmail: "bayport.ops@porthouston.com",
    eta: "2026-04-19T16:45:00Z",
    etd: "2026-04-20T20:15:00Z",
    requestedAt: "2026-04-14T18:05:00Z",
  },
  {
    id: "BR-1005",
    vesselId: "VSL-4407",
    terminalName: "Port of Seattle - Terminal 18",
    terminalEmail: "t18@nwseaportalliance.com",
    eta: "2026-04-21T07:00:00Z",
    etd: "2026-04-22T19:30:00Z",
    requestedAt: "2026-04-16T07:55:00Z",
  },
{
    id: "BR-1006",
    vesselId: "VSL-8123",
    terminalName: "Port of Miami - Dodge Island",
    terminalEmail: "ops@pomto.com",
    eta: "2026-04-23T06:00:00Z",
    etd: "2026-04-24T17:30:00Z",
    requestedAt: "2026-04-17T10:15:00Z",
  },
  {
    id: "BR-1007",
    vesselId: "VSL-2745",
    terminalName: "Port of Savannah - Garden City Terminal",
    terminalEmail: "gct@gaa.com",
    eta: "2026-04-24T09:45:00Z",
    etd: "2026-04-25T21:00:00Z",
    requestedAt: "2026-04-17T11:20:00Z",
  },
  {
    id: "BR-1008",
    vesselId: "VSL-6678",
    terminalName: "Port of Oakland - TraPac Terminal",
    terminalEmail: "trapac@oakport.com",
    eta: "2026-04-25T13:00:00Z",
    etd: "2026-04-26T23:15:00Z",
    requestedAt: "2026-04-17T08:40:00Z",
  },
  {
    id: "BR-1009",
    vesselId: "VSL-9901",
    terminalName: "Port of Charleston - Wando Welch Terminal",
    terminalEmail: "wwt@scspa.com",
    eta: "2026-04-26T04:30:00Z",
    etd: "2026-04-27T16:00:00Z",
    requestedAt: "2026-04-18T06:25:00Z",
  },
  {
    id: "BR-1010",
    vesselId: "VSL-4432",
    terminalName: "Port of Tacoma - Husky Terminal",
    terminalEmail: "husky@nwseaportalliance.com",
    eta: "2026-04-27T10:10:00Z",
    etd: "2026-04-28T20:45:00Z",
    requestedAt: "2026-04-18T09:10:00Z",
  },
  {
    id: "BR-1011",
    vesselId: "VSL-1256",
    terminalName: "Port of Norfolk - Norfolk International Terminal",
    terminalEmail: "nit@portofvirginia.com",
    eta: "2026-04-28T07:20:00Z",
    etd: "2026-04-29T19:00:00Z",
    requestedAt: "2026-04-18T12:00:00Z",
  },
  {
    id: "BR-1012",
    vesselId: "VSL-7789",
    terminalName: "Port of Baltimore - Seagirt Terminal",
    terminalEmail: "seagirt@mpa.maryland.gov",
    eta: "2026-04-29T05:50:00Z",
    etd: "2026-04-30T18:10:00Z",
    requestedAt: "2026-04-18T14:35:00Z",
  },
  {
    id: "BR-1013",
    vesselId: "VSL-3344",
    terminalName: "Port of New Orleans - Napoleon Avenue Terminal",
    terminalEmail: "napoleon@portno.com",
    eta: "2026-04-30T08:15:00Z",
    etd: "2026-05-01T22:30:00Z",
    requestedAt: "2026-04-19T07:45:00Z",
  },
  {
    id: "BR-1014",
    vesselId: "VSL-5567",
    terminalName: "Port of Jacksonville - Blount Island Terminal",
    terminalEmail: "blount@jaxport.com",
    eta: "2026-05-01T11:00:00Z",
    etd: "2026-05-02T23:00:00Z",
    requestedAt: "2026-04-19T10:05:00Z",
  },
  {
    id: "BR-1015",
    vesselId: "VSL-8890",
    terminalName: "Port of Philadelphia - Packer Avenue Marine Terminal",
    terminalEmail: "packer@philaport.com",
    eta: "2026-05-02T06:40:00Z",
    etd: "2026-05-03T17:20:00Z",
    requestedAt: "2026-04-19T13:25:00Z",
  },   */
];

function RouteComponent() {
  const { user } = useAuthenticator();
  const [isOpen, setIsOpen] = useState(false);
  
  const handleOpen = () => {
    setIsOpen(!isOpen);
  };

  const [userAttributes, setUserAttributes] = useState<{ role: string; email: string }>({
    role: '',
    email: '',
  });

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

  if (userAttributes.role === "Terminal Operator") {
    return (
      <div className="w-xl max-w-9/10">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold">Berth Reservations</h1>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" type="button">
              Add New Berth Request
            </Button>
            <Button type="button" onClick={() => handleOpen()}>
              Set Berth Availability
            </Button>
          </div>
          <BerthAvailability isDialogOpen={isOpen} handleCloseDialog={() => setIsOpen(false)} />
        </div>
        <br/>
        <Tabs defaultValue="requested" className="">
          <div>
            <TabsList className="mb-4 flex w-full justify-start gap-x-4">
                <TabsTrigger value="requested">Requested</TabsTrigger>
                <TabsTrigger value="modification">Modification Requested</TabsTrigger>
                <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </div>
          <div className="w-xl max-w-9/10">
            <TabsContent value="requested">
              {sampleBerthRequests.length > 0 ? (
                  <RequestedBerthTable
                    data={sampleBerthRequests}
                    userRole="VESSEL_AGENT"
                    onView={(id) => console.log("view berth request:", id)}
                    onModify={(id) => console.log("view berth request:", id)}
                    onDelete={(id) => console.log("view berth request:", id)}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    There are no pending berth requests.
                  </p>
                )}           
            </TabsContent>
            <TabsContent value="modification">
            </TabsContent>
            <TabsContent value="ongoing">
            </TabsContent>
            <TabsContent value="completed">
            </TabsContent>
            <TabsContent value="add_new_berth_request">
            </TabsContent>            
            <TabsContent value="berth_availability">
               <BerthAvailability isDialogOpen={isOpen} handleCloseDialog={() => setIsOpen(false)} />
            </TabsContent>
          </div>         
        </Tabs>       
      </div>
    );
  }
}

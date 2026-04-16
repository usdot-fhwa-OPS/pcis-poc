import { createFileRoute } from '@tanstack/react-router'
//import {TerminalBookingsTable} from "../components/terminal-bookings/terminal-bookings-table.tsx"
import { RequestedBerthTable } from "../components/berth-requests/requested-berth-table.tsx"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs.tsx"
//import { toast } from "sonner"
import { fetchUserAttributes } from 'aws-amplify/auth';
import { useEffect, useState } from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";

import { BerthRequest } from "../components/berth-requests/berth-request.tsx";

//Three Imports needed for Amplify Data Queries and CRUD methods
import { generateClient, SelectionSet } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

import { BerthAvailability } from "../components/berth/berth-availability"

const client = generateClient<Schema>();

export const Route = createFileRoute('/reservation')({
  component: RouteComponent,
})

//Define the selection of data that will be used for the table
//const selectionSetTerminalOPUpcoming = ['vesselID', 'cargoUnitID', 'origin', 'bcoName', 'bcoEmail', 'transopName', 'transopEmail','reservationDate','reservationTime','reservationStatus', 'flag'] as const; 
const selectionSetTerminalOPOngoing = ['vesselID', 'cargoUnitID', 'origin', 'bcoName', 'bcoEmail', 'transopName', 'transopEmail','reservationDate','reservationTime','reservationStatus', 'flag'] as const; 

export type TerminalOPOngoingBookings= SelectionSet<Schema['Container']['type'], typeof selectionSetTerminalOPOngoing >

//const selectionSetBerthReservations = ['id','vesselId','terminalName','terminalEmail','eta','etd','requestedAt'] as const;
//export type BerthReservations = SelectionSet<Schema['Container']['type'], typeof selectionSetBerthReservations >

export const sampleBerthRequests: BerthRequest[] = [
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
];

//Define the selection of data that will be used for the table
//TBD
/* export interface BerthRequest {
  id: string
  vesselId: string
  terminalName: string
  terminalEmail: string
  eta: string
  etd: string
  requestedAt: string
} */

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

    useEffect(() => {
      const createSubscription = client.models.Container.onCreate().subscribe({
        next: () => {
          // Increment the refresh counter to trigger re-running the observeQuery.
          setRefresh((prev) => prev + 1);
          console.log("CREATED")
        },
        error: (error) => console.warn(error),
      });
      return () => createSubscription.unsubscribe();
    }, []);
 
  // Fetch containers on initial mount and when role/email changes
  useEffect(() => {
    //fetchterminal_operator_requested();
  }, [userAttributes.role, refresh]);

  //getting Data
  //const [terminalopBookingsupcoming, setData] = useState<TerminalOPOngoingBookings[]>([])

  //Fetch the data from the database
/*   const fetchterminal_operator_requested = async () => {
    //Query the data from the database with selection set and auth mode (always apiKey)
    const { data: cargo } = await client.models.Container.list({
      selectionSet:selectionSetTerminalOPUpcoming ,
      authMode: 'apiKey',
      filter: {
        reservationStatus: {
          eq: 'Pending Reservation Approval'
        }
      }
    });
    setData(cargo);
  }
 */
//Update Terminal Operator Booking
/* async function updateBooking(id: string, status: string, reservationDate?: string, reservationTime?: string): Promise<boolean> {
  if (!navigator.onLine) {
    console.error("No internet connection. Update not submitted. Please check your connection and try again.");
    toast.error("No internet connection. Update not submitted. Please check your connection and try again.");
    return false; // Explicitly return false when offline
  }

  try {
    let updatePayload: any = { cargoUnitID: id, reservationStatus: status };

    if (status === "unassigned") {
      Object.assign(updatePayload, {
        transopName: "",
        transopEmail: "",
        assignmentDate: "",
        reservationDate: "",
        reservationTime: "",
        resApprovalDate: "",
        resLatestUpdateDate: "",
        modifiedReservationDate: "",
        modifiedReservationTime:"",
        isTerminalNotify: false,
        isTransportationNotify: true,
        isBCONotify: true,
      });
    } else if (reservationDate) {
      Object.assign(updatePayload, {
        resApprovalDate: new Date().toLocaleDateString("en-US"),
        reservationDate,
        reservationTime,
        modifiedReservationDate: "",
        modifiedReservationTime: "",
        isTerminalNotify: false,
        isBCONotify: true,
        isTransportationNotify: true,
      });
    } else {
      //Approving a Booking -> Pending Pick Up
      Object.assign(updatePayload, {
        resApprovalDate: new Date().toLocaleDateString("en-US"),
        isTerminalNotify: false,
        isBCONotify: true,
        isTransportationNotify: true,
      });
    }

    const { data: updatedContainerStatus } = await client.models.Container.update(updatePayload);
    
    console.log("Updated booking status:", updatedContainerStatus);
    toast.success("Booking status updated successfully");

    // Refresh relevant data after successful update
    await fetchterminal_operator_requested();

    return true;
  } catch (error) {
    console.error("Error updating booking status:", error);
    toast.error("Error updating booking status. Please try again.");
    return false; // Explicitly return false when the update fails
  }
}   */

useEffect(() => {
  //fetchterminal_operator_requested();
}, [userAttributes.role, refresh]);

  if (userAttributes.role === "Terminal Operator") {
    return (
      <div className="w-xl max-w-9/10">
        <h1 className="text-2xl font-bold text-left">Berth Reservations</h1>
        <br/>
        <Tabs defaultValue="requested" className="">
          <div>
            <TabsList className="mb-4 flex w-full justify-start gap-x-4">
                <TabsTrigger value="requested">Requested</TabsTrigger>
                <TabsTrigger value="modification">Modification Requested</TabsTrigger>
                <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="add_new_berth_request">Add New Berth Request</TabsTrigger>
                <TabsTrigger value="berth_availability" onClick={() => handleOpen()}>Set Berth Availability</TabsTrigger>
            </TabsList>
          </div>
          <div className="w-xl max-w-9/10">
            <TabsContent value="requested">
              <RequestedBerthTable data={sampleBerthRequests} userRole="VESSEL_AGENT" 
                                   onView={(id) => console.log("view berth request:", id)}
                                   onModify={(id) => console.log("view berth request:", id)}
                                   onDelete={(id) => console.log("view berth request:", id)} />
              {/* <RequestedBerthTable data={terminalopBookingsupcoming} status="Requested" meta={{updateBooking}} /> */}
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

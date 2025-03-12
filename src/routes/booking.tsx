import { createFileRoute } from '@tanstack/react-router'
import {TerminalBookingsTable,TerminalBookingsCompleted} from "../components/terminal-bookings/terminal-bookings-table.tsx"
import {TransportationBookingsTableUpcoming,  TransportationBookingsTableCompleted,TransportationBookingsTableOngoing} from "../components/transportation_bookings/transportation-bookings-table.tsx"
import {BcoBookingsTableUpcoming,  BcoBookingsTableCompleted,BcoBookingsTableOngoing} from "../components/bco_bookings/bco-bookings-table.tsx"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs.tsx"
import { toast } from "sonner"
import { fetchUserAttributes } from 'aws-amplify/auth';
import { useEffect, useState } from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";

//Three Imports needed for Amplify Data Queries and CRUD methods
import { generateClient, SelectionSet } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

export const Route = createFileRoute('/booking')({
  component: RouteComponent,
})

//Define the selection of data that will be used for the table
const selectionSetTransOpUpcomingBookings = ['vesselID', 'containerID', 'origin', 'bcoName', 'bcoEmail', 'transopName', 'transopEmail', 'assignmentDate', 'bookingStatus','flag'] as const;
//Create a type based on your selectionSet that will be later used for the columns.tsx file of the able
export type TransOpUpcomingBookings = SelectionSet<Schema['Container']['type'], typeof selectionSetTransOpUpcomingBookings>

const selectionSetTransOpOngoingBookings = ['vesselID', 'containerID', 'origin', 'bcoName', 'bcoEmail', 'transopName', 'transopEmail', 'bookingDate', 'bookingTime', 'bookingStatus', 'flag', 'containerStatus'] as const;
export type TransOpOngoingBookings = SelectionSet<Schema['Container']['type'], typeof selectionSetTransOpOngoingBookings>

const selectionSetTerminalOPUpcoming = ['vesselID', 'containerID', 'origin', 'bcoName', 'bcoEmail', 'transopName', 'transopEmail','bookingDate','bookingTime','bookingStatus', 'flag'] as const;

const selectionSetTerminalOpModified = ['vesselID', 'containerID', 'origin', 'bcoName', 'bcoEmail', 'transopName', 'transopEmail','bookingDate','bookingTime', 'bookingStatus', 'modifiedBookingDate', 'modifiedBookingTime'] as const;

export type TerminalOpModifiedBookings = SelectionSet<Schema['Container']['type'], typeof selectionSetTerminalOpModified>
//Define the selection of data that will be used for the table
const selectionSetBCOUpcomingBookings = ['vesselID', 'containerID', 'origin', 'destination', 'bcoName', 'bcoEmail', 'transopName', 'transopEmail', 'containerStatus','arrivalDate', 'flag'] as const;
//Create a type based on your selectionSet that will be later used for the columns.tsx file of the able

const selectionSetTerminalOPOngoing = ['vesselID', 'containerID', 'origin', 'bcoName', 'bcoEmail', 'transopName', 'transopEmail','bookingDate','bookingTime','bookingStatus', 'flag'] as const;
export type BCOUpcomingBookings = SelectionSet<Schema['Container']['type'], typeof selectionSetBCOUpcomingBookings>

//Create a type based on your selectionSet that will be later used for the columns.tsx file of the able
export type TerminalOPUpcomingBookings= SelectionSet<Schema['Container']['type'], typeof selectionSetTerminalOPUpcoming>

export type TerminalOPOngoingBookings= SelectionSet<Schema['Container']['type'], typeof selectionSetTerminalOPOngoing >

const selectionSetBCOOngoing = ['vesselID', 'containerID', 'origin','destination', 'bcoName', 'bcoEmail', 'transopName', 'transopEmail','bookingDate','bookingApprovalDate','bookingStatus', 'bookingPickupDate','flag', 'updatedAt'] as const;

export type BCOOngoingBooking= SelectionSet<Schema['Container']['type'], typeof selectionSetBCOOngoing>

const selectionSetBCOCompleted = ['vesselID', 'containerID', 'origin', 'bcoName', 'bcoEmail', 'transopName', 'transopEmail','bookingDate','bookingApprovalDate','bookingStatus','destination', 'bookingPickupDate','flag'] as const;

export type BCOCompletedBooking= SelectionSet<Schema['Container']['type'], typeof selectionSetBCOCompleted>

//Define the selection of data that will be used for the table
const selectionSetTransportation_CompletedData = [ 
  'vesselID',
  'containerID',
  'origin',
  'bcoName',
  'bcoEmail',
  'transopName',
  'transopEmail',
  'bookingDate',
  'bookingApprovalDate',
  'bookingStatus',
  'bookingPickupDate',
  'bookingTime',
] as const;

//Define the selection of data that will be used for the table
const selectionSetTerminal_CompletedData = [ 
  'vesselID',
  'containerID',
  'origin',
  'bcoName',
  'bcoEmail',
  'transopName',
  'transopEmail',
  'bookingDate',
  'bookingApprovalDate',
  'bookingStatus',
  'bookingPickupDate',
  'bookingTime',
] as const;

//Create a type based on your selectionSet that will be later used for the columns.tsx file of the able
export type TransOperatorCompletedBookings = SelectionSet<Schema['Container']['type'], typeof selectionSetTransportation_CompletedData>;

//Create a type based on your selectionSet that will be later used for the terminal-bookings/columns.tsx file of the able
export type TermOperatorCompletedBookings = SelectionSet<Schema['Container']['type'], typeof selectionSetTerminal_CompletedData>;

function RouteComponent() {
  const { user } = useAuthenticator();

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

    async function getPortCapacity() {
      try {
        const { data: limit } = await client.models.Limit.get(
          {id: '7bde2cc5-23dc-4f46-b6d9-502133cc2e8c'},
          {
            authMode: 'apiKey',
          }
        );
        
        if (limit) {
          return limit.portCapacity;
        }
      } catch (error) {
        console.error('Error fetching booking limit', error);
      }
  }

  async function getBookingsAmount(bookingDate: string) {
    try {
      const { data: bookings } = await client.models.Container.list({
        authMode: 'apiKey',
        filter: {
          bookingDate: {eq: bookingDate}
        },  
      });
      if (bookings) {
        return bookings.length;
      }
    } catch (error) {
      console.error('Error fetching bookings', error);
    }
  }
    

  // State for Transportation Operator Completed bookings
  const [Transportation_CompletedData, setTransportation_CompletedData] = useState<TransOperatorCompletedBookings[]>([]);
  
  
  async function fetchTransOperatorCBookingsContainers() {
    if (userAttributes.role === 'Transportation Operator' && userAttributes.email) {
      try {
        const { data: cargo } = await client.models.Container.list({
          selectionSet:selectionSetTransportation_CompletedData,
          authMode: 'apiKey',
          filter: {
            and: [
              {
                transopEmail: { eq: userAttributes.email }
              },
              {
                bookingStatus: { eq: 'Picked Up' }
              }
            ]
          },
        });
        setTransportation_CompletedData(cargo);
      } catch (error) {
        console.error('Error fetching completed bookings:', error);
      }
    }
  }

  // Fetch containers on initial mount and when role/email changes
  useEffect(() => {
    if (userAttributes.email) {
      fetchTransOperatorCBookingsContainers();
    }
  }, [userAttributes.role, userAttributes.email]);  // Updates when email changes
  

  // State for Terminal Operator Completed bookings
  const [Terminal_CompletedData, setTerminal_CompletedData] = useState<TermOperatorCompletedBookings[]>([]);
  
  async function fetchTermOperatorCBookingsContainers() {
    if (userAttributes.role === 'Terminal Operator') {
      try {
        const { data: cargo } = await client.models.Container.list({
          selectionSet:selectionSetTerminal_CompletedData,
          authMode: 'apiKey',
          filter: {
                bookingStatus: { 
                  eq: 'Picked Up' 
                }
          },
        });
        setTerminal_CompletedData(cargo);
      } catch (error) {
        console.error('Error fetching completed bookings:', error);
      }
    }
  }

  // Fetch containers on initial mount and when role changes
  useEffect(() => {
    if (userAttributes.role) {
      fetchTermOperatorCBookingsContainers();
    }
  }, [userAttributes.role]);

  // State for BCO upcoming bookings
  const [bcoUpcomingBookings, setBcoUpcomingBookings] = useState<BCOUpcomingBookings[]>([]);

  // Move fetchContainers outside of useEffect so it can be reused
  async function fetchContainers() {
    if (userAttributes.role === 'Beneficiary Cargo Owner') {
      try {
        const { data: cargo } = await client.models.Container.list({
          filter: {
            and: [
              {
                bcoEmail: { eq: userAttributes.email }
              },
              {
                bookingStatus: { eq: 'unassigned' }
              }
            ]
          },
          selectionSet: selectionSetBCOUpcomingBookings,
          authMode: 'apiKey',
        });
        setBcoUpcomingBookings(cargo);
      } catch (error) {
        console.error('Error fetching containers:', error);
      }
    }
  }



  //fetch complted BCOBokkings

  const [bcocompletedBookings, setBcoCompletedBookings] = useState<BCOCompletedBooking[]>([]);

  // Move fetchContainers outside of useEffect so it can be reused
  async function fetch_bco_completed() {
   
      try{
      const { data: cargo } = await client.models.Container.list({
        selectionSet:selectionSetBCOCompleted ,
        authMode: 'apiKey',
        filter: {

          and: [
            {
              bcoEmail: { eq: userAttributes.email }
            },
            {
              bookingStatus: {
                eq: 'Picked Up'
              }
            }
          ]
     
        }
      });
      setBcoCompletedBookings(cargo);
    }
    catch(error )
    {console.error('Error fetching BCO Completed:', error);

    }
    
  
    //Fetch the data on the first render

  }


  // Fetch containers on initial mount and when role/email changes
  useEffect(() => {
    fetchContainers();
    fetch_bco_completed();
    fetchterminal_operator_requested();
  }, [userAttributes.role]);

  const [transOpUpcomingBookings, setTransOpUpcomingBookings] = useState<TransOpUpcomingBookings[]>([]);

  async function fetchTransOpUpcoming() {
    if (userAttributes.role === 'Transportation Operator') {
      try {
        const { data: cargo } = await client.models.Container.list({
          filter: {
            and: [
              {
                transopEmail: { eq: userAttributes.email }
              },
              {
                bookingStatus: { eq: 'Pending Transportation Operator Approval' }
              }
            ]
          },
          selectionSet: selectionSetTransOpUpcomingBookings,
          authMode: 'apiKey',
        });
        setTransOpUpcomingBookings(cargo);
      } catch (error) {
        console.error('Error fetching containers:', error);
      }
    }
  }
  useEffect(() => {
    fetchTransOpUpcoming();
  }, [userAttributes.role]);

  const [transOpOngoingBookings, setTransOpOngoingBookings] = useState<TransOpOngoingBookings[]>([]);

  async function fetchTransOpOngoing() {
    if (userAttributes.role === 'Transportation Operator') {
      try {
        const { data: cargo } = await client.models.Container.list({
          filter: {
            and: [
              {
                transopEmail: { eq: userAttributes.email }
              },
              {
                or: [
                  {
                    bookingStatus: { ne: 'unassigned' }
                  },
                  {
                    bookingStatus: { ne: 'Pending Transportation Operator Approval' }
                  },
                ]
              }
            ]
          },
          selectionSet: selectionSetTransOpOngoingBookings,
          authMode: 'apiKey',
          });
        setTransOpOngoingBookings(cargo);
      } catch (error) {
        console.error('Error fetching containers:', error);
      }
    }
  }
  useEffect(() => {
    fetchTransOpOngoing();
  }, [userAttributes.role]);


  async function assignTransOp(containerID: string, newName: string, newEmail: string, bookingStatus: string): Promise<boolean> {
    if (!navigator.onLine) {
      console.error("No internet connection. Update not submitted. Please check your connection and try again.");
      toast.error("No internet connection. Update not submitted. Please check your connection and try again.");
      return false; // Explicitly return false when offline
    }
  
    try {
      const { data: assignTransportationOp } = await client.models.Container.update({
        containerID: containerID,
        transopName: newName,
        transopEmail: newEmail,
        bookingStatus: bookingStatus,
        assignmentDate: new Date().toLocaleDateString('en-US'),
        isTransportationNotify: true,
        isBCONotify: false,
        isTerminalNotify: false,
      });
  
      console.log("Updated container status:", assignTransportationOp);
      toast.success("Transportation Operator assigned successfully");
  
      // Refetch data to reflect changes
      await fetchContainers();
  
      return true;
    } catch (error) {
      console.error("Error updating container status:", error);
      toast.error("Error assigning Transportation Operator. Please try again.");
      return false; // Explicitly return false when the update fails
    }
  }
  

  //getting Data
  const [terminalopBookingsupcoming, setData] = useState<TerminalOPOngoingBookings[]>([])

  //Fetch the data from the database
  const fetchterminal_operator_requested = async () => {
    //Query the data from the database with selection set and auth mode (always apiKey)
    const { data: cargo } = await client.models.Container.list({
      selectionSet:selectionSetTerminalOPUpcoming ,
      authMode: 'apiKey',
      filter: {
        bookingStatus: {
          eq: 'Pending Booking Approval'
        }
      }
    });
    setData(cargo);
  }

  const [terminalOpModifiedBookings, setTerminalOpModifiedBookings] = useState<TerminalOpModifiedBookings[]>([])

  const fetchTerminalOperatorModified = async() => {
    const { data: cargo } = await client.models.Container.list({
      selectionSet: selectionSetTerminalOpModified,
      authMode: 'apiKey',
      filter: {
        bookingStatus: {
          eq: 'Pickup Modification Requested'
        }
      }
  });
  setTerminalOpModifiedBookings(cargo);
}


  //Fetch Ongoing Terminal Operator data
    //Fetch the data from the database
    const [terminalopBookingongoing, set_terminal_ongoing] = useState<TerminalOPOngoingBookings[]>([])
    const fetchterminal_operator_ongoing = async () => {
      //Query the data from the database with selection set and auth mode (always apiKey)
      const { data: cargo } = await client.models.Container.list({
        selectionSet:selectionSetTerminalOPOngoing ,
        authMode: 'apiKey',
       
        filter: {
          or: [
            {
              bookingStatus: { eq: 'Pending Pick Up' }
            },
            {
              bookingStatus: { eq: 'Late for Pick Up' }
            }
          ]
        }
      });
      set_terminal_ongoing(cargo);
    }
  
    //Fetch the data on the first render
    useEffect(() => {
      fetchterminal_operator_ongoing();
    }, [])
    
    async function  markBookingLate(id: string, status: string){  
      try {

          const { data: updatedContainerStatus } = await client.models.Container.update({
            containerID: id,
            bookingStatus: status,
            isTransportationNotify: true,
            isBCONotify: true,
            isTerminalNotify: false,

          });
          console.log("Marked Booking status Late for Pick Up:", updatedContainerStatus);
          await fetchterminal_operator_ongoing();
          return true; 
        } 
       catch (error) {
        console.error("Error Marking Booking Status as Late:", error);
        return false;
      }
    }
    
//Update Transporation Operator Booking

    async function updateTransOpBooking(
      id: string,
      status: string,
      bookingDate?: string,
      bookingTime?: string
    ): Promise<boolean> {
      if (!navigator.onLine) {
        console.error("No internet connection. Update not submitted. Please check your connection and try again.");
        toast.error("No internet connection. Update not submitted. Please check your connection and try again.");
        return false; // Explicitly return false when offline
      }
      try {
        let updatePayload = { containerID: id, bookingStatus: status, isTransportationNotify: false, isBCONotify: false, isTerminalNotify: false };
    
        if (status === "unassigned") {
          Object.assign(updatePayload, {
            transopName: "",
            transopEmail: "",
            isTransportationNotify: false,
            isBCONotify: true,
            isTerminalNotify: false,
          });
        } else if (status === "Pending Booking Approval") {
          Object.assign(updatePayload, {
            bookingDate,
            bookingTime,
            isTerminalNotify: true,
            isBCONotify: true,
            isTransportationNotify: false,
          });
        } else if (status === "Picked Up") {
          Object.assign(updatePayload, {
            bookingPickupDate: bookingDate,
            isTransportationNotify: false,
            isBCONotify:false,
            isTerminalNotify: false
          });
        } else if (status === "Pickup Modification Requested") {
          Object.assign(updatePayload, {
            modifiedBookingDate: bookingDate,
            modifiedBookingTime: bookingTime,
            isTerminalNotify: true,
            isBCONotify: true,
            isTransportationNotify: false,
          });
        }
        
        const { data: updatedContainerStatus } = await client.models.Container.update(updatePayload);
        console.log("Updated container status:", updatedContainerStatus);
        toast.success("Container status updated successfully");
    
        // Refresh data after successful update
        await fetchTransOpUpcoming();
        await fetchTransOpOngoing();
        
        return true; // Update succeeded
      } catch (error) {
        console.error("Error updating container:", error);
        toast.error("Error submitting modification");
        return false; // Update failed
      }
    }

//Update Terminal Operator Booking

async function updateBooking(id: string, status: string, bookingDate?: string, bookingTime?: string): Promise<boolean> {
  if (!navigator.onLine) {
    console.error("No internet connection. Update not submitted. Please check your connection and try again.");
    toast.error("No internet connection. Update not submitted. Please check your connection and try again.");
    return false; // Explicitly return false when offline
  }

  try {
    let updatePayload: any = { containerID: id, bookingStatus: status };

    if (status === "unassigned") {
      Object.assign(updatePayload, {
        transopName: "",
        transopEmail: "",
        assignmentDate: "",
        bookingDate: "",
        bookingTime: "",
        bookingApprovalDate: "",
        bookingLatestUpdateDate: "",
        modifiedBookingDate: "",
        modifiedBookingTime:"",
        isTerminalNotify: false,
        isTransportationNotify: true,
        isBCONotify: true,
      });
    } else if (bookingDate) {
      Object.assign(updatePayload, {
        bookingApprovalDate: new Date().toLocaleDateString("en-US"),
        bookingDate,
        bookingTime,
        modifiedBookingDate: "",
        modifiedBookingTime: "",
        isTerminalNotify: false,
        isBCONotify: true,
        isTransportationNotify: true,
      });
    } else {
      //Approving a Booking -> Pending Pick Up
      Object.assign(updatePayload, {
        bookingApprovalDate: new Date().toLocaleDateString("en-US"),
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
    await fetchTerminalOperatorModified();

    return true;
  } catch (error) {
    console.error("Error updating booking status:", error);
    toast.error("Error updating booking status. Please try again.");
    return false; // Explicitly return false when the update fails
  }
}
       

const [BCOOngoingData, setBCOOngoingBookings] = useState<BCOOngoingBooking[]>([]);

// Move fetchContainers outside of useEffect so it can be reused
async function fetch_bco_ongoing() {
 
    try{
    const { data: cargo } = await client.models.Container.list({
      selectionSet:selectionSetBCOOngoing ,
      authMode: 'apiKey',
      filter: {
        and: [
          {
            bcoEmail: { eq: userAttributes.email }
          },
          {
            bookingStatus: { ne: 'unassigned' }
          },
          {
            bookingStatus: { ne: 'Picked Up' }
          }
        ]
      },
    });
    setBCOOngoingBookings(cargo);
  }
  catch(error )
  {console.error('Error fetching BCO OnGoing', error);

  }
  

  //Fetch the data on the first render

}

useEffect(() => {
  fetchContainers();
  //fetch_bco_completed();
  fetch_bco_ongoing();
  fetchterminal_operator_requested();
  fetchTerminalOperatorModified();
}, [userAttributes.role]);



  if (userAttributes.role === "Terminal Operator") {
    return (
      <div className="w-full">
      <Tabs defaultValue="requested" className="">
        <div>
      <TabsList className="mb-4 flex w-full justify-start gap-x-4">
          <TabsTrigger value="requested">Requested</TabsTrigger>
          <TabsTrigger value="modification">Modification Requested</TabsTrigger>
          <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        </div>
        <div>
        <TabsContent value="requested">
          <TerminalBookingsTable data={terminalopBookingsupcoming} status="Requested" meta={{updateBooking}} />
        </TabsContent>
        <TabsContent value="modification">
          <TerminalBookingsTable data={terminalOpModifiedBookings} status="Modified" meta={{updateBooking}} />
        </TabsContent>
        <TabsContent value="ongoing">
          <TerminalBookingsTable data={terminalopBookingongoing} status="Ongoing" meta={{updateBooking, markBookingLate}} />
        </TabsContent>
        <TabsContent value="completed">
          < TerminalBookingsCompleted data={Terminal_CompletedData} status="Completed" meta={{updateBooking}}/>
        </TabsContent>
        </div>
      </Tabs>
    </div>
    );
  }

  if (userAttributes.role === "Transportation Operator") {
    return (
    <div className="w-full">
    
    <Tabs defaultValue="upcoming">
      <TabsList className="mb-4 flex w-full justify-start gap-x-4">
        <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
        <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
        <TabsTrigger value="completed">Completed</TabsTrigger>
      </TabsList>

      <TabsContent value="upcoming">
        <TransportationBookingsTableUpcoming
          data={transOpUpcomingBookings}     
          status="Upcoming"
          meta={{updateTransOpBooking}}
        />
      </TabsContent>

      <TabsContent value="ongoing">
        <TransportationBookingsTableOngoing
          data={transOpOngoingBookings}
          status="Ongoing"
          meta={{updateTransOpBooking, getPortCapacity, getBookingsAmount}}
        />
      </TabsContent>

      <TabsContent value="completed">
      <TransportationBookingsTableCompleted
          data={ Transportation_CompletedData}
          status='completed'
          meta={null}
        />
      </TabsContent>
    </Tabs>
  </div>
);
  }

  // Default return for General Role or Unknown Role
  if (userAttributes.role==="Beneficiary Cargo Owner")
  {
    return (
      <div className="w-full">
      
      <Tabs defaultValue="upcoming">
        <TabsList className="mb-4 flex w-full justify-start gap-x-4">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
  
        <TabsContent value="upcoming">
          <BcoBookingsTableUpcoming
            data={bcoUpcomingBookings}
            status="Upcoming"
            meta={{ assignTransOp }}
          />
        </TabsContent>
  
        <TabsContent value="ongoing">
          <BcoBookingsTableOngoing
            data={ BCOOngoingData}
            meta={null}
            status="Ongoing"
          />
        </TabsContent>
  
        <TabsContent value="completed">
        <BcoBookingsTableCompleted
            data={bcocompletedBookings}
            meta={null}
            status='completed'
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
}



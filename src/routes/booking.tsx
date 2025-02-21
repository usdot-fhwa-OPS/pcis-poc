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

//Define the selection of data that will be used for the table
const selectionSetBCOUpcomingBookings = ['vesselID', 'containerID', 'origin', 'destination', 'bcoName', 'bcoEmail', 'transopName', 'transopEmail', 'containerStatus','arrivalDate', 'flag'] as const;
//Create a type based on your selectionSet that will be later used for the columns.tsx file of the able

const selectionSetTerminalOPOngoing = ['vesselID', 'containerID', 'origin', 'bcoName', 'bcoEmail', 'transopName', 'transopEmail','bookingDate','bookingTime','bookingStatus', 'flag'] as const;
export type BCOUpcomingBookings = SelectionSet<Schema['Container']['type'], typeof selectionSetBCOUpcomingBookings>

//Create a type based on your selectionSet that will be later used for the columns.tsx file of the able
export type TerminalOPUpcomingBookings= SelectionSet<Schema['Container']['type'], typeof selectionSetTerminalOPUpcoming>


export type TerminalOPOngoingBookings= SelectionSet<Schema['Container']['type'], typeof selectionSetTerminalOPOngoing >

const selectionSetBCOCompleted = ['vesselID', 'containerID', 'origin', 'bcoName', 'bcoEmail', 'transopName', 'transopEmail','bookingDate','bookingApprovalDate','bookingStatus','destination', 'bookingPickupDate','flag'] as const;

export type BCOCompletedBooking= SelectionSet<Schema['Container']['type'], typeof selectionSetBCOCompleted>

const BCO_OngoingData = [
  { port:"NORfolk", terminalId:"N-10", vesselId: "1", terminal_op:"James Vince", containerId: "HMO-22", origin: "Canada", bco: "WB", bco_email: "wb@gmail.com", operator: "James", operator_email: "sarah@gmail.com", date_init: "22 March 2024", date_approved: "24 March 2024", status: "Pending Appointment", date_picked: "23 March 2024", time: "10:00am" },
  { port:"Los Angeles", terminalId:"L-22", vesselId: "2", terminal_op:"Michael Scott", containerId: "US-45", origin: "USA", bco: "RT", bco_email: "rt@gmail.com", operator: "Daniel", operator_email: "daniel@gmail.com", date_init: "23 March 2024", date_approved: "23 March 2024", status: "Pending Pick Up", date_picked: "24 March 2024", time: "3:45pm" },
  { port:"Mexico City", terminalId:"M-14", vesselId: "3", terminal_op:"Sarah Doe", containerId: "M-35", origin: "Mexico", bco: "WB", bco_email: "wb@gmail.com", operator: "Emma", operator_email: "emma@gmail.com", date_init: "22 March 2024", date_approved: "23 March 2024", status: "Pending Approval", date_picked: "24 March 2024", time: "1:00pm" },
  { port:"Shanghai", terminalId:"S-33", vesselId: "4", terminal_op:"Liam Wong", containerId: "CH-44", origin: "China", bco: "LK", bco_email: "lk@gmail.com", operator: "Sophia", operator_email: "sophia@gmail.com", date_init: "2 March 2024", date_approved: "23 March 2024", status: "Pening Approval", date_picked: "23 March 2024", time: "11:30am" }
];




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
          bookingStatus: {
            eq: 'Picked Up'
          }
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
                    bookingStatus: { eq: 'Pending Booking' }
                  },
                  {
                    bookingStatus: { eq: 'Pending Booking Approval' }
                  },
                  {
                    bookingStatus: { eq: 'Pending Pick Up' }
                  },
                  {
                    bookingStatus: { eq: 'Late for Pick Up' }
                  },
                  {
                    bookingStatus: { eq: 'Picked Up' }
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
   
  // Update container then refetch containers
  async function assignTransOp(containerID: string, newName: string, newEmail: string, bookingStatus: string) {
    try {
      const { data: assignTransportationOp } = await client.models.Container.update({
        containerID: containerID,
        transopName: newName,
        transopEmail: newEmail,
        bookingStatus: bookingStatus,
        assignmentDate: new Date().toLocaleDateString('en-US'),
      });
      console.log('Updated container status:', assignTransportationOp);
      // Refetch containers after updating
      await fetchContainers();
    } catch (error) {
      console.error('Error updating container status:', error);
    }
  }

  // Separate return statements for each role

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

  //Fetch the data on the first render


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
              bookingStatus: { eq: 'Late' }
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

    //Update Terminal Operator Booking

    async function updateTransOpBooking(id: string, status: string, bookingDate?: string, bookingTime?: string) {
      // Check if the browser is online before attempting any network request
      if (!navigator.onLine) {
        console.error("No internet connection. Please check your connection and try again.");
        toast.error("No internet connection. Please check your connection and try again.");
        return;
      }
    
      try {
        let updatePayload = { containerID: id, bookingStatus: status };
    
        if (status === "unassigned") {
          Object.assign(updatePayload, {
            transopName: "",
            transopEmail: ""
          });
        } else if (status === "Pending Booking Approval") {
          Object.assign(updatePayload, {
            bookingDate,
            bookingTime
          });
        } else if (status === "Picked Up") {
          Object.assign(updatePayload, {
            bookingPickupDate: bookingDate
          });
        } else if (status === "Pickup Modification Requested") {
          Object.assign(updatePayload, {
            modifiedBookingDate: bookingDate,
            modifiedBookingTime: bookingTime
          });
        }
        
        const { data: updatedContainerStatus } = await client.models.Container.update(updatePayload);
        console.log("Updated container status:", updatedContainerStatus);
        toast.success("Container status updated successfully");
    
        // Call the appropriate function based on the status
        await fetchTransOpUpcoming();
      
        await fetchTransOpOngoing();
        
      } catch (error) {
        // This catch block will now capture errors like network failures or timeouts
        console.error("Error updating container:", error);
        toast.error("Error submitting modification");
      }
    }
    

async function updateBooking(id: string, status: string) {
  try {
    if (status === "unassigned") {
      const { data: updatedContainerStatus } = await client.models.Container.update({
        containerID: id,
        bookingStatus: status,
        transopName:"",
        transopEmail:""
      });
      console.log("Updated flag with transop details:", updatedContainerStatus);
      await fetchterminal_operator_requested();
    } else {
      const { data: updatedContainerStatus } = await client.models.Container.update({
        containerID: id,
        bookingStatus: status,
        bookingApprovalDate: new Date().toLocaleDateString('en-US')
      });
      console.log("Updated flag:", updatedContainerStatus);
      await fetchterminal_operator_requested();
    }
  } catch (error) {
    console.error("Error updating flag:", error);
  }
}

  if (userAttributes.role === "Terminal Operator") {
    return (
      <div className="w-full">
      <Tabs defaultValue="requested" className="">
        <div>
      <TabsList className="mb-4 flex w-full justify-start gap-x-4">
          <TabsTrigger value="requested">Requested</TabsTrigger>
          <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        </div>
        <div>
        <TabsContent value="requested">
          <TerminalBookingsTable data={terminalopBookingsupcoming} status="Requested" meta={{updateBooking}} />
        </TabsContent>
        <TabsContent value="ongoing">
          <TerminalBookingsTable data={terminalopBookingongoing} status="Ongoing" meta={{updateBooking}} />
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
          meta={{updateTransOpBooking}}
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
            data={ BCO_OngoingData}
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




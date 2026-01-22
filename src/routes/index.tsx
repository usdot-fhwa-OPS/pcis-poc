import { createFileRoute } from '@tanstack/react-router'
import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';
import { useEffect, useState } from 'react';
import {TerminalBookingsTable,TerminalBookingsCompleted} from "../components/terminal-bookings/terminal-bookings-table.tsx"
import {TransportationBookingsTableUpcoming,  TransportationBookingsTableCompleted,TransportationBookingsTableOngoing} from "../components/transportation_bookings/transportation-bookings-table.tsx"
import {BcoBookingsTableUpcoming,  BcoBookingsTableCompleted,BcoBookingsTableOngoing} from "../components/bco_bookings/bco-bookings-table.tsx"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs.tsx"
import { toast } from "sonner"

//Three Imports needed for Amplify Data Queries and CRUD methods 
import { generateClient, SelectionSet } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();


//Define the selection of data that will be used for the table
const selectionSetTransOpUpcomingBookings = ['vesselID', 'cargoUnitID', 'origin', 'bcoName', 'bcoEmail', 'transopName', 'transopEmail', 'assignmentDate', 'reservationStatus','flag'] as const; // changed containerID to cargoUnitID
//Create a type based on your selectionSet that will be later used for the columns.tsx file of the able
export type TransOpUpcomingBookings = SelectionSet<Schema['Container']['type'], typeof selectionSetTransOpUpcomingBookings>

const selectionSetTransOpOngoingBookings = ['vesselID', 'cargoUnitID', 'origin', 'bcoName', 'bcoEmail', 'transopName', 'transopEmail', 'reservationDate', 'reservationTime', 'reservationStatus', 'flag', 'containerStatus'] as const; // changed containerID to cargoUnitID
export type TransOpOngoingBookings = SelectionSet<Schema['Container']['type'], typeof selectionSetTransOpOngoingBookings>

const selectionSetTerminalOPUpcoming = ['vesselID', 'cargoUnitID', 'origin', 'bcoName', 'bcoEmail', 'transopName', 'transopEmail','reservationDate','reservationTime','reservationStatus', 'flag'] as const; // changed containerID to cargoUnitID

const selectionSetTerminalOpModified = ['vesselID', 'cargoUnitID', 'origin', 'bcoName', 'bcoEmail', 'transopName', 'transopEmail','reservationDate','reservationTime', 'reservationStatus', 'modifiedReservationDate', 'modifiedReservationTime'] as const; // changed containerID to cargoUnitID

export type TerminalOpModifiedBookings = SelectionSet<Schema['Container']['type'], typeof selectionSetTerminalOpModified>
//Define the selection of data that will be used for the table
const selectionSetBCOUpcomingBookings = ['vesselID', 'cargoUnitID', 'origin', 'destination', 'bcoName', 'bcoEmail', 'transopName', 'transopEmail', 'containerStatus','arrivalDate', 'flag'] as const; // changed containerID to cargoUnitID
//Create a type based on your selectionSet that will be later used for the columns.tsx file of the able

const selectionSetTerminalOPOngoing = ['vesselID', 'cargoUnitID', 'origin', 'bcoName', 'bcoEmail', 'transopName', 'transopEmail','reservationDate','reservationTime','reservationStatus', 'flag'] as const; // changed containerID to cargoUnitID
export type BCOUpcomingBookings = SelectionSet<Schema['Container']['type'], typeof selectionSetBCOUpcomingBookings> 

//Create a type based on your selectionSet that will be later used for the columns.tsx file of the able
export type TerminalOPUpcomingBookings= SelectionSet<Schema['Container']['type'], typeof selectionSetTerminalOPUpcoming>

export type TerminalOPOngoingBookings= SelectionSet<Schema['Container']['type'], typeof selectionSetTerminalOPOngoing >

const selectionSetBCOOngoing = ['vesselID', 'cargoUnitID', 'origin','destination', 'bcoName', 'bcoEmail', 'transopName', 'transopEmail','reservationDate','resApprovalDate','reservationStatus', 'resPickupDate','flag', 'updatedAt'] as const; // changed containerID to cargoUnitID

export type BCOOngoingBooking= SelectionSet<Schema['Container']['type'], typeof selectionSetBCOOngoing>

const selectionSetBCOCompleted = ['vesselID', 'cargoUnitID', 'origin', 'bcoName', 'bcoEmail', 'transopName', 'transopEmail','reservationDate','resApprovalDate','reservationStatus','destination', 'resPickupDate','flag'] as const; // changed containerID to cargoUnitID

export type BCOCompletedBooking= SelectionSet<Schema['Container']['type'], typeof selectionSetBCOCompleted>

//Define the selection of data that will be used for the table
const selectionSetTransportation_CompletedData = [ 
  'vesselID',
  'cargoUnitID', // changed containerID to cargoUnitID
  'origin',
  'bcoName',
  'bcoEmail',
  'transopName',
  'transopEmail',
  'reservationDate',
  'resApprovalDate',
  'reservationStatus',
  'resPickupDate',
  'reservationTime',
] as const;

//Define the selection of data that will be used for the table
const selectionSetTerminal_CompletedData = [ 
  'vesselID',
  'cargoUnitID', // changed containerID to cargoUnitID
  'origin',
  'bcoName',
  'bcoEmail',
  'transopName',
  'transopEmail',
  'reservationDate',
  'resApprovalDate',
  'reservationStatus',
  'resPickupDate',
  'reservationTime',
] as const;

//Create a type based on your selectionSet that will be later used for the columns.tsx file of the able
export type TransOperatorCompletedBookings = SelectionSet<Schema['Container']['type'], typeof selectionSetTransportation_CompletedData>;

//Create a type based on your selectionSet that will be later used for the terminal-bookings/columns.tsx file of the able
export type TermOperatorCompletedBookings = SelectionSet<Schema['Container']['type'], typeof selectionSetTerminal_CompletedData>;


interface UserAttributes {
  given_name?: string;
  family_name?: string;
  email?: string;
  'custom:role'?: string;
}

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  const { user } = useAuthenticator();
    const [userAttributes, setUserAttributes] = useState<{ fullName: string; role: string, email: string }>({ fullName: '', role: '', email: '' });
    useEffect(() => {
      const getUserAttributes = async () => {
        try {
          const attributes: UserAttributes = await fetchUserAttributes();
          
          const fullName = attributes.given_name && attributes.family_name
            ? `${attributes.given_name} ${attributes.family_name}`
            : 'Unknown';
  
          setUserAttributes({
            fullName,
            role: attributes['custom:role'] ?? 'No role assigned',
            email: attributes.email ?? "No email assigned",
          });
        } catch (error) {
          console.error('Error fetching user attributes:', error);
        }
      };
  
      if (user) {
        getUserAttributes();
      }
    }, [user]);
    
    async function fetchTransportationOperators() {
        try {
          const session = await fetchAuthSession();
          const response = await fetch("https://xlj2x9eurh.execute-api.us-east-1.amazonaws.com/dev/", {
            method: 'GET',
            headers: {
              "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
              "Content-Type": "application/json",
              "Accept": "*/*"
            }
          });
          const result = await response.json();
          return result
        } catch (error) {
    
        }
      }

    async function getTerminalCapacity() { // changed port to terminal
      try {
        const { data: limit } = await client.models.Limit.get(
          {id: '7bde2cc5-23dc-4f46-b6d9-502133cc2e8c'},
          {
            authMode: 'apiKey',
          }
        );
        
        if (limit) {
          return limit.terminalCapacity; // changed port to terminal
        }
      } catch (error) {
        console.error('Error fetching booking limit', error);
      }
  }

  async function getBookingsAmount(reservationDate: string) {
    try {
      const { data: bookings } = await client.models.Container.list({
        authMode: 'apiKey',
        filter: {
          reservationDate: {eq: reservationDate}
        },  
      });
      if (bookings) {
        return bookings.length;
      }
    } catch (error) {
      console.error('Error fetching bookings', error);
    }
  }

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
            },
            error: (error) => console.warn(error),
          });
          return () => createSubscription.unsubscribe();
        }, []);

    const dateString = new Date().toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    const [Transportation_CompletedData, setTransportation_CompletedData] = useState<TransOperatorCompletedBookings[]>([]);
      
      
      async function fetchTransOperatorCBookingsContainers() {
        if (((userAttributes.role === 'Trucking Operator') 
          || (userAttributes.role === 'Rail Operator')
          || (userAttributes.role === 'Third Party Logistics Provider')) && userAttributes.email) {
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
                    reservationStatus: { eq: 'Picked Up' }
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
      }, [userAttributes.role, userAttributes.email, refresh]);  // Updates when email changes
      
    
      // State for Terminal Operator Completed bookings
      const [Terminal_CompletedData, setTerminal_CompletedData] = useState<TermOperatorCompletedBookings[]>([]);
      
      async function fetchTermOperatorCBookingsContainers() {
        if (userAttributes.role === 'Terminal Operator') {
          try {
            const { data: cargo } = await client.models.Container.list({
              selectionSet:selectionSetTerminal_CompletedData,
              authMode: 'apiKey',
              filter: {
                    reservationStatus: { 
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
      }, [userAttributes.role, refresh]);
    
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
                    reservationStatus: { eq: 'unassigned' }
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
                  reservationStatus: {
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
      }, [userAttributes.role, refresh]);
    
      const [transOpUpcomingBookings, setTransOpUpcomingBookings] = useState<TransOpUpcomingBookings[]>([]);
    
      async function fetchTransOpUpcoming() {
        if ((userAttributes.role === 'Trucking Operator') 
          || (userAttributes.role === 'Rail Operator')
          || (userAttributes.role === 'Third Party Logistics Provider')) {
          try {
            const { data: cargo } = await client.models.Container.list({
              filter: {
                and: [
                  {
                    transopEmail: { eq: userAttributes.email }
                  },
                  {
                    reservationStatus: { eq: 'Pending Transportation Operator Approval' }
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
      }, [userAttributes.role, refresh]);
    
      const [transOpOngoingBookings, setTransOpOngoingBookings] = useState<TransOpOngoingBookings[]>([]);
    
      async function fetchTransOpOngoing() {
        if ((userAttributes.role === 'Trucking Operator') 
          || (userAttributes.role === 'Rail Operator')
          || (userAttributes.role === 'Third Party Logistics Provider')) {
          try {
            const { data: cargo } = await client.models.Container.list({
              filter: {
                and: [
                  {
                    transopEmail: { eq: userAttributes.email }
                  },
                  {
                    reservationStatus: { ne: 'unassigned' }
                  },
                  {
                    reservationStatus: { ne: 'Pending Transportation Operator Approval' }
                  },
                  {
                    reservationStatus: { ne: 'Picked Up'}
                  }
                ]
              },
              selectionSet: selectionSetTransOpOngoingBookings,
              authMode: 'apiKey',
              });
            setTransOpOngoingBookings(cargo);
          } catch (error) {
            console.error('Error fetching caro unit:', error);
          }
        }
      }
      useEffect(() => {
        fetchTransOpOngoing();
      }, [userAttributes.role, refresh]);
       
      // Update container then refetch containers
      async function assignTransOp(cargoUnitID: string, newName: string, newEmail: string, reservationStatus: string) { // changed containerID to cargoUnitID
        try {
          const { data: assignTransportationOp } = await client.models.Container.update({
            cargoUnitID: cargoUnitID,
            transopName: newName,
            transopEmail: newEmail,
            reservationStatus: reservationStatus,
            assignmentDate: new Date().toLocaleDateString('en-US'),
            isTransportationNotify: true,
          });
          console.log('Updated cargo unit status:', assignTransportationOp);
          // Refetch containers after updating
          await fetchContainers();
        } catch (error) {
          console.error('Error updating cargo unit status:', error);
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
            reservationStatus: {
              eq: 'Pending Reservation Approval'
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
            reservationStatus: {
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
                  reservationStatus: { eq: 'Pending Pick Up' }
                },
                {
                  reservationStatus: { eq: 'Late for Pick Up' }
                }
              ]
            }
          });
          set_terminal_ongoing(cargo);
        }
      
        //Fetch the data on the first render
        useEffect(() => {
          fetchterminal_operator_ongoing();
        }, [refresh])
    
        //Update Terminal Operator Booking
    
        async function updateTransOpBooking(
          id: string,
          status: string,
          reservationDate?: string,
          reservationTime?: string
        ): Promise<boolean> {
          if (!navigator.onLine) {
            console.error("No internet connection. Update not submitted. Please check your connection and try again.");
            toast.error("No internet connection. Update not submitted. Please check your connection and try again.");
            return false; // Explicitly return false when offline
          }
        
          try {
            let updatePayload = { cargoUnitID: id, reservationStatus: status, isTransportationNotify: false, isBCONotify: false, isTerminalNotify: false }; // changed containerID to cargoUnitID
        
            if (status === "unassigned") {
              Object.assign(updatePayload, {
                transopName: "",
                transopEmail: "",
                isTransportationNotify: false,
                isBCONotify: true,
                isTerminalNotify: false,
              });
            } else if (status === "Pending Reservation Approval") {
              Object.assign(updatePayload, {
                reservationDate,
                reservationTime,
                isTerminalNotify: true,
                isBCONotify: true,
                isTransportationNotify: false,
              });
            } else if (status === "Picked Up") {
              Object.assign(updatePayload, {
                resPickupDate: reservationDate,
                isTransportationNotify: false,
                isBCONotify:false,
                isTerminalNotify: false
              });
            } else if (status === "Pickup Modification Requested") {
              Object.assign(updatePayload, {
                modifiedReservationDate: reservationDate,
                modifiedReservationTime: reservationTime,
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
        
    
    async function updateBooking(id: string, status: string, reservationDate?: string, reservationTime?: string): Promise<boolean> {
      if (!navigator.onLine) {
        console.error("No internet connection. Update not submitted. Please check your connection and try again.");
        toast.error("No internet connection. Update not submitted. Please check your connection and try again.");
        return false; // Explicitly return false when offline
      }
    
      try {
        let updatePayload: any = { cargoUnitID: id, reservationStatus: status }; // changed containerID to cargoUnitID
    
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
        await fetchTerminalOperatorModified();
    
        return true;
      } catch (error) {
        console.error("Error updating booking status:", error);
        toast.error("Error updating booking status. Please try again.");
        return false; // Explicitly return false when the update fails
      }
    }
    


    async function  markBookingLate(id: string, status: string){  
      try {
    
          const { data: updatedContainerStatus } = await client.models.Container.update({
            cargoUnitID: id, // changed containerID to cargoUnitID
            reservationStatus: status,
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
                reservationStatus: { ne: 'unassigned' }
              },
              {
                reservationStatus: { ne: 'Picked Up' }
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
    }, [userAttributes.role, refresh]);
  
    if (userAttributes.role === "Terminal Operator") {
      return (
        
        <div className="w-full">
          <div className="p-2" style={{ textAlign: 'left' }}>
        <div>
          <p
            style={{
              fontWeight: 400,
              fontSize: '40px'
            }}
          >
            Welcome {userAttributes.fullName}
          </p>
          <p
            style={{
              opacity: 0.66,
              fontWeight: 400,
              fontSize: '24px'
            }}
          >
            {userAttributes.role}
          </p>
        </div>
        <div>
          <p
            style={{
              opacity: 0.66,
              fontWeight: 400,
              fontSize: '14px'
            }}
          >
            {dateString}
          </p>
        </div>
      </div>
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
            <TerminalBookingsTable data={terminalopBookingongoing} status="Ongoing" meta={{updateBooking,markBookingLate}} />
          </TabsContent>
          <TabsContent value="completed">
            < TerminalBookingsCompleted data={Terminal_CompletedData} status="Completed" meta={{updateBooking}}/>
          </TabsContent>
          </div>
        </Tabs>
        
      </div>
      );
    }
  
    if ((userAttributes.role === 'Trucking Operator') 
          || (userAttributes.role === 'Rail Operator')
          || (userAttributes.role === 'Third Party Logistics Provider')) {
      return (
      <div className="w-full">
      <div className="p-2" style={{ textAlign: 'left' }}>
        <div>
          <p
            style={{
              fontWeight: 400,
              fontSize: '40px'
            }}
          >
            Welcome {userAttributes.fullName}
          </p>
          <p
            style={{
              opacity: 0.66,
              fontWeight: 400,
              fontSize: '24px'
            }}
          >
            {userAttributes.role}
          </p>
        </div>
        <div>
          <p
            style={{
              opacity: 0.66,
              fontWeight: 400,
              fontSize: '14px'
            }}
          >
            {dateString}
          </p>
        </div>
      </div>
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
            meta={{updateTransOpBooking, getTerminalCapacity, getBookingsAmount}} // changed port to terminal
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
        <div className="p-2" style={{ textAlign: 'left' }}>
        <div>
          <p
            style={{
              fontWeight: 400,
              fontSize: '40px'
            }}
          >
            Welcome {userAttributes.fullName}
          </p>
          <p
            style={{
              opacity: 0.66,
              fontWeight: 400,
              fontSize: '24px'
            }}
          >
            {userAttributes.role}
          </p>
        </div>
        <div>
          <p
            style={{
              opacity: 0.66,
              fontWeight: 400,
              fontSize: '14px'
            }}
          >
            {dateString}
          </p>
        </div>
      </div>
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
              meta={{ assignTransOp, fetchTransportationOperators }}
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
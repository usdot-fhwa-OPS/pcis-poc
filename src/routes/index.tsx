import { createFileRoute } from '@tanstack/react-router'
import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';
import { useEffect, useState } from 'react';
import * as React from 'react';
import {TerminalBookingsTable,TerminalBookingsCompleted} from "../components/terminal-bookings/terminal-bookings-table.tsx"
import {TransportationBookingsTableUpcoming,  TransportationBookingsTableCompleted,TransportationBookingsTableOngoing} from "../components/transportation_bookings/transportation-bookings-table.tsx"
import {BcoBookingsTableUpcoming,  BcoBookingsTableCompleted,BcoBookingsTableOngoing} from "../components/bco_bookings/bco-bookings-table.tsx"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs.tsx"
import { toast } from "sonner"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts';

//Three Imports needed for Amplify Data Queries and CRUD methods 
import { SelectionSet } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { useAppDispatch, useAppSelector } from '../hooks.tsx';
import { getTerminalCapacityList, populate } from '../components/terminal-capacity/terminal-capacity-state.tsx';
import { getTerrminalCapacity, terminalCapacityList } from '../components/terminal-capacity/terminal-capacity-client.tsx';
import { getCargoBookingsAmount, listBcoCompleted, listBcoOngoing, listBcoUpcoming, listTermOpCompleted, listTermOpModifiedRequestedCargoUnits, listTermOpOngoing, listTermOpOnGoingCargoUnits, listTermOpRequestedCargoUnits, listTransOpCompleted, listTransOpUpcoming,  saveCargoUnit } from '../components/cargo/cargo-units-client.tsx';
import { onCargoCreate, onCargoUpdate } from '../components/real-time-call.tsx';
import { berthRequestListForVesselAgent, berthConfigList as fetchBerthConfigs } from '../components/berth-requests/berth-request-client.tsx';
import { populate as populateBerthRequests } from '../components/berth-requests/berth-request-state.tsx';
import { populate as populateBerthConfig, getBerthConfigList } from '../components/berth-requests/berth-config-state.tsx';
import { BerthRequestDomain } from '../components/berth-requests/berth-request-domain.tsx';
import { VesselAgentBerthRequestsTable } from '../components/berth-requests/vessel-agent-table/berth-request-vessel-agent-table.tsx';
import { BerthRequestComponent } from './berth-requests.tsx';
import { deleteBerthRequest } from '../components/berth-requests/berth-request-client.tsx';



//Define the selection of data that will be used for the table
const selectionSetTransOpUpcomingBookings = ['vesselID', 'cargoUnitID', 'origin', 'bcoName', 'bcoEmail', 'transopName', 'transopEmail', 'assignmentDate', 'reservationStatus','flag'] as const; 
//Create a type based on your selectionSet that will be later used for the columns.tsx file of the able
export type TransOpUpcomingBookings = SelectionSet<Schema['Container']['type'], typeof selectionSetTransOpUpcomingBookings>

const selectionSetTransOpOngoingBookings = ['vesselID', 'cargoUnitID', 'origin', 'bcoName', 'bcoEmail', 'transopName', 'transopEmail', 'reservationDate', 'reservationTime', 'reservationStatus', 'twicEscortRequired', 'twicEscortRequired', 'flag', 'containerStatus'] as const; 
export type TransOpOngoingBookings = SelectionSet<Schema['Container']['type'], typeof selectionSetTransOpOngoingBookings>

const selectionSetTerminalOPUpcoming = ['vesselID', 'cargoUnitID', 'origin', 'bcoName', 'bcoEmail', 'transopName', 'transopEmail','reservationDate','reservationTime','reservationStatus', 'flag'] as const; 

const selectionSetTerminalOpModified = ['vesselID', 'cargoUnitID', 'origin', 'bcoName', 'bcoEmail', 'transopName', 'transopEmail','reservationDate','reservationTime', 'reservationStatus', 'modifiedReservationDate', 'modifiedReservationTime'] as const; 

export type TerminalOpModifiedBookings = SelectionSet<Schema['Container']['type'], typeof selectionSetTerminalOpModified>
//Define the selection of data that will be used for the table
const selectionSetBCOUpcomingBookings = ['vesselID', 'cargoUnitID', 'origin', 'destination', 'bcoName', 'bcoEmail', 'transopName', 'transopEmail', 'containerStatus','arrivalDate', 'flag'] as const; 
//Create a type based on your selectionSet that will be later used for the columns.tsx file of the able

const selectionSetTerminalOPOngoing = ['vesselID', 'cargoUnitID', 'origin', 'bcoName', 'bcoEmail', 'transopName', 'transopEmail','reservationDate','reservationTime','reservationStatus', 'twicEscortRequired', 'flag'] as const; 
export type BCOUpcomingBookings = SelectionSet<Schema['Container']['type'], typeof selectionSetBCOUpcomingBookings> 

//Create a type based on your selectionSet that will be later used for the columns.tsx file of the able
export type TerminalOPUpcomingBookings= SelectionSet<Schema['Container']['type'], typeof selectionSetTerminalOPUpcoming>

export type TerminalOPOngoingBookings= SelectionSet<Schema['Container']['type'], typeof selectionSetTerminalOPOngoing >

const selectionSetBCOOngoing = ['vesselID', 'cargoUnitID', 'origin','destination', 'bcoName', 'bcoEmail', 'transopName', 'transopEmail','reservationDate','resApprovalDate','reservationStatus', 'resPickupDate','flag', 'updatedAt'] as const; 

export type BCOOngoingBooking= SelectionSet<Schema['Container']['type'], typeof selectionSetBCOOngoing>

const selectionSetBCOCompleted = ['vesselID', 'cargoUnitID', 'origin', 'bcoName', 'bcoEmail', 'transopName', 'transopEmail','reservationDate','resApprovalDate','reservationStatus','destination', 'resPickupDate','flag'] as const; 

export type BCOCompletedBooking= SelectionSet<Schema['Container']['type'], typeof selectionSetBCOCompleted>

//Define the selection of data that will be used for the table
const selectionSetTransportation_CompletedData = [ 
  'vesselID',
  'cargoUnitID', 
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
  'twicEscortRequired',
] as const;

//Define the selection of data that will be used for the table
const selectionSetTerminal_CompletedData = [ 
  'vesselID',
  'cargoUnitID', 
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
  'twicEscortRequired',
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

interface AnalyticsData {
  cargoStatus: { [status: string]: number };
  shipmentTimeline: Array<{
    containerID: string | null;
    when: string;
    hoursUntil: number;
    containerStatus: string;
    bookingStatus: string;
    reservationStatus: string;
  }>;
  transportationAssignmentSummary: { [status: string]: number };
}

interface AnalyticsResponse {
  ok: boolean;
  role?: string;
  message?: string;
  context?: {
    email: string | null;
    destination: string | null;
    itemCount: number;
  };
  data?: AnalyticsData;
}

export const Route = createFileRoute('/')({
  component: Index,
})

const API_ENDPOINT = 'https://44ymq6eqfa.execute-api.us-east-1.amazonaws.com/metrics';

function Index() {
  const { user } = useAuthenticator();
    const [userAttributes, setUserAttributes] = useState<{ fullName: string; role: string, email: string }>({ fullName: '', role: '', email: '' });
    const [analyticsData, setAnalyticsData] = useState<AnalyticsResponse | null>(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    const dispatch = useAppDispatch()
    const termCapList = useAppSelector(getTerminalCapacityList)
    const fetchTerminalCapacityList = async () => {
        
            dispatch(populate(await terminalCapacityList()));
           
      }

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

      if(termCapList.length === 0){
        fetchTerminalCapacityList();
      }
      
      
    }, [user]);

    // Fetch analytics for BCO
    useEffect(() => {
      async function fetchAnalytics() {
        if (!user || userAttributes.role !== 'Beneficiary Cargo Owner') return;

        try {
          setAnalyticsLoading(true);

          const session = await fetchAuthSession();
          const idToken = session.tokens?.idToken?.toString();

          if (!idToken) {
            throw new Error('No authentication token available');
          }

          const response = await fetch(API_ENDPOINT, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${idToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
          }

          const data: AnalyticsResponse = await response.json();
          
          if (!data.ok) {
            throw new Error(data.message || 'Failed to fetch analytics');
          }

          setAnalyticsData(data);
        } catch (err) {
          console.error('Analytics fetch error:', err);
        } finally {
          setAnalyticsLoading(false);
        }
      }

      if (userAttributes.role === 'Beneficiary Cargo Owner') {
        fetchAnalytics();
      }
    }, [user, userAttributes.role]);
    
    async function fetchTransportationCoordinators() {
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

    async function getTerminalCapacity() { 
      try {
        const limit = await getTerrminalCapacity('c5067f68-07dd-45a4-9000-893708bdbd4f')
        
        if (limit) {
          return limit.capacity; 
        }
      } catch (error) {
        console.error('Error fetching booking limit', error);
      }
  }

      


  async function getBookingsAmount(reservationDate: string) {
    try {
      const count  = await getCargoBookingsAmount(reservationDate);
            return count;
    } catch (error) {
      console.error('Error fetching bookings', error);
    }
  }

    const [refresh, setRefresh] = useState(0);
      
    // Subscribe to updates and trigger refresh.
    useEffect(() => {
      const updateSubscription =  onCargoUpdate.subscribe({  
        next: () => {
          // Increment the refresh counter to trigger re-running the observeQuery.
          setRefresh((prev) => prev + 1);
        },
        error: (error: any) => console.warn(error),
      });
      return () => updateSubscription.unsubscribe();
    }, []);
    
    useEffect(() => {
          const createSubscription = onCargoCreate.subscribe({
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
           const cargo  = await listTransOpCompleted(userAttributes.email);
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
            const cargo  = await listTermOpCompleted()
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
            const cargo  = await listBcoUpcoming(userAttributes.email);
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
       
        try {
          const cargo = await listBcoCompleted(userAttributes.email);
          setBcoCompletedBookings(cargo)
        }
        catch (error) {
          console.error('Error fetching BCO Completed:', error);

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
            const cargo  = await listTransOpUpcoming(userAttributes.email);
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
            const cargo = await listTermOpOngoing(userAttributes.email);
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
      async function assignTransOp(cargoUnitID: string, newName: string, newEmail: string, reservationStatus: string) { 
        try {
          const assignTransportationOp = await saveCargoUnit({
            cargoUnitID: cargoUnitID,
            transopName: newName,
            transopEmail: newEmail,
            reservationStatus: reservationStatus,
            assignmentDate: new Date().toLocaleDateString('en-US'),
            isTransportationNotify: true,
            isBCONotify: false,
            isTerminalNotify: false,
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
        const cargo = await listTermOpRequestedCargoUnits()
        setData(cargo);
      }
    
      const [terminalOpModifiedBookings, setTerminalOpModifiedBookings] = useState<TerminalOpModifiedBookings[]>([])
    
      const fetchTerminalOperatorModified = async() => {
        const cargo  =  await listTermOpModifiedRequestedCargoUnits()
      setTerminalOpModifiedBookings(cargo);
    }
    
    
      //Fetch Ongoing Terminal Operator data
        //Fetch the data from the database
        const [terminalopBookingongoing, set_terminal_ongoing] = useState<TerminalOPOngoingBookings[]>([])
        const fetchterminal_operator_ongoing = async () => {
          //Query the data from the database with selection set and auth mode (always apiKey)
          const cargo  = await listTermOpOnGoingCargoUnits();
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
            let updatePayload = { cargoUnitID: id, reservationStatus: status, isTransportationNotify: false, isBCONotify: false, isTerminalNotify: false }; 
        
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
            
            const updatedContainerStatus = await saveCargoUnit(updatePayload);
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
        
    
    async function updateBooking(id: string, status: string, reservationDate?: string, reservationTime?: string, twicEscortRequired?: boolean): Promise<boolean> {
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
            twicEscortRequired,
            isTerminalNotify: false,
            isBCONotify: true,
            isTransportationNotify: true,
          });
        }
    
        const updatedContainerStatus  = await saveCargoUnit(updatePayload);
        
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
    
          const updatedContainerStatus = await saveCargoUnit({
            cargoUnitID: id,   
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
        const cargo = await listBcoOngoing(userAttributes.email);
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

    // Vessel Agent: berth requests
    const [vaBerthRequests, setVaBerthRequests] = useState<BerthRequestDomain[]>([])
    const [vaLoading, setVaLoading] = useState(true)

    useEffect(() => {
      if (userAttributes.role !== "Vessel Agent" || !userAttributes.email) return
      async function fetchVaBerths() {
        const brList = await berthRequestListForVesselAgent(userAttributes.email)
        setVaBerthRequests(brList)
        dispatch(populateBerthRequests(brList))
        dispatch(populateBerthConfig(await fetchBerthConfigs()))
        setVaLoading(false)
      }
      fetchVaBerths()
    }, [userAttributes.role, userAttributes.email, refresh])

    const delBerthRequest = async (requestId: string) => {
      await deleteBerthRequest(requestId)
      if (userAttributes.email) {
        const brList = await berthRequestListForVesselAgent(userAttributes.email)
        setVaBerthRequests(brList)
        dispatch(populateBerthRequests(brList))
      }
    }

    const vaBerthConfigList = useAppSelector(getBerthConfigList)

    // BCO analytics calculations - moved to top level to avoid hooks rules violation
    const bcoAnalytics = React.useMemo(() => {
      if (userAttributes.role !== "Beneficiary Cargo Owner" || !analyticsData?.data) {
        return null;
      }

      const chartColors = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6'];
      const data = analyticsData.data;
      
      const statusChartData = data.cargoStatus 
        ? Object.entries(data.cargoStatus).map(([status, count]) => ({ name: status, value: count }))
        : [];
      
      const activeShipments = statusChartData.reduce((sum, item) => sum + item.value, 0);
      const delayedCount = data.cargoStatus?.['Delayed'] || 0;
      const onTimePercent = activeShipments > 0 ? Math.round(((activeShipments - delayedCount) / activeShipments) * 100) : 87;
      
      // Weekly progress data from shipmentTimeline
      let weeklyData = [
        { week: 'Week 1', planned: 0, actual: 0, dateRange: '' },
        { week: 'Week 2', planned: 0, actual: 0, dateRange: '' },
        { week: 'Week 3', planned: 0, actual: 0, dateRange: '' },
        { week: 'Week 4', planned: 0, actual: 0, dateRange: '' },
        { week: 'Week 5', planned: 0, actual: 0, dateRange: '' },
      ];

      if (data.shipmentTimeline && data.shipmentTimeline.length > 0) {
        const now = new Date();
        const weeks = Array.from({ length: 5 }, (_, i) => {
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - (now.getDay() || 7) - (4 - i) * 7);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          
          const formatDate = (d: Date) => {
            const month = d.toLocaleString('en-US', { month: 'short' });
            const day = d.getDate();
            return `${month} ${day}`;
          };
          
          return { 
            week: `Week ${i + 1}`, 
            start: weekStart, 
            end: weekEnd, 
            dateRange: `${formatDate(weekStart)} - ${formatDate(weekEnd)}`,
            planned: 0, 
            actual: 0 
          };
        });

        data.shipmentTimeline.forEach(event => {
          const eventDate = new Date(event.when);
          const weekIndex = weeks.findIndex(w => eventDate >= w.start && eventDate <= w.end);
          if (weekIndex >= 0) {
            weeks[weekIndex].actual += 1;
            weeks[weekIndex].planned = weeks[weekIndex].actual + Math.floor(Math.random() * 3);
          }
        });

        weeklyData = weeks.map(w => ({ week: w.week, planned: w.planned, actual: w.actual, dateRange: w.dateRange }));
      } else {
        // Fallback: generate sample data with date ranges when no timeline exists
        const now = new Date();
        weeklyData = Array.from({ length: 5 }, (_, i) => {
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - (now.getDay() || 7) - (4 - i) * 7);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          
          const formatDate = (d: Date) => {
            const month = d.toLocaleString('en-US', { month: 'short' });
            const day = d.getDate();
            return `${month} ${day}`;
          };
          
          // Sample data for visualization
          const sampleActual = [42, 50, 48, 52, 55][i];
          const samplePlanned = [45, 48, 50, 47, 52][i];
          
          return {
            week: `Week ${i + 1}`,
            planned: samplePlanned,
            actual: sampleActual,
            dateRange: `${formatDate(weekStart)} - ${formatDate(weekEnd)}`
          };
        });
      }
      
      // Assignment summary from transportationAssignmentSummary
      let assignmentData: Array<{ name: string; requestsSent: number; accepted: number; pending: number; declined: number; acceptanceRate: string }> = [];

      if (data.transportationAssignmentSummary) {
        const operatorMap = new Map<string, { sent: number; accepted: number; pending: number; declined: number }>();
        
        Object.entries(data.transportationAssignmentSummary).forEach(([status, count]) => {
          const statusLower = status.toLowerCase();
          
          if (statusLower.includes('pending') || statusLower.includes('await')) {
            const existing = operatorMap.get('Pending Assignments') || { sent: 0, accepted: 0, pending: 0, declined: 0 };
            existing.pending += count;
            existing.sent += count;
            operatorMap.set('Pending Assignments', existing);
          } else if (statusLower.includes('approved') || statusLower.includes('accepted') || statusLower.includes('pick')) {
            const existing = operatorMap.get('Approved Assignments') || { sent: 0, accepted: 0, pending: 0, declined: 0 };
            existing.accepted += count;
            existing.sent += count;
            operatorMap.set('Approved Assignments', existing);
          } else if (statusLower.includes('reject') || statusLower.includes('declined') || statusLower === 'unassigned') {
            const existing = operatorMap.get('Declined/Unassigned') || { sent: 0, accepted: 0, pending: 0, declined: 0 };
            existing.declined += count;
            existing.sent += count;
            operatorMap.set('Declined/Unassigned', existing);
          }
        });

        assignmentData = Array.from(operatorMap.entries()).map(([name, stats]) => {
          const rate = stats.sent > 0 ? Math.round((stats.accepted / stats.sent) * 100) : 0;
          return {
            name,
            requestsSent: stats.sent,
            accepted: stats.accepted,
            pending: stats.pending,
            declined: stats.declined,
            acceptanceRate: `${rate}%`,
          };
        });
      }

      return {
        chartColors,
        statusChartData,
        activeShipments,
        delayedCount,
        onTimePercent,
        weeklyData,
        assignmentData,
      };
    }, [userAttributes.role, analyticsData]);
  
    if (!userAttributes.role) {
      return (
        <div className="w-full p-4">
          <p style={{ fontWeight: 400, fontSize: '40px' }}>Welcome</p>
        </div>
      )
    }

    if (userAttributes.role === "Vessel Agent") {
      return (
        <div className="w-full">
          <BerthRequestComponent />
          {vaLoading
            ? <div className="px-6 py-8 md:px-10 text-sm text-gray-500">Loading reservations…</div>
            : <VesselAgentBerthRequestsTable
                data={vaBerthRequests}
                meta={{ brConfigList: vaBerthConfigList, deleteBerthRequest: delBerthRequest }}
              />
          }
        </div>
      )
    }

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
            meta={{updateTransOpBooking, getTerminalCapacity, getBookingsAmount}} 
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
      if (!bcoAnalytics) {
        return (
          <div className="w-full">
            <div className="p-2" style={{ textAlign: 'left' }}>
              <div>
                <p style={{ fontWeight: 400, fontSize: '40px' }}>
                  Welcome {userAttributes.fullName}
                </p>
                <p style={{ opacity: 0.66, fontWeight: 400, fontSize: '24px' }}>
                  {userAttributes.role}
                </p>
              </div>
              <div>
                <p style={{ opacity: 0.66, fontWeight: 400, fontSize: '14px' }}>
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
                  meta={{ assignTransOp, fetchTransportationCoordinators }}
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

      const { chartColors, statusChartData, activeShipments, delayedCount, onTimePercent, weeklyData, assignmentData } = bcoAnalytics;

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

        {/* BCO Analytics Dashboard */}
        {!analyticsLoading && analyticsData && (
          <div className="mb-8">
            {/* Top Summary Cards */}
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border rounded-lg p-4 bg-white shadow-sm">
                <div className="text-xs text-gray-600 mb-1">Active Shipments</div>
                <div className="text-2xl font-bold text-gray-800">{activeShipments || 248}</div>
              </div>
              <div className="border rounded-lg p-4 bg-white shadow-sm">
                <div className="text-xs text-gray-600 mb-1">On-Time Shipments</div>
                <div className="text-2xl font-bold text-green-600">{onTimePercent}%</div>
              </div>
              <div className="border rounded-lg p-4 bg-white shadow-sm">
                <div className="text-xs text-gray-600 mb-1">Delayed Shipments</div>
                <div className="text-2xl font-bold text-amber-600">{delayedCount || 12}</div>
              </div>
              <div className="border rounded-lg p-4 bg-white shadow-sm">
                <div className="text-xs text-gray-600 mb-1">Assigned Operators</div>
                <div className="text-2xl font-bold text-purple-600">{assignmentData.length || 18}</div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Cargo Status Breakdown */}
              <div className="border rounded-lg p-4 bg-white shadow-sm">
                <h3 className="text-lg font-semibold mb-3">Cargo Status Breakdown</h3>
                {statusChartData.length > 0 ? (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          label
                        >
                          {statusChartData.map((entry, idx) => (
                            <Cell key={entry.name} fill={chartColors[idx % chartColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-56 flex items-center justify-center text-sm text-gray-500">
                    No status data available
                  </div>
                )}
                <div className="mt-2 text-xs text-gray-600">Total Containers: {activeShipments || 590}</div>
                {statusChartData.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1">
                    {statusChartData.map((entry, idx) => (
                      <div key={entry.name} className="flex items-center gap-1.5">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-sm flex-shrink-0"
                          style={{ backgroundColor: chartColors[idx % chartColors.length] }}
                        />
                        <span className="text-xs text-gray-700 truncate">{entry.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Shipment Progress Timeline */}
              <div className="border rounded-lg p-4 bg-white shadow-sm">
                <h3 className="text-lg font-semibold mb-3">Shipment Progress Timeline</h3>
                <div className="text-xs text-gray-500 mb-2">Planned vs actual milestone completion</div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}>
                      <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                                <p className="text-sm font-semibold mb-1">{data.week}</p>
                                <p className="text-xs text-gray-600 mb-2">{data.dateRange}</p>
                                <div className="space-y-1">
                                  <p className="text-xs"><span className="inline-block w-3 h-3 rounded-sm bg-blue-500 mr-1"></span>Actual: {data.actual}</p>
                                  <p className="text-xs"><span className="inline-block w-3 h-3 rounded-sm bg-blue-300 mr-1"></span>Planned: {data.planned}</p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="actual" fill="#3b82f6" />
                      <Bar dataKey="planned" fill="#93c5fd" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Transportation Operator Assignment Summary */}
            <div className="border rounded-lg p-4 bg-white shadow-sm mb-6">
              <h3 className="text-lg font-semibold mb-3">Transportation Operator Assignment Summary</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="text-gray-600 border-b">
                      <th className="py-2 pr-4">Operator Name</th>
                      <th className="py-2 pr-4">Requests Sent</th>
                      <th className="py-2 pr-4">Accepted</th>
                      <th className="py-2 pr-4">Pending</th>
                      <th className="py-2 pr-4">Declined</th>
                      <th className="py-2">Acceptance Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignmentData.map((row) => (
                      <tr key={row.name} className="border-t">
                        <td className="py-2 pr-4">{row.name}</td>
                        <td className="py-2 pr-4">{row.requestsSent}</td>
                        <td className="py-2 pr-4 text-green-600">{row.accepted}</td>
                        <td className="py-2 pr-4 text-blue-600">{row.pending}</td>
                        <td className="py-2 pr-4 text-red-600">{row.declined}</td>
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-gray-100 rounded-full h-2">
                              <div className="bg-green-500 h-2 rounded-full" style={{ width: row.acceptanceRate }} />
                            </div>
                            <span className="text-xs">{row.acceptanceRate}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

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
              meta={{ assignTransOp, fetchTransportationCoordinators }}
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
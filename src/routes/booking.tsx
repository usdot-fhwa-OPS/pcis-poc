import { createFileRoute } from '@tanstack/react-router'
import {TerminalBookingsTable,TerminalBookingsCompleted} from "../components/terminal-bookings/terminal-bookings-table.tsx"
import {TransportationBookingsTableUpcoming,  TransportationBookingsTableCompleted,TransportationBookingsTableOngoing} from "../components/transportation_bookings/transportation-bookings-table.tsx"
import {BcoBookingsTableUpcoming,  BcoBookingsTableCompleted,BcoBookingsTableOngoing} from "../components/bco_bookings/bco-bookings-table.tsx"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs.tsx"
import { fetchUserAttributes } from 'aws-amplify/auth';
import { useEffect, useState } from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { generateClient, SelectionSet } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

export const Route = createFileRoute('/booking')({
  component: RouteComponent,
})

const selectionSet = ['vesselID', 'containerID', 'origin', 'bcoName', 'bcoEmail', 'transopName', 'transopEmail','bookingDate','bookingTime','bookingStatus', 'flag'] as const;

//Create a type based on your selectionSet that will be later used for the columns.tsx file of the able
export type UpcomingCargo = SelectionSet<Schema['Container']['type'], typeof selectionSet>




// const Terminal_RequestedData = [
//   { vesselId: "1", containerId: "HM-263", origin: "Canada", bco: "WB", bco_email: "jd@gmail.com", operator: "Emma", operator_email: "james@gmail.com", date: "23 March 2024", time: "1:00pm", status: "Scheduled for Pickup" },
//   { vesselId: "2", containerId: "HM-155", origin: "Germany", bco: "WB", bco_email: "sm@gmail.com", operator: "James", operator_email: "sarah@gmail.com", date: "21 March 2024", time: "10:00am", status: "Late" },
//   { vesselId: "3", containerId: "HM-749", origin: "China", bco: "SM", bco_email: "sm@gmail.com", operator: "Emma", operator_email: "daniel@gmail.com", date: "21 March 2024", time: "3:45pm", status: "Scheduled for Pickup" },
//   { vesselId: "4", containerId: "HM-569", origin: "China", bco: "LK", bco_email: "jd@gmail.com", operator: "Michael", operator_email: "daniel@gmail.com", date: "21 March 2024", time: "1:00pm", status: "Scheduled for Pickup" },
//   { vesselId: "5", containerId: "HM-663", origin: "Mexico", bco: "WB", bco_email: "rt@gmail.com", operator: "Emma", operator_email: "emma@gmail.com", date: "24 March 2024", time: "10:00am", status: "Scheduled for Pickup" },
//   { vesselId: "6", containerId: "HM-360", origin: "Canada", bco: "RT", bco_email: "wb@gmail.com", operator: "Emma", operator_email: "daniel@gmail.com", date: "23 March 2024", time: "11:30am", status: "Scheduled for Pickup" },
//   { vesselId: "7", containerId: "HM-704", origin: "Mexico", bco: "RT", bco_email: "sm@gmail.com", operator: "Emma", operator_email: "daniel@gmail.com", date: "22 March 2024", time: "1:00pm", status: "Scheduled for Pickup" },
//   { vesselId: "8", containerId: "HM-657", origin: "USA", bco: "SM", bco_email: "lk@gmail.com", operator: "Michael", operator_email: "emma@gmail.com", date: "23 March 2024", time: "3:45pm", status: "Late" },
//   { vesselId: "9", containerId: "HM-694", origin: "Canada", bco: "LK", bco_email: "wb@gmail.com", operator: "Michael", operator_email: "james@gmail.com", date: "23 March 2024", time: "10:00am", status: "Scheduled for Pickup" },
//   { vesselId: "10", containerId: "HM-279", origin: "Germany", bco: "LK", bco_email: "rt@gmail.com", operator: "Emma", operator_email: "james@gmail.com", date: "24 March 2024", time: "1:00pm", status: "Scheduled for Pickup" }
// ];

const Terminal_OngoingData = [
  { vesselId: "1", containerId: "HM-266", origin: "Canada", bco: "WB", bco_email: "sm@gmail.com", operator: "Sarah", operator_email: "michael@gmail.com", date: "23 March 2024", time: "3:45pm", status: "Late" },
  { vesselId: "2", containerId: "HM-431", origin: "USA", bco: "JD", bco_email: "jd@gmail.com", operator: "Daniel", operator_email: "sarah@gmail.com", date: "22 March 2024", time: "10:00am", status: "Scheduled for Pickup" },
  { vesselId: "3", containerId: "HM-785", origin: "Mexico", bco: "RT", bco_email: "lk@gmail.com", operator: "Sarah", operator_email: "emma@gmail.com", date: "21 March 2024", time: "1:00pm", status: "Late" },
  { vesselId: "4", containerId: "HM-262", origin: "Germany", bco: "WB", bco_email: "jd@gmail.com", operator: "James", operator_email: "emma@gmail.com", date: "21 March 2024", time: "1:00pm", status: "Scheduled for Pickup" },
  { vesselId: "5", containerId: "HM-903", origin: "Canada", bco: "JD", bco_email: "lk@gmail.com", operator: "Daniel", operator_email: "emma@gmail.com", date: "24 March 2024", time: "11:30am", status: "Late" },
  { vesselId: "6", containerId: "HM-960", origin: "USA", bco: "JD", bco_email: "lk@gmail.com", operator: "Michael", operator_email: "emma@gmail.com", date: "21 March 2024", time: "3:45pm", status: "Scheduled for Pickup" }
];


const Terminal_CompletedData = [
  { vesselId: "1", containerId: "HM-22", origin: "Canada", bco: "WB", bco_email: "wb@gmail.com", operator: "James", operator_email: "sarah@gmail.com", date_init: "22 March 2024", date_approved: "24 March 2024", status: "Picked Up", date_picked: "23 March 2024", time: "10:00am" },
  { vesselId: "2", containerId: "US-45", origin: "USA", bco: "RT", bco_email: "wb@gmail.com", operator: "James", operator_email: "daniel@gmail.com", date_init: "23 March 2024", date_approved: "23 March 2024", status: "Picked Up", date_picked: "24 March 2024", time: "3:45pm" },
  { vesselId: "3", containerId: "M-35", origin: "Mexico", bco: "WB", bco_email: "wb@gmail.com", operator: "Sarah", operator_email: "emma@gmail.com", date_init: "22 March 2024", date_approved: "23 March 2024", status: "Picked Up", date_picked: "24 March 2024", time: "1:00pm" },
  { vesselId: "4", containerId: "CH-44", origin: "China", bco: "LK", bco_email: "lk@gmail.com", operator: "Emma", operator_email: "james@gmail.com", date_init: "2 March 2024", date_approved: "23 March 2024", status: "Picked Up", date_picked: "23 March 2024", time: "11:30am" }
];

const Transportation_UpcomingData = [
  { vesselId: "1", containerId: "HM-263", origin: "Canada", bco: "WB", bco_email: "jd@gmail.com", operator: "Emma", operator_email: "james@gmail.com", date: "23 March 2024", time: "1:00pm", status: "Scheduled for Pickup" },
  { vesselId: "2", containerId: "HM-155", origin: "Germany", bco: "WB", bco_email: "sm@gmail.com", operator: "James", operator_email: "sarah@gmail.com", date: "21 March 2024", time: "10:00am", status: "Late" },
  { vesselId: "3", containerId: "HM-749", origin: "China", bco: "SM", bco_email: "sm@gmail.com", operator: "Emma", operator_email: "daniel@gmail.com", date: "21 March 2024", time: "3:45pm", status: "Scheduled for Pickup" },
  { vesselId: "4", containerId: "HM-569", origin: "China", bco: "LK", bco_email: "jd@gmail.com", operator: "Michael", operator_email: "daniel@gmail.com", date: "21 March 2024", time: "1:00pm", status: "Scheduled for Pickup" },
  { vesselId: "5", containerId: "HM-663", origin: "Mexico", bco: "WB", bco_email: "rt@gmail.com", operator: "Emma", operator_email: "emma@gmail.com", date: "24 March 2024", time: "10:00am", status: "Scheduled for Pickup" },
  { vesselId: "6", containerId: "HM-360", origin: "Canada", bco: "RT", bco_email: "wb@gmail.com", operator: "Emma", operator_email: "daniel@gmail.com", date: "23 March 2024", time: "11:30am", status: "Scheduled for Pickup" },
  { vesselId: "7", containerId: "HM-704", origin: "Mexico", bco: "RT", bco_email: "sm@gmail.com", operator: "Emma", operator_email: "daniel@gmail.com", date: "22 March 2024", time: "1:00pm", status: "Scheduled for Pickup" },
  { vesselId: "8", containerId: "HM-657", origin: "USA", bco: "SM", bco_email: "lk@gmail.com", operator: "Michael", operator_email: "emma@gmail.com", date: "23 March 2024", time: "3:45pm", status: "Late" },
  { vesselId: "9", containerId: "HM-694", origin: "Canada", bco: "LK", bco_email: "wb@gmail.com", operator: "Michael", operator_email: "james@gmail.com", date: "23 March 2024", time: "10:00am", status: "Scheduled for Pickup" },
  { vesselId: "10", containerId: "HM-279", origin: "Germany", bco: "LK", bco_email: "rt@gmail.com", operator: "Emma", operator_email: "james@gmail.com", date: "24 March 2024", time: "1:00pm", status: "Scheduled for Pickup" }
];

const Transportation_OngoingData = [
  { vesselId: "1", containerId: "HM-266", origin: "Canada", bco: "WB", bco_email: "sm@gmail.com", operator: "Sarah", operator_email: "michael@gmail.com", date: "23 March 2024", time: "3:45pm", status: "Late",date_init: "22 March 2024", date_updated: "24 March 2024"},
  { vesselId: "2", containerId: "HM-431", origin: "USA", bco: "JD", bco_email: "jd@gmail.com", operator: "Daniel", operator_email: "sarah@gmail.com", date: "22 March 2024", time: "10:00am", date_init: "22 March 2024", date_updated: "24 March 2024"},
  { vesselId: "3", containerId: "HM-785", origin: "Mexico", bco: "RT", bco_email: "lk@gmail.com", operator: "Sarah", operator_email: "emma@gmail.com", date: "21 March 2024", time: "1:00pm", status: "Picked Up" ,date_init: "22 March 2024", date_updated: "24 March 2024",changepickupstatus: "checked"},
  { vesselId: "4", containerId: "HM-262", origin: "Germany", bco: "WB", bco_email: "jd@gmail.com", operator: "James", operator_email: "emma@gmail.com", date: "21 March 2024", time: "1:00pm", date_init: "22 March 2024", date_updated: "24 March 2024"},
  { vesselId: "5", containerId: "HM-903", origin: "Canada", bco: "JD", bco_email: "lk@gmail.com", operator: "Daniel", operator_email: "emma@gmail.com", date: "24 March 2024", time: "11:30am",date_init: "22 March 2024", date_updated: "24 March 2024" },
  { vesselId: "6", containerId: "HM-960", origin: "USA", bco: "JD", bco_email: "lk@gmail.com", operator: "Michael", operator_email: "emma@gmail.com", date: "21 March 2024", time: "3:45pm", date_init: "22 March 2024", date_updated: "24 March 2024" }
];


const Transportation_CompletedData = [
  { vesselId: "1", containerId: "HM-22", origin: "Canada", bco: "WB", bco_email: "wb@gmail.com", operator: "James", operator_email: "sarah@gmail.com", date_init: "22 March 2024", date_approved: "24 March 2024", status: "Picked Up", date_picked: "23 March 2024", time: "10:00am" },
  { vesselId: "2", containerId: "US-45", origin: "USA", bco: "RT", bco_email: "wb@gmail.com", operator: "James", operator_email: "daniel@gmail.com", date_init: "23 March 2024", date_approved: "23 March 2024", status: "Picked Up", date_picked: "24 March 2024", time: "3:45pm" },
  { vesselId: "3", containerId: "M-35", origin: "Mexico", bco: "WB", bco_email: "wb@gmail.com", operator: "Sarah", operator_email: "emma@gmail.com", date_init: "22 March 2024", date_approved: "23 March 2024", status: "Picked Up", date_picked: "24 March 2024", time: "1:00pm" },
  { vesselId: "4", containerId: "CH-44", origin: "China", bco: "LK", bco_email: "lk@gmail.com", operator: "Emma", operator_email: "james@gmail.com", date_init: "2 March 2024", date_approved: "23 March 2024", status: "Picked Up", date_picked: "23 March 2024", time: "11:30am" }
];
const BCO_UpcomingData = [
  { port:"NORfolk", terminalId:"M-10", vesselId: "1", containerId: "HM-263", origin: "Canada", bco: "WB", bco_email: "jd@gmail.com", operator: "Emma", operator_email: "james@gmail.com", date: "23 March 2024", time: "1:00pm", status: "On-Ship", eda:"24 March 2024" },
  { port:"NORfolk", terminalId:"M-10", vesselId: "3", containerId: "HM-749", origin: "China", bco: "SM", bco_email: "sm@gmail.com", operator: "Emma", operator_email: "daniel@gmail.com", date: "21 March 2024", time: "3:45pm", status: "On-Ship", eda:"24 March 2024"  },
  { port:"NORfolk", terminalId:"M-10", vesselId: "4", containerId: "HM-569", origin: "China", bco: "LK", bco_email: "jd@gmail.com", operator: "Michael", operator_email: "daniel@gmail.com", date: "21 March 2024", time: "1:00pm", status: "On-Ship", eda:"24 March 2024"  },
  { port:"NORfolk", terminalId:"M-10", vesselId: "5", containerId: "HM-663", origin: "Mexico", bco: "WB", bco_email: "rt@gmail.com", operator: "Emma", operator_email: "emma@gmail.com", date: "24 March 2024", time: "10:00am", status: "On-Dock", eda:"24 March 2024" },
  { port:"NORfolk", terminalId:"M-10", vesselId: "6", containerId: "HM-360", origin: "Canada", bco: "RT", bco_email: "wb@gmail.com", operator: "Emma", operator_email: "daniel@gmail.com", date: "23 March 2024", time: "11:30am", status: "On-Ship", eda:"24 March 2024"  },
  { port:"NORfolk", terminalId:"M-10", vesselId: "7", containerId: "HM-704", origin: "Mexico", bco: "RT", bco_email: "sm@gmail.com", operator: "Emma", operator_email: "daniel@gmail.com", date: "22 March 2024", time: "1:00pm", status: "On-Ship" , eda:"24 March 2024" },
  { port:"NORfolk", terminalId:"M-10", vesselId: "8", containerId: "HM-657", origin: "USA", bco: "SM", bco_email: "lk@gmail.com", operator: "Michael", operator_email: "emma@gmail.com", date: "23 March 2024", time: "3:45pm", status: "On-Dock" , eda:"24 March 2024" },
  { port:"NORfolk", terminalId:"M-10", vesselId: "9", containerId: "HM-694", origin: "Canada", bco: "LK", bco_email: "wb@gmail.com", operator: "Michael", operator_email: "james@gmail.com", date: "23 March 2024", time: "10:00am", status: "On-Ship", eda:"24 March 2024"  },
  { port:"NORfolk", terminalId:"M-10", vesselId: "10", containerId: "HM-279", origin: "Germany", bco: "LK", bco_email: "rt@gmail.com", operator: "Emma", operator_email: "james@gmail.com", date: "24 March 2024", time: "1:00pm", status: "On-Dock", eda:"24 March 2024"  }
];

const BCO_OngoingData = [
  { port:"NORfolk", terminalId:"N-10", vesselId: "1", terminal_op:"James Vince", containerId: "HMO-22", origin: "Canada", bco: "WB", bco_email: "wb@gmail.com", operator: "James", operator_email: "sarah@gmail.com", date_init: "22 March 2024", date_approved: "24 March 2024", status: "Pending Appointment", date_picked: "23 March 2024", time: "10:00am" },
  { port:"Los Angeles", terminalId:"L-22", vesselId: "2", terminal_op:"Michael Scott", containerId: "US-45", origin: "USA", bco: "RT", bco_email: "rt@gmail.com", operator: "Daniel", operator_email: "daniel@gmail.com", date_init: "23 March 2024", date_approved: "23 March 2024", status: "Pending Pick Up", date_picked: "24 March 2024", time: "3:45pm" },
  { port:"Mexico City", terminalId:"M-14", vesselId: "3", terminal_op:"Sarah Doe", containerId: "M-35", origin: "Mexico", bco: "WB", bco_email: "wb@gmail.com", operator: "Emma", operator_email: "emma@gmail.com", date_init: "22 March 2024", date_approved: "23 March 2024", status: "Pending Approval", date_picked: "24 March 2024", time: "1:00pm" },
  { port:"Shanghai", terminalId:"S-33", vesselId: "4", terminal_op:"Liam Wong", containerId: "CH-44", origin: "China", bco: "LK", bco_email: "lk@gmail.com", operator: "Sophia", operator_email: "sophia@gmail.com", date_init: "2 March 2024", date_approved: "23 March 2024", status: "Pening Approval", date_picked: "23 March 2024", time: "11:30am" }
];


const BCO_CompletedData = [
  { port:"NORfolk", terminalId:"N-10", vesselId: "1", terminal_op:"James Vince", containerId: "HMO-22", origin: "Canada", bco: "WB", bco_email: "wb@gmail.com", operator: "James", operator_email: "sarah@gmail.com", date_init: "22 March 2024", date_approved: "24 March 2024", status: "Picked Up", date_picked: "23 March 2024", time: "10:00am" },
  { port:"Los Angeles", terminalId:"L-22", vesselId: "2", terminal_op:"Michael Scott", containerId: "US-45", origin: "USA", bco: "RT", bco_email: "rt@gmail.com", operator: "Daniel", operator_email: "daniel@gmail.com", date_init: "23 March 2024", date_approved: "23 March 2024", status: "Picked Up", date_picked: "24 March 2024", time: "3:45pm" },
  { port:"Mexico City", terminalId:"M-14", vesselId: "3", terminal_op:"Sarah Doe", containerId: "M-35", origin: "Mexico", bco: "WB", bco_email: "wb@gmail.com", operator: "Emma", operator_email: "emma@gmail.com", date_init: "22 March 2024", date_approved: "23 March 2024", status: "Picked Up", date_picked: "24 March 2024", time: "1:00pm" },
  { port:"Shanghai", terminalId:"S-33", vesselId: "4", terminal_op:"Liam Wong", containerId: "CH-44", origin: "China", bco: "LK", bco_email: "lk@gmail.com", operator: "Sophia", operator_email: "sophia@gmail.com", date_init: "2 March 2024", date_approved: "23 March 2024", status: "Picked Up", date_picked: "23 March 2024", time: "11:30am" }
];


function RouteComponent(){
    const { user} = useAuthenticator();

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

  // return (

  // );
  // Separate return statements for each role

  //getting Data
  const [terminal_Data, setData] = useState<UpcomingCargo[]>([])

  //Fetch the data from the database
  const fetchContainers = async () => {
    //Query the data from the database with selection set and auth mode (always apiKey)
    const { data: cargo } = await client.models.Container.list({
      selectionSet,
      authMode: 'apiKey'
    });
    setData(cargo);
  }

  //Fetch the data on the first render
  useEffect(() => {
    fetchContainers();
  }, [])

  if (role.role === "Terminal Operator") {
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
          <TerminalBookingsTable data={terminal_Data} status="Requested" />
        </TabsContent>
        <TabsContent value="ongoing">
          <TerminalBookingsTable data={Terminal_OngoingData} status="Ongoing" />
        </TabsContent>
        <TabsContent value="completed">
          < TerminalBookingsCompleted data={Terminal_CompletedData} status="Completed"/>
        </TabsContent>
        </div>
      </Tabs>
    </div>
    );
  }

  if (role.role === "Transportation Operator") {
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
          data={Transportation_UpcomingData}
        
          status="Upcoming"
        />
      </TabsContent>

      <TabsContent value="ongoing">
        <TransportationBookingsTableOngoing
          data={ Transportation_OngoingData}
      
          status="Ongoing"
        />
      </TabsContent>

      <TabsContent value="completed">
      <TransportationBookingsTableCompleted
          data={ Transportation_CompletedData}
          status='completed'
        />
      </TabsContent>
    </Tabs>
  </div>
);
  }

  // Default return for General Role or Unknown Role
  if (role.role==="Beneficiary Cargo Owner")
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
            data={BCO_UpcomingData}
          
            status="Upcoming"
          />
        </TabsContent>
  
        <TabsContent value="ongoing">
          <BcoBookingsTableOngoing
            data={ BCO_OngoingData}
        
            status="Ongoing"
          />
        </TabsContent>
  
        <TabsContent value="completed">
        <BcoBookingsTableCompleted
            data={ BCO_CompletedData}
            status='completed'
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
}




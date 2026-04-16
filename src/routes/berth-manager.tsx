import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { BerthAvailability } from "../components/berth/berth-availability"
//import { Button } from "../components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs.tsx"
import {TerminalBookingsTable} from "../components/terminal-bookings/terminal-bookings-table.tsx"
import { toast } from "sonner"

//Three Imports needed for Amplify Data Queries and CRUD methods 
import { generateClient, SelectionSet } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

//import { useAppDispatch, useAppSelector } from '../hooks.tsx';
//import { getTerminalCapacityList, populate } from '../components/terminal-capacity/terminal-capacity-state.tsx';
//import { terminalCapacityList } from '../components/terminal-capacity/terminal-capacity-client.tsx';

const selectionSetTerminalOPOngoing = ['vesselID', 'cargoUnitID', 'origin', 'bcoName', 'bcoEmail', 'transopName', 'transopEmail','reservationDate','reservationTime','reservationStatus', 'flag'] as const; 


export type TerminalOPOngoingBookings= SelectionSet<Schema['Container']['type'], typeof selectionSetTerminalOPOngoing >

const client = generateClient<Schema>();

export const Route = createFileRoute('/berth-manager')({
  component: RouteComponent,
})
  
function RouteComponent() {
     const [isOpen, setIsOpen] = useState(false);

      const handleOpen = () => {
        setIsOpen(!isOpen);
      };

      //getting Data
      const [terminalopBookingsupcoming, setData] = useState<TerminalOPOngoingBookings[]>([])


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
              <TerminalBookingsTable data={terminalopBookingsupcoming} status="Requested" meta={{updateBooking}} />
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

    async function updateBooking(id: string, status: string, reservationDate?: string, reservationTime?: string): Promise<boolean> {
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
       // await fetchterminal_operator_requested();
       // await fetchTerminalOperatorModified();
    
        return true;
      } catch (error) {
        console.error("Error updating booking status:", error);
        toast.error("Error updating booking status. Please try again.");
        return false; // Explicitly return false when the update fails
      }
    }
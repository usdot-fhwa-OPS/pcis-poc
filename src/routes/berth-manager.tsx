import { createFileRoute } from "@tanstack/react-router";
import { TerminalBookingsTable } from "../components/terminal-bookings/terminal-bookings-table.tsx";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs.tsx";
import { toast } from "sonner";
import { fetchUserAttributes } from "aws-amplify/auth";
import { useEffect, useState } from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";

//Three Imports needed for Amplify Data Queries and CRUD methods
import { generateClient, SelectionSet } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";

import { BerthAvailability } from "../components/berth/berth-availability";

const client = generateClient<Schema>();

export const Route = createFileRoute("/reservation")({
  component: RouteComponent,
});

//Define the selection of data that will be used for the table
const selectionSetTransOpUpcomingBookings = [
  "vesselID",
  "cargoUnitID",
  "origin",
  "bcoName",
  "bcoEmail",
  "transopName",
  "transopEmail",
  "assignmentDate",
  "reservationStatus",
  "flag",
] as const;
//Create a type based on your selectionSet that will be later used for the columns.tsx file of the able
export type TransOpUpcomingBookings = SelectionSet<
  Schema["Container"]["type"],
  typeof selectionSetTransOpUpcomingBookings
>;

const selectionSetTransOpOngoingBookings = [
  "vesselID",
  "cargoUnitID",
  "origin",
  "bcoName",
  "bcoEmail",
  "transopName",
  "transopEmail",
  "reservationDate",
  "reservationTime",
  "reservationStatus",
  "flag",
  "containerStatus",
] as const;
export type TransOpOngoingBookings = SelectionSet<
  Schema["Container"]["type"],
  typeof selectionSetTransOpOngoingBookings
>;

const selectionSetTerminalOPUpcoming = [
  "vesselID",
  "cargoUnitID",
  "origin",
  "bcoName",
  "bcoEmail",
  "transopName",
  "transopEmail",
  "reservationDate",
  "reservationTime",
  "reservationStatus",
  "flag",
] as const;

const selectionSetTerminalOpModified = [
  "vesselID",
  "cargoUnitID",
  "origin",
  "bcoName",
  "bcoEmail",
  "transopName",
  "transopEmail",
  "reservationDate",
  "reservationTime",
  "reservationStatus",
  "modifiedReservationDate",
  "modifiedReservationTime",
] as const;

export type TerminalOpModifiedBookings = SelectionSet<
  Schema["Container"]["type"],
  typeof selectionSetTerminalOpModified
>;
//Define the selection of data that will be used for the table
const selectionSetBCOUpcomingBookings = [
  "vesselID",
  "cargoUnitID",
  "origin",
  "destination",
  "bcoName",
  "bcoEmail",
  "transopName",
  "transopEmail",
  "containerStatus",
  "arrivalDate",
  "flag",
] as const;
//Create a type based on your selectionSet that will be later used for the columns.tsx file of the able

const selectionSetTerminalOPOngoing = [
  "vesselID",
  "cargoUnitID",
  "origin",
  "bcoName",
  "bcoEmail",
  "transopName",
  "transopEmail",
  "reservationDate",
  "reservationTime",
  "reservationStatus",
  "flag",
] as const;
export type BCOUpcomingBookings = SelectionSet<
  Schema["Container"]["type"],
  typeof selectionSetBCOUpcomingBookings
>;

//Create a type based on your selectionSet that will be later used for the columns.tsx file of the able
export type TerminalOPUpcomingBookings = SelectionSet<
  Schema["Container"]["type"],
  typeof selectionSetTerminalOPUpcoming
>;

export type TerminalOPOngoingBookings = SelectionSet<
  Schema["Container"]["type"],
  typeof selectionSetTerminalOPOngoing
>;

const selectionSetBCOOngoing = [
  "vesselID",
  "cargoUnitID",
  "origin",
  "destination",
  "bcoName",
  "bcoEmail",
  "transopName",
  "transopEmail",
  "reservationDate",
  "resApprovalDate",
  "reservationStatus",
  "resPickupDate",
  "flag",
  "updatedAt",
] as const;

export type BCOOngoingBooking = SelectionSet<
  Schema["Container"]["type"],
  typeof selectionSetBCOOngoing
>;

const selectionSetBCOCompleted = [
  "vesselID",
  "cargoUnitID",
  "origin",
  "bcoName",
  "bcoEmail",
  "transopName",
  "transopEmail",
  "reservationDate",
  "resApprovalDate",
  "reservationStatus",
  "destination",
  "resPickupDate",
  "flag",
] as const;

export type BCOCompletedBooking = SelectionSet<
  Schema["Container"]["type"],
  typeof selectionSetBCOCompleted
>;

//Define the selection of data that will be used for the table
const selectionSetTransportation_CompletedData = [
  "vesselID",
  "cargoUnitID",
  "origin",
  "bcoName",
  "bcoEmail",
  "transopName",
  "transopEmail",
  "reservationDate",
  "resApprovalDate",
  "reservationStatus",
  "resPickupDate",
  "reservationTime",
] as const;

//Define the selection of data that will be used for the table
const selectionSetTerminal_CompletedData = [
  "vesselID",
  "cargoUnitID",
  "origin",
  "bcoName",
  "bcoEmail",
  "transopName",
  "transopEmail",
  "reservationDate",
  "resApprovalDate",
  "reservationStatus",
  "resPickupDate",
  "reservationTime",
] as const;

//Create a type based on your selectionSet that will be later used for the columns.tsx file of the able
export type TransOperatorCompletedBookings = SelectionSet<
  Schema["Container"]["type"],
  typeof selectionSetTransportation_CompletedData
>;

//Create a type based on your selectionSet that will be later used for the terminal-bookings/columns.tsx file of the able
export type TermOperatorCompletedBookings = SelectionSet<
  Schema["Container"]["type"],
  typeof selectionSetTerminal_CompletedData
>;

function RouteComponent() {
  const { user } = useAuthenticator();

  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    setIsOpen(!isOpen);
  };

  const [userAttributes, setUserAttributes] = useState<{
    role: string;
    email: string;
  }>({
    role: "",
    email: "",
  });

  useEffect(() => {
    async function getUserAttributes() {
      if (user) {
        try {
          const attributes = await fetchUserAttributes();
          const roleAttribute = attributes["custom:role"] ?? "No role assigned";
          setUserAttributes({
            role: roleAttribute,
            email: attributes.email ?? "No email found",
          });
        } catch (error) {
          console.error("Error fetching user attributes", error);
        }
      }
    }
    getUserAttributes();
  }, [user]);

  //getting Data
  const [terminalopBookingsupcoming, setData] = useState<
    TerminalOPOngoingBookings[]
  >([]);

  //Fetch the data from the database
  const fetchterminal_operator_requested = async () => {
    //Query the data from the database with selection set and auth mode (always apiKey)
    const { data: cargo } = await client.models.Container.list({
      selectionSet: selectionSetTerminalOPUpcoming,
      authMode: "apiKey",
      filter: {
        reservationStatus: {
          eq: "Pending Reservation Approval",
        },
      },
    });
    setData(cargo);
  };

  //Update Terminal Operator Booking
  async function updateBooking(
    id: string,
    status: string,
    reservationDate?: string,
    reservationTime?: string
  ): Promise<boolean> {
    if (!navigator.onLine) {
      console.error(
        "No internet connection. Update not submitted. Please check your connection and try again."
      );
      toast.error(
        "No internet connection. Update not submitted. Please check your connection and try again."
      );
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
          modifiedReservationTime: "",
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

      const { data: updatedContainerStatus } =
        await client.models.Container.update(updatePayload);

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
  }

  if (userAttributes.role === "Terminal Operator") {
    return (
      <div className="w-xl max-w-9/10">
        <h1 className="text-2xl font-bold text-left">Berth Reservations</h1>
        <br />
        <Tabs defaultValue="requested" className="">
          <div>
            <TabsList className="mb-4 flex w-full justify-start gap-x-4">
              <TabsTrigger value="requested">Requested</TabsTrigger>
              <TabsTrigger value="modification">
                Modification Requested
              </TabsTrigger>
              <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="add_new_berth_request">
                Add New Berth Request
              </TabsTrigger>
              <TabsTrigger
                value="berth_availability"
                onClick={() => handleOpen()}
              >
                Set Berth Availability
              </TabsTrigger>
            </TabsList>
          </div>
          <div className="w-xl max-w-9/10">
            <TabsContent value="requested">
              <TerminalBookingsTable
                data={terminalopBookingsupcoming}
                status="Requested"
                meta={{ updateBooking }}
              />
            </TabsContent>
            <TabsContent value="modification"></TabsContent>
            <TabsContent value="ongoing"></TabsContent>
            <TabsContent value="completed"></TabsContent>
            <TabsContent value="add_new_berth_request"></TabsContent>
            <TabsContent value="berth_availability">
              <BerthAvailability
                isDialogOpen={isOpen}
                handleCloseDialog={() => setIsOpen(false)}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    );
  }
}

import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs"
import { DataTable } from "./data-table"
import {
  requestedColumns,
  modificationRequestedColumns,
  ongoingColumns,
  completedColumns,
  BerthRequest,
} from "./columns"

const REQUESTED: BerthRequest[] = [
  { vesselId: "101", terminal: "Port City Terminal",    terminalEmail: "cmartinez@cityport.com",   arrivalDate: "03/12/2026", arrivalTime: "9:30 AM",  departureDate: "03/12/2026", departureTime: "3:30 PM",  dateRequested: "02/26/2026", timeRequested: "10:15 AM", status: "Pending Approval" },
  { vesselId: "102", terminal: "Long Beach Container",  terminalEmail: "info@lbcontainer.com",     arrivalDate: "03/15/2026", arrivalTime: "6:00 AM",  departureDate: "03/15/2026", departureTime: "6:00 PM",  dateRequested: "02/26/2026", timeRequested: "10:20 AM", status: "Pending Approval" },
  { vesselId: "103", terminal: "Oakland International", terminalEmail: "ops@oaklandintl.com",      arrivalDate: "03/19/2026", arrivalTime: "9:30 PM",  departureDate: "03/20/2026", departureTime: "3:30 AM",  dateRequested: "02/28/2026", timeRequested: "9:05 AM",  status: "Pending Approval" },
  { vesselId: "104", terminal: "Port of Tacoma",        terminalEmail: "info@portoftacoma.com",    arrivalDate: "03/22/2026", arrivalTime: "9:30 PM",  departureDate: "03/23/2026", departureTime: "3:30 AM",  dateRequested: "03/08/2026", timeRequested: "11:10 AM", status: "Pending Approval" },
  { vesselId: "105", terminal: "Port of Valdez",        terminalEmail: "contact@portofvaldez.com", arrivalDate: "03/24/2026", arrivalTime: "6:00 AM",  departureDate: "03/25/2026", departureTime: "6:00 AM",  dateRequested: "03/09/2026", timeRequested: "2:25 PM",  status: "Pending Approval" },
  { vesselId: "106", terminal: "Port City Terminal",    terminalEmail: "cmartinez@cityport.com",   arrivalDate: "04/05/2026", arrivalTime: "6:00 AM",  departureDate: "04/07/2026", departureTime: "6:00 AM",  dateRequested: "03/20/2026", timeRequested: "9:30 AM",  status: "Pending Approval" },
  { vesselId: "107", terminal: "Los Angeles Terminal",  terminalEmail: "info@laterminal.com",      arrivalDate: "04/07/2026", arrivalTime: "6:00 AM",  departureDate: "04/08/2026", departureTime: "6:00 AM",  dateRequested: "03/20/2026", timeRequested: "12:16 PM", status: "Pending Approval" },
  { vesselId: "108", terminal: "Oakland International", terminalEmail: "ops@oaklandintl.com",      arrivalDate: "04/09/2026", arrivalTime: "7:30 AM",  departureDate: "04/09/2026", departureTime: "7:30 PM",  dateRequested: "03/22/2026", timeRequested: "8:10 AM",  status: "Pending Approval" },
  { vesselId: "109", terminal: "Port of Seattle",       terminalEmail: "info@portofseattle.com",   arrivalDate: "04/11/2026", arrivalTime: "6:00 AM",  departureDate: "04/11/2026", departureTime: "6:00 AM",  dateRequested: "03/24/2026", timeRequested: "3:40 PM",  status: "Pending Approval" },
  { vesselId: "110", terminal: "Port of Valdez",        terminalEmail: "contact@portofvaldez.com", arrivalDate: "04/12/2026", arrivalTime: "6:00 AM",  departureDate: "04/13/2026", departureTime: "6:00 AM",  dateRequested: "03/25/2026", timeRequested: "11:07 AM", status: "Pending Approval" },
  { vesselId: "111", terminal: "Port City Terminal",    terminalEmail: "cmartinez@cityport.com",   arrivalDate: "04/15/2026", arrivalTime: "8:00 AM",  departureDate: "04/16/2026", departureTime: "8:00 AM",  dateRequested: "03/28/2026", timeRequested: "9:00 AM",  status: "Pending Approval" },
  { vesselId: "112", terminal: "Long Beach Container",  terminalEmail: "info@lbcontainer.com",     arrivalDate: "04/18/2026", arrivalTime: "6:00 AM",  departureDate: "04/19/2026", departureTime: "6:00 AM",  dateRequested: "03/30/2026", timeRequested: "10:45 AM", status: "Pending Approval" },
  { vesselId: "113", terminal: "Oakland International", terminalEmail: "ops@oaklandintl.com",      arrivalDate: "04/20/2026", arrivalTime: "9:00 AM",  departureDate: "04/21/2026", departureTime: "9:00 AM",  dateRequested: "04/01/2026", timeRequested: "11:30 AM", status: "Pending Approval" },
  { vesselId: "114", terminal: "Port of Tacoma",        terminalEmail: "info@portoftacoma.com",    arrivalDate: "04/22/2026", arrivalTime: "7:00 AM",  departureDate: "04/23/2026", departureTime: "7:00 AM",  dateRequested: "04/03/2026", timeRequested: "8:15 AM",  status: "Pending Approval" },
  { vesselId: "115", terminal: "Los Angeles Terminal",  terminalEmail: "info@laterminal.com",      arrivalDate: "04/25/2026", arrivalTime: "6:00 AM",  departureDate: "04/26/2026", departureTime: "6:00 AM",  dateRequested: "04/05/2026", timeRequested: "2:00 PM",  status: "Pending Approval" },
  { vesselId: "116", terminal: "Port of Seattle",       terminalEmail: "info@portofseattle.com",   arrivalDate: "04/28/2026", arrivalTime: "6:00 AM",  departureDate: "04/29/2026", departureTime: "6:00 AM",  dateRequested: "04/07/2026", timeRequested: "4:30 PM",  status: "Pending Approval" },
]

const MODIFICATION_REQUESTED: BerthRequest[] = [
  { vesselId: "201", terminal: "Port City Terminal",   terminalEmail: "cmartinez@cityport.com", arrivalDate: "04/10/2026", arrivalTime: "8:00 AM", departureDate: "04/11/2026", departureTime: "8:00 AM", dateRequested: "03/15/2026", timeRequested: "9:00 AM"  },
  { vesselId: "202", terminal: "Long Beach Container", terminalEmail: "info@lbcontainer.com",   arrivalDate: "04/12/2026", arrivalTime: "6:00 AM", departureDate: "04/13/2026", departureTime: "6:00 AM", dateRequested: "03/18/2026", timeRequested: "11:00 AM" },
]

const ONGOING: BerthRequest[] = [
  { vesselId: "301", terminal: "Oakland International", terminalEmail: "ops@oaklandintl.com",   arrivalDate: "04/28/2026", arrivalTime: "6:00 AM", departureDate: "04/29/2026", departureTime: "6:00 AM", dateRequested: "03/20/2026", timeRequested: "10:00 AM", berthAssignment: "Berth 4",  actualArrivalDate: "04/28/2026", actualArrivalTime: "6:15 AM" },
  { vesselId: "302", terminal: "Port of Tacoma",        terminalEmail: "info@portoftacoma.com", arrivalDate: "04/29/2026", arrivalTime: "7:00 AM", departureDate: "04/30/2026", departureTime: "7:00 AM", dateRequested: "03/22/2026", timeRequested: "8:00 AM",  berthAssignment: "Berth 2",  actualArrivalDate: "04/29/2026", actualArrivalTime: "7:10 AM" },
]

const COMPLETED: BerthRequest[] = [
  { vesselId: "401", terminal: "Port of Valdez",        terminalEmail: "contact@portofvaldez.com", arrivalDate: "03/01/2026", arrivalTime: "6:00 AM", departureDate: "03/02/2026", departureTime: "6:00 AM", dateRequested: "02/10/2026", timeRequested: "9:00 AM",  status: "Complete", berthAssignment: "Berth 1",  actualArrivalDate: "03/01/2026", actualArrivalTime: "6:05 AM",  actualDepartureDate: "03/02/2026", actualDepartureTime: "5:55 AM"  },
  { vesselId: "402", terminal: "Port City Terminal",    terminalEmail: "cmartinez@cityport.com",   arrivalDate: "03/05/2026", arrivalTime: "8:00 AM", departureDate: "03/06/2026", departureTime: "8:00 AM", dateRequested: "02/12/2026", timeRequested: "10:30 AM", status: "Denied",   berthAssignment: "—",        actualArrivalDate: "—",          actualArrivalTime: "",         actualDepartureDate: "—",          actualDepartureTime: ""         },
  { vesselId: "403", terminal: "Los Angeles Terminal",  terminalEmail: "info@laterminal.com",      arrivalDate: "03/10/2026", arrivalTime: "6:00 AM", departureDate: "03/11/2026", departureTime: "6:00 AM", dateRequested: "02/15/2026", timeRequested: "2:00 PM",  status: "Complete", berthAssignment: "Berth 7",  actualArrivalDate: "03/10/2026", actualArrivalTime: "6:20 AM",  actualDepartureDate: "03/11/2026", actualDepartureTime: "6:10 AM"  },
]

export function BerthVesselTable() {
  return (
    <div className="w-xl max-w-9/10">
      <Tabs defaultValue="requested">
        <div>
          <TabsList className="mb-4 flex w-full justify-start gap-x-4">
            <TabsTrigger value="requested">Requested</TabsTrigger>
            <TabsTrigger value="modification-requested">Modification Requested</TabsTrigger>
            <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </div>
        <div className="w-xl max-w-9/10">
          <TabsContent value="requested">
            <DataTable columns={requestedColumns()} data={REQUESTED} />
          </TabsContent>
          <TabsContent value="modification-requested">
            <DataTable columns={modificationRequestedColumns()} data={MODIFICATION_REQUESTED} />
          </TabsContent>
          <TabsContent value="ongoing">
            <DataTable columns={ongoingColumns()} data={ONGOING} />
          </TabsContent>
          <TabsContent value="completed">
            <DataTable columns={completedColumns()} data={COMPLETED} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

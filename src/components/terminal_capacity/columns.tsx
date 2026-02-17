import { ColumnDef } from "@tanstack/react-table";
import { Button } from "../ui/button.tsx";
//Imports generateClient and Schema may be need for future updates
//import { generateClient } from 'aws-amplify/data';
//import type { Schema } from '../../../amplify/data/resource';


//const client = generateClient<Schema>();
export type Capacity = {
  capacity : number
  startTime: string
  endTime: string
  repeat: string
  reason: string
}

export const columns = (): ColumnDef<any>[] => {
  const baseColumns: ColumnDef<any>[] = [

    { accessorKey: "capacity", header: "Capacity" },
    { accessorKey: "startTime", header: "Start" }, 
    { accessorKey: "endTime", header: "End" },
    { accessorKey: "repeat", header: "Repeat" },
    { accessorKey: "reason", header: "Reason" },
    {
          accessorKey: "actions",
          header: () => <div style={{ minWidth: "50px"}}>Actions</div>,
          cell: () => (
            <div className="flex space-x-8 ">
              <Button 
                variant="outline" 
                //onClick={() => ()} 
                //TO DO: PCIS2-42
              >
                Edit
              </Button>
    
              <Button 
                variant="destructive"
                //onClick={() => ()} 
                //TO DO: PCIS2-38
              >
                  Delete
              </Button>
            </div>
          ),
          
        }

  ];
return baseColumns;
}

import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { BerthAvailability } from "../components/berth/berth-availability"
import { Button } from "../components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs.tsx"

export const Route = createFileRoute('/berth-manager')({
  component: RouteComponent,
})
  
function RouteComponent() {
     const [isOpen, setIsOpen] = useState(false);

      const handleOpen = () => {
        setIsOpen(!isOpen);
      };

     return (
      <div className="w-xl max-w-9/10">
        <Tabs defaultValue="requested" className="">
          <div>
            <TabsList className="mb-4 flex w-full justify-start gap-x-4">
                <TabsTrigger value="requested">Requested</TabsTrigger>
                <TabsTrigger value="modification">Modification Requested</TabsTrigger>
                <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </div>
          <div className="w-xl max-w-9/10">
            <TabsContent value="requested">
            </TabsContent>
            <TabsContent value="modification">
            </TabsContent>
            <TabsContent value="ongoing">
            </TabsContent>
            <TabsContent value="completed">
            </TabsContent>
          </div>
        </Tabs>
        <div className="p-2">
          <h1 className="text-2xl font-bold text-center">Berth Reservations</h1>
          <Button type="button" onClick={() => handleOpen()}>
              Set Berth Availability
          </Button>
          <BerthAvailability isDialogOpen={isOpen} handleCloseDialog={() => setIsOpen(false)} />
        </div>        
      </div>
    );
}
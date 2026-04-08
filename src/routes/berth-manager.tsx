import { createFileRoute } from "@tanstack/react-router"
import { BerthAvailability } from "../components/berth/berth-availability"
import { Button } from "../components/ui/button"

export const Route = createFileRoute('/berth-manager')({
  component: RouteComponent,
})
    let isOpen:boolean = false;

    const handleOpenDialog = () => {
      isOpen = !isOpen;
    }

    function RouteComponent() {
      return (
        <div className="p-2">
          <h1 className="text-2xl font-bold text-center">Berth Reservations</h1>
          <Button type="button" onClick={handleOpenDialog}>
              Berth Availability
          </Button>
          {isOpen && <BerthAvailability/>}                    
        </div>
    )
}
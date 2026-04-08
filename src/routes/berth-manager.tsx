import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router"
import { BerthAvailability } from "../components/berth/berth-availability"
import { Button } from "../components/ui/button"

export const Route = createFileRoute('/berth-manager')({
  component: RouteComponent,
})
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    setIsOpen(!isOpen);
  };

    function RouteComponent() {
      return (
        <div className="p-2">
          <h1 className="text-2xl font-bold text-center">Berth Reservations</h1>
          <Button type="button" onClick={() => handleOpen()}>
              Berth Availability
          </Button>
          <BerthAvailability isDialogOpen={isOpen} />
        </div>
    )
}
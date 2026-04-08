import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router"
import { BerthAvailability } from "../components/berth/berth-availability"
import { Button } from "../components/ui/button"

export const Route = createFileRoute('/berth-manager')({
  component: RouteComponent,
})
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const handleOpenDialog = async () => {
          setIsDialogOpen(!isDialogOpen)
    }

    function RouteComponent() {
      return (
        <div className="p-2">
          <h1 className="text-2xl font-bold text-center">Berth Reservations</h1>
          <Button type="button" onClick={(handleOpenDialog)}>
              Berth Availability
          </Button>
          <BerthAvailability isDialogOpen={isDialogOpen} />
        </div>
    )
}
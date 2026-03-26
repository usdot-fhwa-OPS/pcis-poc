import { createFileRoute } from '@tanstack/react-router'

import { Button } from "../components/ui/button";

export const Route = createFileRoute('/berth-requests')({
  component: BerthRequestComponent,
})

function BerthRequestComponent() {
  return (
  <>
    <div className="p-2">
      <h1 className="text-2xl font-bold text-center">Berth Requests</h1>
    </div>
    <div className="p-2">
        <Button className="justlify-end">Add New Berth Request</Button>
    </div>
  </>
  )
}
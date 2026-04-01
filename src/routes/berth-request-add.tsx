import { createFileRoute } from '@tanstack/react-router'

import { Button } from "../components/ui/button";
import { AddBerthRequest } from "../components/berth-requests/add-berth-request";

export const Route = createFileRoute('/berth-request-add')({
  component: AddBerthRequestComponent,
})

function AddBerthRequestComponent() {
  return (
  <>
    <div className="flex flex-col w-full p-10">
        <h1 className="text-2xl font-semibold mb-6">Add New Berth Request</h1>
        <AddBerthRequest/>
        <div className="flex space-x-4 mt-8">
          <Button variant="outline">
            Cancel
          </Button>
          <Button>
            Submit Berth Request
          </Button>
        </div>
    </div>
  </>
  )
}
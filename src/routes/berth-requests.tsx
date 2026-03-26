import { createFileRoute } from '@tanstack/react-router'

import { Button } from "../components/ui/button";
import { Plus } from "lucide-react";

export const Route = createFileRoute('/berth-requests')({
  component: BerthRequestComponent,
})

function BerthRequestComponent() {
  return (
  <>
    <div className="flex flex-col w-full p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Berth Requests</h1>
        <div>
          <Button>
            <Plus /> Add New Berth Request
          </Button>
        </div>
      </div>
    </div>
  </>
  )
}
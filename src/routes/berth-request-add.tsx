import { createFileRoute } from '@tanstack/react-router'

import { AddBerthRequest } from "../components/berth-requests/add-berth-request";

export const Route = createFileRoute('/berth-request-add')({
  component: AddBerthRequestComponent,
})

function AddBerthRequestComponent() {
  return (
  <>
    <div className="flex flex-col max-w-2xl p-10">
        <h1 className="text-2xl font-semibold mb-6">Add New Berth Request</h1>
        <AddBerthRequest/>
    </div>
  </>
  )
}
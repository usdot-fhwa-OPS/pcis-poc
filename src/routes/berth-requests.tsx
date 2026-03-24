import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/berth-requests')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="p-2">
      <h1 className="text-2xl font-bold">Berth Requests</h1>
    </div>
    <div className="container mx-auto p-10">
      <div className="parent-container">
        <button type="button">Add New Berth Request</button>
      </div>
    </div>
  )
}
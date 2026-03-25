import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/berth-requests')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="p-2">
      <h1 className="text-2xl font-bold text-center">Berth Requests</h1>
    </div>
  )
}
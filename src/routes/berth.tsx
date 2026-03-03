import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/berth')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="p-2">
      <h1 className="text-2xl font-bold text-center">Berth Reservations</h1>
    </div>
  )
}
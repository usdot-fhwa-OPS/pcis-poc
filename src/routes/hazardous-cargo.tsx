import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/hazardous-cargo')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="p-2">
      <h1 className="text-2xl font-bold text-center">Hazardous Cargo</h1>
    </div>
  )
}
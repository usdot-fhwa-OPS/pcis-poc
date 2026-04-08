import { createFileRoute } from '@tanstack/react-router'
import { BerthAvailability } from '../components/berth/berth-availability.tsx'

export const Route = createFileRoute('/berth-manager')({
  component: RouteComponent,
})
    const handleOpenDialog = () => {
      <BerthAvailability></BerthAvailability>
    }

function RouteComponent() {
  return (
    <div className="p-2">
      <h1 className="text-2xl font-bold text-center">Berth Reservations</h1>
      <button onClick={handleOpenDialog}>
          Berth Availability
      </button>      
    </div>
  )
}
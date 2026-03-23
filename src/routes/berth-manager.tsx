import { createFileRoute } from '@tanstack/react-router'
import { BerthAvailability } from '../components/berth/berth-availability.tsx'

export const Route = createFileRoute('/berth-manager')({
  component: RouteComponent,
})

function RouteComponent() {
  //const limit:number = 6;

  return (
    <div className="p-2">
      <h1 className="text-2xl font-bold text-center">Berth Reservations</h1>
      <BerthAvailability></BerthAvailability>
      {/* <BerthAvailability limit={limit}></BerthAvailability> */}
    </div>
  )
}
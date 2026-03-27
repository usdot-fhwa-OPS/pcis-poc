import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/berth-request-add')({
  component: AddBerthRequestComponent,
})

function AddBerthRequestComponent() {
  return (
  <>
    <div className="flex flex-col w-full p-10">
        <h1 className="text-2xl font-semibold">Add New Berth Request</h1>
        <p><em>Insert form</em></p>
    </div>
  </>
  )
}
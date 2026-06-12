import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/notifications')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="p-4 pt-3 pl-[4.125rem]">
      <h3 className="text-2xl font-semibold text-gray-900">Notifications</h3>
    </div>
  )
}

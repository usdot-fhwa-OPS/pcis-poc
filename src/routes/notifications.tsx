import { createFileRoute } from '@tanstack/react-router'

import { Bell } from "lucide-react"

export const Route = createFileRoute('/notifications')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="p-4 pt-3 pl-16">
      <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-900">
        <Bell className="w-6 h-6 text-gray-700" />
        Notifications
      </h1>
      <div className="mt-[3.75rem] pb-12">
        <p>Notifications will display here.</p>
      </div>
    </div>
  )
}

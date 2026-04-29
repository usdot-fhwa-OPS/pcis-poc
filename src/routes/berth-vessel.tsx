import { useEffect, useState } from "react"
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuthenticator } from "@aws-amplify/ui-react"
import { fetchUserAttributes } from "aws-amplify/auth"
import { Plus } from "lucide-react"

import { Button } from "../components/ui/button"
import { BerthVesselTable } from "../components/berth-vessel/berth-vessel-table"

export const Route = createFileRoute('/berth-vessel')({
  component: RouteComponent,
})

function RouteComponent() {
  const { user } = useAuthenticator()
  const navigate = useNavigate()
  const [role, setRole] = useState("")

  useEffect(() => {
    async function loadRole() {
      if (!user) return
      try {
        const attrs = await fetchUserAttributes()
        setRole(attrs["custom:role"] ?? "")
      } catch {
        // ignore
      }
    }
    loadRole()
  }, [user])

  return (
    <div className="flex flex-col w-full p-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Berth Reservations</h1>
        {role === "Vessel Agent" && (
          <Button onClick={() => navigate({ to: "/berth-request-add" })}>
            <Plus /> Add New Berth Request
          </Button>
        )}
      </div>
      <BerthVesselTable />
    </div>
  )
}

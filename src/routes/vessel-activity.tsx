import { createFileRoute } from "@tanstack/react-router"
import { useContext, useEffect, useState } from "react"

import { BerthRequestDomain } from "../components/berth-requests/berth-request-domain"
import {
  berthRequestList,
  berthRequestListForVesselAgent,
} from "../components/berth-requests/berth-request-client"
import { VesselActivityTable } from "../components/vessel-activity/vessel-activity-table"
import { UserContext } from "../AppContext"

export const Route = createFileRoute("/vessel-activity")({
  component: VesselActivityPage,
})

function VesselActivityPage() {
  const userContext = useContext(UserContext)
  const [data, setData] = useState<BerthRequestDomain[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        let result: BerthRequestDomain[]
        if (userContext["custom:role"] === "Vessel Agent") {
          result = userContext.email
            ? await berthRequestListForVesselAgent(userContext.email)
            : []
        } else {
          result = await berthRequestList()
        }
        setData(result)
      } catch (error) {
        console.error("Error fetching vessel activity:", error)
      } finally {
        setLoading(false)
      }
    }

    if (userContext["custom:role"]) {
      fetchData()
    }
  }, [userContext])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Loading vessel activity...
      </div>
    )
  }

  return (
    <div className="w-full px-6 py-6 md:px-10 md:py-8 flex flex-col gap-6">
      <h1 className="text-2xl leading-none font-bold text-gray-900">Vessel Activity</h1>

      <VesselActivityTable data={data} />
    </div>
  )
}

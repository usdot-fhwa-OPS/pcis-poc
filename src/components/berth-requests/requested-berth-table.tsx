"use client"

import { useMemo, useState } from "react"
import { BerthRequest } from "./berth-request"

interface Props {
  data: BerthRequest[]
  userRole: "VESSEL_AGENT" | "TERMINAL_MANAGER"
  onView: (id: string) => void
  onModify: (id: string) => void
  onDelete: (id: string) => void
}

const ITEMS_PER_PAGE = 10

{/* <RequestedBerthTable
  data={requests}
  userRole="VESSEL_AGENT" | "TERMINAL_MANAGER"
/> */}

export function RequestedBerthTable({
  data,
  userRole,
  onView,
  onModify,
  onDelete
}: Props) {
  const [page, setPage] = useState(1)

  // Sort newest → oldest
  const sortedData = useMemo(() => {
    return [...data].sort(
      (a, b) =>
        new Date(b.requestedAt).getTime() -
        new Date(a.requestedAt).getTime()
    )
  }, [data])

  const totalItems = sortedData.length
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)

  const paginatedData = sortedData.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  )

  // Empty state
  if (totalItems === 0) {
    return (
      <p className="text-muted-foreground">
        There are no pending berth requests.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <table className="w-full border rounded-lg">
        <thead>
          <tr className="bg-muted text-left">
            <th className="p-3">Vessel ID</th>
            <th className="p-3">Terminal</th>
            <th className="p-3">
              <abbr title="Estimated Time of Arrival">ETA</abbr>
            </th>
            <th className="p-3">
              <abbr title="Estimated Time of Departure">ETD</abbr>
            </th>
            <th className="p-3">Date Requested</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>

        <tbody>
          {paginatedData.map((req) => (
            <tr key={req.id} className="border-t">
              <td className="p-3">
                <button
                  className="text-blue-600 underline"
                  onClick={() => onView(req.id)}
                >
                  {req.vesselId}
                </button>
              </td>

              <td className="p-3 space-x-2">
                <button
                  className="text-blue-600 underline"
                  onClick={() => onView(req.id)}
                >
                  {req.terminalName}
                </button>

                <a
                  href={`mailto:${req.terminalEmail}`}
                  className="text-sm text-muted-foreground underline"
                >
                  Contact
                </a>
              </td>

              <td className="p-3">
                {formatDateTime(req.eta)}
              </td>

              <td className="p-3">
                {formatDateTime(req.etd)}
              </td>

              <td className="p-3">
                {formatDateTime(req.requestedAt)}
              </td>

              <td className="p-3 space-x-2">
                {userRole === "VESSEL_AGENT" && (
                  <>
                    <button
                      className="text-blue-600 underline"
                      onClick={() => onModify(req.id)}
                    >
                      Modify
                    </button>

                    <button
                      className="text-red-600 underline"
                      onClick={() => onDelete(req.id)}
                    >
                      Delete
                    </button>
                  </>
                )}

                {userRole === "TERMINAL_MANAGER" && (
                  <button
                    className="text-blue-600 underline"
                    onClick={() => onView(req.id)}
                  >
                    View
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Footer */}
      {totalItems > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between text-sm">
          <div>
            {`${(page - 1) * ITEMS_PER_PAGE + 1}-${Math.min(
              page * ITEMS_PER_PAGE,
              totalItems
            )} of ${totalItems} items`}
          </div>

          <div className="space-x-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Prev
            </button>

            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Utility
function formatDateTime(date: string) {
  return new Date(date).toLocaleString()
}
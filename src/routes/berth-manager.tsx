import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/berth-manager')({
  component: RouteComponent,
})

type BerthRequest = {
  id: number
  departureDateTime: string
  dateRequested: string
}

function RouteComponent() {
  const [data, setData] = useState<BerthRequest[]>([
    {
      id: 1,
      departureDateTime: '2026-04-10 14:00',
      dateRequested: '2026-04-05 09:30',
    },
    {
      id: 2,
      departureDateTime: '2026-04-12 08:00',
      dateRequested: '2026-04-06 11:15',
    },
  ])

  const handleModify = (id: number) => {
    alert(`Navigate to Modify Berth Request page for ID: ${id}`)
  }

  const handleDelete = (id: number) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this berth request?'
    )

    if (confirmed) {
      setData((prev) => prev.filter((item) => item.id !== id))
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-center mb-4">
        Berth Reservations
      </h1>

      <table className="w-full border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Estimated Departure</th>
            <th className="border p-2">Date Requested</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>

        <tbody>
          {data.map((row) => (
            <tr key={row.id} className="text-center">
              <td className="border p-2">
                {row.departureDateTime}
              </td>

              <td className="border p-2">
                {row.dateRequested}
              </td>

              <td className="border p-2 space-x-2">
                <button
                  onClick={() => handleModify(row.id)}
                  className="text-blue-600 hover:underline"
                >
                  Modify
                </button>

                <button
                  onClick={() => handleDelete(row.id)}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}

          {data.length === 0 && (
            <tr>
              <td colSpan={3} className="p-4 text-center">
                No berth requests found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/berth-manager')({
  component: RouteComponent,
})

type BerthRequest = {
  id: number
  vesselId: string
  departureDateTime: string
  dateRequested: string
  status: 'Pending' | 'Approved' | 'Rejected'
}

function RouteComponent() {
  const [data, setData] = useState<BerthRequest[]>([])
  const [loading, setLoading] = useState(true)

  // 🔹 mock data
  const fetchBerthRequests = async () => {
    return [
      {
        id: 1,
        vesselId: 'VSL-001',
        departureDateTime: '2026-04-10 14:00',
        dateRequested: '2026-04-05 09:30',
        status: 'Pending',
      },
      {
        id: 2,
        vesselId: 'VSL-002',
        departureDateTime: '2026-04-12 08:00',
        dateRequested: '2026-04-06 11:15',
        status: 'Approved',
      },
    ]
  }

  useEffect(() => {
    const fetchData = async () => {
      const result = await fetchBerthRequests()
      setData(result)
      setLoading(false)
    }

    fetchData()
  }, [])

  const handleModify = (id: number) => {
    alert(`Modify request ${id}`)
  }

  const handleDelete = (id: number) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this berth request?'
    )

    if (confirmed) {
      setData((prev) => prev.filter((item) => item.id !== id))
    }
  }

  const handleRespond = (
    id: number,
    status: 'Approved' | 'Rejected'
  ) => {
    setData((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status } : item
      )
    )
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="p-2">
      <h1 className="text-2xl font-bold text-center">
        Berth Reservations
      </h1>

      <div className="container mx-auto p-10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vessel ID</TableHead>
              <TableHead>Estimated Departure</TableHead>
              <TableHead>Date Requested</TableHead>
              <TableHead>Respond</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.vesselId}</TableCell>

                <TableCell>
                  {row.departureDateTime}
                </TableCell>

                <TableCell>{row.dateRequested}</TableCell>

                {/* Respond */}
                <TableCell className="space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleRespond(row.id, 'Approved')
                    }
                  >
                    Approve
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() =>
                      handleRespond(row.id, 'Rejected')
                    }
                  >
                    Reject
                  </Button>
                </TableCell>

                {/* Status */}
                <TableCell>
                  <Badge
                    variant={
                      row.status === 'Approved'
                        ? 'default'
                        : row.status === 'Rejected'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {row.status}
                  </Badge>
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleModify(row.id)}
                  >
                    Modify
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(row.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No berth requests found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

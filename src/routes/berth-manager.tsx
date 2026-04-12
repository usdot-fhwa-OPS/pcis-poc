import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table"

import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { useAppDispatch } from '../hooks';
import { populate } from '../components/berth-requests/berth-request-state';
import { berthRequestList } from '../components/berth-requests/berth-request-client';

export const Route = createFileRoute('/berth-manager')({
  component: RouteComponent,
})

type BerthRequest = {
  id: string
  vesselId: string
  departureDateTime: string
  dateRequested: string
  status: 'Pending' | 'Approved' | 'Rejected' | string
}

function RouteComponent() {
  const [data, setData] = useState<BerthRequest[]>([])
  const [loading, setLoading] = useState(true)

  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5
  const dispatch = useAppDispatch()
  
  // mock data
  const fetchBerthRequests = async (): Promise<BerthRequest[]> => {
    const brList = await berthRequestList()
    dispatch(populate(brList));
    const result:BerthRequest[] = [];
    brList.map((br) =>{
      result.push({
        id: br.terminalId,
        vesselId: br.vesselID,
        departureDateTime: br.etdAt,
        dateRequested: br.etaAt,
        status: br.status,
      })
    });
    return result;
  }

  useEffect(() => {
    const fetchData = async () => {
      const result = await fetchBerthRequests()
      setData(result)
      setLoading(false)
    }

    fetchData()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [data])

  const totalPages = Math.ceil(data.length / pageSize)

  const paginatedData = data.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

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
            {paginatedData.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.vesselId}</TableCell>

                <TableCell>
                  {row.departureDateTime}
                </TableCell>

                <TableCell>{row.dateRequested}</TableCell>

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

            {paginatedData.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No berth requests found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* ✅ Pagination Controls */}
        <div className="flex justify-between items-center mt-4">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() =>
              setCurrentPage((prev) => prev - 1)
            }
          >
            Previous
          </Button>

          <div className="flex space-x-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <Button
                key={i}
                variant={
                  currentPage === i + 1
                    ? 'default'
                    : 'outline'
                }
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() =>
              setCurrentPage((prev) => prev + 1)
            }
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

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
import { useAppDispatch, useAppSelector } from '../hooks';
import { populate } from '../components/berth-requests/berth-request-state';
import { berthConfigList, berthRequestList } from '../components/berth-requests/berth-request-client';
import { getBerthConfigList, populate as populateBerthConfig } from '../components/berth-requests/berth-config-state';
import { BerthRequestComponent } from './berth-requests';

export const Route = createFileRoute('/berth-vessel')({
  component: RouteComponent,
})

type BerthRequest = {
  id: string
  vesselId: string
  terminalId: string
  arrivalDateTime: string
  departureDateTime: string
  dateRequested: string
}

function RouteComponent() {
  const [data, setData] = useState<BerthRequest[]>([])
  const brConfigList = useAppSelector(getBerthConfigList);
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
        terminalId: br.terminalId,
        arrivalDateTime: br.etdAt,
        departureDateTime: br.etdAt,
        dateRequested: br.etaAt
      })
    });
    return result;
  }

  useEffect(() => {
    const fetchData = async () => {
      dispatch(populateBerthConfig(await berthConfigList()))
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

  const handleModify = (id: string) => {
    alert(`Modify request ${id}`)
  }

  const handleDelete = (id: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this berth request?'
    )

    if (confirmed) {
      setData((prev) => prev.filter((item) => item.id !== id))
    }
  }

  

  if (loading) {
    return <div>Loading...</div>
  }
    return (

 <>
  <BerthRequestComponent/>
    
    <div className="p-2">
      <h1 className="text-2xl font-bold text-center">
        Berth Reservations
      </h1>
      
      <div className="container mx-auto p-10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vessel ID</TableHead>
              <TableHead>Terminal</TableHead>
              <TableHead>Arriavl(ETA)</TableHead>
              <TableHead>Departure(ETD)</TableHead>
              <TableHead>Date Requested</TableHead>
              <TableHead className="text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedData.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.vesselId}</TableCell>
                <TableCell>{row.terminalId?((brConfigList.find(brc => brc.terminalId === row.terminalId))?.terminalName):''}</TableCell>
                <TableCell>
                  {row.arrivalDateTime}
                </TableCell>
                <TableCell>
                  {row.departureDateTime}
                </TableCell>

                <TableCell>{row.dateRequested}</TableCell>

                

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
  </>      
    
  )
}

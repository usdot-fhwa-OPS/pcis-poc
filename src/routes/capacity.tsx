import { createFileRoute } from '@tanstack/react-router'
import { type Capacity, columns } from "../components/terminal_capacity/columns"
import { DataTable } from "../components/terminal_capacity/data-table"
import { useEffect, useState } from "react"

export const Route = createFileRoute('/capacity')({
  component: Capacity
})


export default function Capacity() {
  const [data, setData] = useState<Capacity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const result = await getData()
      setData(result)
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }


  return (
    <div className="p-2">
      <h1 className="text-2xl font-bold text-center">Terminal Capacity</h1>
      <div className="container mx-auto p-10">
              <DataTable
                columns={columns()}
                data={data}
              />
            </div>
    </div>
    
  )
}

async function getData() {
  // Replace with API Calls
  return [
    {
      capacity : 3,
      startTime: "12/12/2025 9:30 AM",
      endTime: "12/12/2025 3:30 PM",
      repeat: "Never",
      reason: "Equipment Malfunction"
    },
    {
      capacity : 4,
      startTime: "12/15/2025 6:00 AM",
      endTime: "12/15/2025 6:00 PM",
      repeat: "Never",
      reason: "Labor Shortage"
    }
  ]
}
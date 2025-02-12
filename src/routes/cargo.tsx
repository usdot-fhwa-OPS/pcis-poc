import { createFileRoute } from '@tanstack/react-router'
import { type Cargo, columns } from "../components/cargo/columns"
import { DataTable } from "../components/cargo/cargo-table"
import { useEffect, useState } from "react"


export const Route = createFileRoute('/cargo')({
  component: Cargo,
})

export default function Cargo() {
  const [data, setData] = useState<Cargo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const result = await getData()
      setData(result)
      setLoading(false)
    }
    fetchData()
  }, [])

  // The function that updates a row’s operator name/email.
  function updateCargo(containerID: string, newName: string, newEmail: string) {
    setData((prev) =>
      prev.map((cargo) =>
        cargo.containerID === containerID
          ? { ...cargo, operator: newName, operator_email: newEmail }
          : cargo
      )
    )
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-center">Upcoming Cargo</h1>
      <div>
        <DataTable
          columns={columns}
          data={data}
          // Pass the function in as meta so columns can call it
          meta={{ updateCargo }}
        />
      </div>
    </div>
  )
}



async function getData(): Promise<Cargo[]> {
  // Replace with API Calls
  return [
    {
      vesselID: 456,
      containerID: "HM-7829",
      origin: "Boston",
      bco: "John Doe",
      bco_email: "johndoe@leidos.com",
      operator: "",
      operator_email: "",
      status: "On Ship",
      flag : false,
      contact: "" // Can be removed once contact button is moved to proper place
    },
    {
      vesselID: 1236,
      containerID: "US-198",
      origin: "Shanghai",
      bco: "Bob Smith",
      bco_email: "bobsmith@transport.com",
      operator: "Bob Smith",
      operator_email: "bobsmith@transport.com",
      status: "On Dock",
      flag : false,
      contact : ""
    },
    {
      vesselID: 88,
      containerID: "123456",
      origin: "Los Angeles",
      bco: "John Doe",
      bco_email: "johndoe@leidos.com",
      operator: "John Doe",
      operator_email: "johndoe@leidos.com",
      status: "On Dock",
      flag : false,
      contact: ""
    },
    {
      vesselID: 1,
      containerID: "GM-267",
      origin: "Amsterdam",
      bco: "Peter Parker",
      bco_email: "peterparker@leidos.com",
      operator: "Allison Smith",
      operator_email: "allisonsmith@leidos.com",
      status: "On Ship",
      flag : false,
      contact: ""
    },
    {
      vesselID: 346,
      containerID: "HM-11",
      origin: "Houston",
      bco: "Jane Doe", 
      bco_email: "janedoe@leidos.com",
      operator: "Jane Doe",
      operator_email: "janedoe@leidos.com",
      status: "On Ship",
      flag : false,
      contact: ""
    },

  ]
  
}
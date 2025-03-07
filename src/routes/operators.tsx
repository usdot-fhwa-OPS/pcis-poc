import { createFileRoute } from '@tanstack/react-router'
import { User, columns } from "../components/users/columns"
import { DataTable } from "../components/users/users-table"
import { useEffect, useState } from "react"
import { fetchAuthSession } from 'aws-amplify/auth';


export const Route = createFileRoute('/operators')({
  component: Operators,
})

export default function Operators() {
  const [data, setData] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const session = await fetchAuthSession();
        const response = await fetch("https://xlj2x9eurh.execute-api.us-east-1.amazonaws.com/dev/", {
          method: 'GET',
          headers: {
            "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
            "Content-Type": "application/json",
            "Accept": "*/*"
          }
        });
        const result = await response.json();
        setData(result);
      } catch (error) {
        throw new Error(`Failed to fetch data: ${error}`);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-center">Available Users</h1>
      <div className="container mx-auto p-10">
        <DataTable columns={columns} data={data} />
      </div>
    </div>
  )
}

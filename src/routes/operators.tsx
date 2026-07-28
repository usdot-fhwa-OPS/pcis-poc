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
    <div className="w-full px-6 py-6 md:px-10 md:py-8">
      <h1 className="mb-2 text-2xl leading-none font-semibold text-gray-900">Available Users</h1>
      <p className="mb-4 text-sm text-gray-700">Manage and approve users accross all roles and organizations.</p>
      <DataTable columns={columns} data={data} />
    </div>
  )
}

import { createFileRoute } from '@tanstack/react-router'
import { useContext, useEffect, useState } from 'react'


import { useAppDispatch } from '../hooks';
import { populate } from '../components/berth-requests/berth-request-state';
import { berthRequestList } from '../components/berth-requests/berth-request-client';
import { TerminalOperatorBerthRequestsTable } from '../components/berth-requests/terminal-manager-table/berth-request-terminal-manager-table';
import { UserContext } from '../AppContext';
import { BerthRequestDomain } from '../components/berth-requests/berth-request-domain';

export const Route = createFileRoute('/berth-manager')({
  component: RouteComponent,
})

function RouteComponent() {
  const userContext =useContext(UserContext);	 
  const [data, setData] = useState<BerthRequestDomain[]>([])
  const [loading, setLoading] = useState(true)

  const dispatch = useAppDispatch()
  
  const fetchBerthRequests = async (): Promise<BerthRequestDomain[]> => {
    const brList = await berthRequestList()
    dispatch(populate(brList));
    
    return brList;
  }

  useEffect(() => {
    const fetchData = async () => {
      const result = await fetchBerthRequests()
      setData(result)
      setLoading(false)
    }

    fetchData()
  }, [data])

  
  
  if (loading) {
    return <div>Loading...</div>
  }

    return (
 
    userContext['custom:role']==='Terminal Operator'?<TerminalOperatorBerthRequestsTable data={data} />:undefined
    )
}

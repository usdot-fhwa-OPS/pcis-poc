import { createFileRoute } from '@tanstack/react-router'
import { useContext, useEffect, useState } from 'react'


import { useAppDispatch } from '../hooks';
import { populate } from '../components/berth-requests/berth-request-state';
import { berthRequestList, deleteBerthRequest, berthConfigList } from '../components/berth-requests/berth-request-client';
import { TerminalOperatorBerthRequestsTable } from '../components/berth-requests/terminal-manager-table/berth-request-terminal-manager-table';
import { UserContext } from '../AppContext';
import { BerthRequestDomain } from '../components/berth-requests/berth-request-domain';
import { BerthConfigDomain } from '../components/berth-requests/berth-config-domain';

export const Route = createFileRoute('/berth-manager')({
  component: RouteComponent,
})

function RouteComponent() {
  const userContext =useContext(UserContext);	 
  const [data, setData] = useState<BerthRequestDomain[]>([])
  const [configs, setConfigs] = useState<BerthConfigDomain[]>([])
  const [loading, setLoading] = useState(true)

  const dispatch = useAppDispatch()

  const fetchBerthRequests = async (): Promise<BerthRequestDomain[]> => {
    const brList = await berthRequestList()
    dispatch(populate(brList));
    return brList;
  }

  const fetchData = async () => {
    const [result, configList] = await Promise.all([fetchBerthRequests(), berthConfigList()])
    setData(result)
    setConfigs(configList)
    setLoading(false)
  }
  useEffect(() => {
    fetchData()
  }, [])

  const delBerthRequest = async(requestId: string) =>{
      
      await deleteBerthRequest(requestId);
      fetchData();
    }
  
  if (loading) {
    return <div>Loading...</div>
  }

    return (
 
    userContext['custom:role']==='Terminal Operator'?<TerminalOperatorBerthRequestsTable data={data}
    deleteBerthRequest={delBerthRequest} berthConfigs={configs} />:undefined
    )
}

import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'


import { useAppDispatch, useAppSelector } from '../hooks';
import { populate } from '../components/berth-requests/berth-request-state';
import { berthConfigList, berthRequestList } from '../components/berth-requests/berth-request-client';
import { getBerthConfigList, populate as populateBerthConfig } from '../components/berth-requests/berth-config-state';
import { BerthRequestComponent } from './berth-requests';
import { BerthRequestDomain } from '../components/berth-requests/berth-request-domain';
import { VesselAgentBerthRequestsTable } from '../components/berth-requests/vessel-agent-table/berth-request-vessel-agent-table';
import { BerthConfigDomain } from '../components/berth-requests/berth-config-domain';

export const Route = createFileRoute('/berth-vessel')({
  component: RouteComponent,
})



function RouteComponent() {
  const [data, setData] = useState<BerthRequestDomain[]>([])
  const brConfigList: BerthConfigDomain[] = useAppSelector(getBerthConfigList);
  const [loading, setLoading] = useState(true)

  const dispatch = useAppDispatch()
  
  const fetchBerthRequests = async (): Promise<BerthRequestDomain[]> => {
    const brList = await berthRequestList()
    dispatch(populate(brList));
    
    return brList;
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

  

  if (loading) {
    return <div>Loading...</div>
  }
    return (

 <>
  <BerthRequestComponent/>
    
   <VesselAgentBerthRequestsTable  data = {data} meta = {{brConfigList}} />
  </>      
    
  )
}

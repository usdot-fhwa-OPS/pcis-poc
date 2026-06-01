import { createFileRoute } from '@tanstack/react-router'
import { useContext, useState } from 'react'


import { useAppDispatch, useAppSelector } from '../hooks';
import { populate } from '../components/berth-requests/berth-request-state';
import { berthConfigList, berthRequestListForVesselAgent, deleteBerthRequest } from '../components/berth-requests/berth-request-client';
import { getBerthConfigList, populate as populateBerthConfig } from '../components/berth-requests/berth-config-state';
import { BerthRequestComponent } from './berth-requests';
import { BerthRequestDomain } from '../components/berth-requests/berth-request-domain';
import { VesselAgentBerthRequestsTable } from '../components/berth-requests/vessel-agent-table/berth-request-vessel-agent-table';
import { BerthConfigDomain } from '../components/berth-requests/berth-config-domain';
import { UserContext } from '../AppContext';

export const Route = createFileRoute('/berth-vessel')({
  component: RouteComponent,
})



function RouteComponent() {
  const [data, setData] = useState<BerthRequestDomain[]>([])
  const brConfigList: BerthConfigDomain[] = useAppSelector(getBerthConfigList);
  const [loading, setLoading] = useState(true)

  const dispatch = useAppDispatch()
  const userContext = useContext(UserContext);

  const fetchBerthRequests = async (): Promise<BerthRequestDomain[]> => {
    const brList = userContext.email?await berthRequestListForVesselAgent(userContext.email):[];
    
    return brList;
  }

      const fetchData = async () => {
      const result = await fetchBerthRequests()
      setData(result)
      dispatch(populate(result));
     dispatch(populateBerthConfig(await berthConfigList()))
 
      setLoading(false)

    }
    

    const delBerthRequest = async (requestId: string) =>{
    
    await deleteBerthRequest(requestId);
    fetchData();
  }
  
  useState(() => {
    fetchData()
  })
   

  

  if (loading) {
    return <div>Loading...</div>
  }
    return (

 <>
  <BerthRequestComponent/>
    
   <VesselAgentBerthRequestsTable  data = {data} meta = {{brConfigList, deleteBerthRequest:delBerthRequest}} />
  </>      
    
  )
}

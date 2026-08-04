import { createFileRoute } from '@tanstack/react-router'
import { useContext, useEffect, useState } from 'react'


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
  const [loading, setLoading] = useState(false)

  const dispatch = useAppDispatch()
  const userContext = useContext(UserContext);

  const fetchBerthRequests = async (): Promise<BerthRequestDomain[]> => {
    const brList = userContext.email ? await berthRequestListForVesselAgent(userContext.email) : [];
    return brList;
  }

  const fetchData = async () => {
    const result = await fetchBerthRequests()
    setData(result)
    dispatch(populate(result));
    dispatch(populateBerthConfig(await berthConfigList()))
    setLoading(false)
  }

  const delBerthRequest = async (requestId: string) => {
    await deleteBerthRequest(requestId);
    fetchData();
  }

  useEffect(() => {
    if (!userContext.email) return
    setLoading(true)
    fetchData()
  }, [userContext.email])

  return (
    <>
      <BerthRequestComponent />
      {loading
        ? <div className="flex items-center justify-center w-full min-h-64 pt-0 px-6 md:px-10 pb-6 md:pb-8 text-gray-500">Loading reservations…</div>
        : <VesselAgentBerthRequestsTable data={data} meta={{brConfigList, deleteBerthRequest: delBerthRequest}} />
      }
    </>
  )
}

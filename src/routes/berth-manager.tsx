import { createFileRoute } from '@tanstack/react-router'
import { useContext, useEffect, useState } from 'react'


import { useAppDispatch } from '../hooks';
import { populate } from '../components/berth-requests/berth-request-state';
import { berthRequestList, deleteBerthRequest, berthConfigList, updateBerthRequest, berthRequestDecision } from '../components/berth-requests/berth-request-client';
import { TerminalOperatorBerthRequestsTable } from '../components/berth-requests/terminal-manager-table/berth-request-terminal-manager-table';
import { UserContext } from '../AppContext';
import { BerthRequestDomain } from '../components/berth-requests/berth-request-domain';
import { BerthConfigDomain } from '../components/berth-requests/berth-config-domain';
import { Button } from "../components/ui/button.tsx";
import { BerthAvailability } from "../components/berth/berth-availability.tsx";

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

    const modifyBerthRequest = async (berthRequest: BerthRequestDomain) => {
    await updateBerthRequest(berthRequest);
    fetchData();
  }

  const decideBerthRequest = async (requestId: string, decision: string, options?: { denialComment?: string; berthAssignment?: string }) => {
    await berthRequestDecision(requestId, decision, options);
    fetchData();
  }

  const [berthAvailabilityOpen, setBerthAvailabilityOpen] = useState(false)

  return (
    <div className="w-full px-6 py-6 md:px-10 md:py-8">
      <div className="flex max-sm:flex-col max-sm:gap-y-4 items-center max-sm:items-start justify-between mb-6">
        <h1 className="text-2xl leading-none font-semibold text-gray-900">Berth Reservations</h1>
        <Button 
          variant="outline" 
          size="lg" 
          onClick={() => setBerthAvailabilityOpen(true)} 
          className="border-gray-300 hover:border-gray-500 text-gray-700 hover:text-gray-900 hover:shadow-xs"
        >
          Set Berth Availability
        </Button>
        <BerthAvailability isDialogOpen={berthAvailabilityOpen} handleCloseDialog={setBerthAvailabilityOpen} />
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-500">Loading berth requests…</div>
      ) : userContext['custom:role'] === 'Terminal Operator' ? (
        <TerminalOperatorBerthRequestsTable
          data={data}
          deleteBerthRequest={delBerthRequest}
          berthConfigs={configs}
          modifyBerthRequest={modifyBerthRequest}
          decideBerthRequest={decideBerthRequest}
        />
      ) : null}
    </div>
  )
}

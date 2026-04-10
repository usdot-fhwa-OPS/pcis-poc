import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { Button } from "../components/ui/button";
import { AddBerthRequest } from "../components/berth-requests/add-berth-request";
import { BerthRequestDomain } from '../components/berth-requests/berth-request-domain';
import { saveBerthRequest } from '../components/berth-requests/berth-request-client';
import { useContext } from 'react';
import { UserContext } from '../AppContext';

export const Route = createFileRoute('/berth-request-add')({
  component: AddBerthRequestComponent,
})

function AddBerthRequestComponent() {
  
  const navigate = useNavigate();
  const navigateToBerthRequests = () => {
    navigate({ to: "/berth-requests" });
  }
  const berthRequest:BerthRequestDomain =  {
        terminalId: "",
        vesselAgentEmail: "",
        vesselID: "",
        berthAssignment: {
            berthId: "",
            designation: ""
        },
        etaAt: "",
        etdAt: "",
        services: [''],
        manifestFileName: "",
        manifestPath: "",
        manifestCsvContent: ""
    };

    const userContext = useContext(UserContext);
    const save = () =>{
      berthRequest.vesselAgentEmail = userContext.email?userContext.email:"";  
      saveBerthRequest(berthRequest)
    }
  
  return (
  <>
    <div className="flex flex-col w-full p-10">
        <h1 className="text-2xl font-semibold mb-6">Add New Berth Request</h1>
        <AddBerthRequest berthRequest={berthRequest}/>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-start sm:gap-0 sm:space-x-4 mt-6">
          <Button variant="outline" onClick={navigateToBerthRequests}>
            Cancel
          </Button>
          <Button onClick={save} >
            Submit Berth Request
          </Button>
        </div>
    </div>
  </>
  )
}

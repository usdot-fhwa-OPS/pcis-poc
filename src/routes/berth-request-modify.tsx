import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useContext, useRef } from 'react';

import { Button } from "../components/ui/button";
import { ModifyBerthRequest } from "../components/berth-requests/modify-berth-request";
import { BerthRequestFormData } from '../components/berth-requests/add-berth-request';
import { UserContext } from '../AppContext';

export const Route = createFileRoute('/berth-request-modify')({
  component: ModifyBerthRequestComponent,
})

function ModifyBerthRequestComponent() {
  const userContext = useContext(UserContext);
  const requestListPage = (userContext['custom:role']==='Terminal Operator')?'/berth-manager':'/berth-vessel';
  const navigate = useNavigate();
  const formDataRef = useRef<BerthRequestFormData | null>(null);
  
  
  const navigateToBerthRequests = () => {
    navigate({ to: requestListPage });
  }
 
 

  const handleSubmit = () => {
    if (formDataRef.current) {
      sessionStorage.setItem('berthRequestOriginal', JSON.stringify(formDataRef.current));
    }
    navigate({ to: "/berth-request-modify-confirmation" });
  }

  return (
  <>
    <div className="flex flex-col w-full p-10">
        <h1 className="text-2xl font-semibold mb-6">Modify New Berth Request</h1>
        <ModifyBerthRequest onDataChange={(data) => { formDataRef.current = data; }}/>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-start sm:gap-0 sm:space-x-4 mt-6">
          <Button variant="outline" onClick={navigateToBerthRequests}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Submit Modify Berth Request
          </Button>
        </div>
    </div>
  </>
  )
}

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useRef } from 'react';

import { Button } from "../components/ui/button";
import { AddBerthRequest, BerthRequestFormData } from "../components/berth-requests/add-berth-request";

export const Route = createFileRoute('/berth-request-add')({
  component: AddBerthRequestComponent,
})

function AddBerthRequestComponent() {

  const navigate = useNavigate();
  const formDataRef = useRef<BerthRequestFormData | null>(null);

  const navigateToBerthRequests = () => {
    navigate({ to: "/berth-requests" });
  }

  const handleSubmit = () => {
    navigate({
      to: "/berth-request-confirmation",
      state: { formData: formDataRef.current },
    });
  }

  return (
  <>
    <div className="flex flex-col w-full p-10">
        <h1 className="text-2xl font-semibold mb-6">Add New Berth Request</h1>
        <AddBerthRequest onDataChange={(data) => { formDataRef.current = data; }} />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-start sm:gap-0 sm:space-x-4 mt-6">
          <Button variant="outline" onClick={navigateToBerthRequests}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Submit Berth Request
          </Button>
        </div>
    </div>
  </>
  )
}

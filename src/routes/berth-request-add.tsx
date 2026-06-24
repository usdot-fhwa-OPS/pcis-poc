import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useRef, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

import { Button } from "../components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";
import { AddBerthRequest, BerthRequestFormData } from "../components/berth-requests/add-berth-request";

export const Route = createFileRoute('/berth-request-add')({
  component: AddBerthRequestComponent,
})

function AddBerthRequestComponent() {

  const navigate = useNavigate();
  const formDataRef = useRef<BerthRequestFormData | null>(null);
  const [manifestUploaded, setManifestUploaded] = useState(false);
  const [manifestFileName, setManifestFileName] = useState("");

  const navigateToBerthRequests = () => {
    navigate({ to: "/berth-vessel" });
  }

  const handleSubmit = () => {
    if (formDataRef.current) {
      sessionStorage.setItem('berthRequestDraft', JSON.stringify(formDataRef.current));
    }
    navigate({ to: "/berth-request-confirmation" });
  }

  return (
    <div className="px-6 py-6 md:px-10 md:py-8 flex flex-col gap-6 bg-gray-50 min-h-full">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Request Berth</h1>
        <p className="text-sm text-gray-500 mt-1">
          {manifestUploaded
            ? `Manifest on file, berth request ready to submit`
            : `Complete the form below and attach a cargo manifest to submit`}
        </p>
      </div>

      {manifestUploaded && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center gap-2 text-green-700 text-sm">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>Manifest verified — {manifestFileName}</span>
        </div>
      )}

      <AddBerthRequest
        onDataChange={(data) => { formDataRef.current = data; }}
        onManifestChange={(fileName, path) => {
          setManifestUploaded(!!path);
          setManifestFileName(fileName);
        }}
      />

      <div className="flex items-center gap-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={manifestUploaded ? -1 : 0}>
                <Button
                  onClick={handleSubmit}
                  disabled={!manifestUploaded}
                  className="bg-gray-900 hover:bg-gray-800"
                >
                  Submit Berth Request
                </Button>
              </span>
            </TooltipTrigger>
            {!manifestUploaded && (
              <TooltipContent>
                <p>Manifest file required</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
        <Button variant="outline" onClick={navigateToBerthRequests}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

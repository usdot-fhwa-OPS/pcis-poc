import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useContext, useState } from 'react';
import { format } from 'date-fns';
import { FileIcon, CheckCircle2Icon } from 'lucide-react';

import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import { BerthRequestFormData } from '../components/berth-requests/add-berth-request';
import { BerthRequestDomain } from '../components/berth-requests/berth-request-domain';
import { UserContext } from '../AppContext';
import { saveBerthRequest } from '../components/berth-requests/berth-request-client';

export const Route = createFileRoute('/berth-request-confirmation')({
  component: BerthRequestConfirmationComponent,
})

function BerthRequestConfirmationComponent() {
  const navigate = useNavigate();
  const raw = sessionStorage.getItem('berthRequestDraft');
  const formData: BerthRequestFormData | null = raw ? JSON.parse(raw) : null;

  const [cancelOpen, setCancelOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [error, setError] = useState('');

  const handleConfirmCancel = () => {
    setCancelOpen(false);
    navigate({ to: '/berth-vessel' });
  };

  const handleConfirmSubmit = async () => {
    setSuccessOpen(false);
    const resp = JSON.parse(await save());
    if (resp.error) {
      setError(resp.error.message);
    } else {

      navigate({ to: '/berth-vessel' });
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '—';
    return format(new Date(date), 'M/d/yyyy');
  };

   const berthRequest:BerthRequestDomain =  {
          requestId:"",
          terminalId: "",
          vesselAgentEmail: "",
          vesselID: "",
          berthAssignment: {
              berthId: "",
              designation: ""
          },
          etaAt: "",
          etdAt: "",
          requestedAt:"",
          services: [''],
          manifestFileName: "",
          manifestPath: "",
          manifestCsvContent: "",
          hazmatCount: "",
          status:"",
      };
  
    const userContext = useContext(UserContext);
    const save = async ():Promise<string>  => {
      if (formData) {
        berthRequest.vesselAgentEmail = userContext.email ? userContext.email : "";
        berthRequest.terminalId = formData.terminalId;
        berthRequest.etaAt = format(formData.startDate, "MM/dd/yyyy")+' '+formData.startTime;
        berthRequest.etdAt = format(formData.endDate, "MM/dd/yyyy")+' '+formData.endTime;
        berthRequest.manifestPath = formData.cargoManifestPath;
        berthRequest.services = formData.services;
        berthRequest.vesselID = formData.vesselId;
      }

      return await saveBerthRequest(berthRequest)
    }
  const printDError = () => {

    if (error.length > 0) {
      const content = error.split(',');
      

      return (
        <>
          <b>{content[0]}</b>
          <ul>{content.map((item, i) => ((i > 0) && <li>-{item}</li>))}  </ul>
        </>

      )

    }

    }
 
  return (
    <div className="flex flex-col w-full p-10">
      <h1 className="text-2xl font-semibold mb-2">Berth Request</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Review the information below. Select <em>Confirm and Submit</em> to complete your request.
      </p>

      <div className="grid grid-cols-[max-content_1fr] gap-x-8 gap-y-4 mb-10 max-w-2xl">
        <span className="font-medium text-sm">Terminal:</span>
        <div className="text-sm">
          {formData?.terminalName ? (
            <>
              <p>{formData.terminalName}</p>
              <p>Phone: <a href={`tel:${formData.terminalPhone}`} className="text-blue-500 hover:underline">{formData.terminalPhone}</a></p>
              <p>Email: <a href={`mailto:${formData.terminalEmail}`} className="text-blue-500 hover:underline">{formData.terminalEmail}</a></p>
            </>
          ) : <span className="text-muted-foreground">—</span>}
        </div>

        <span className="font-medium text-sm">Estimated Arrival:</span>
        <span className="text-sm">
          {formData ? `${formatDate(formData.startDate)}   ${formData.startTime}` : '—'}
        </span>

        <span className="font-medium text-sm">Estimated Departure:</span>
        <span className="text-sm">
          {formData ? `${formatDate(formData.endDate)}   ${formData.endTime}` : '—'}
        </span>

        <span className="font-medium text-sm">Services Required:</span>
        <span className="text-sm">
          {formData?.services?.length ? formData.services.join(', ') : <span className="text-muted-foreground">None selected</span>}
        </span>

        <span className="font-medium text-sm">Cargo Manifest:</span>
        <span className="text-sm flex items-center gap-2">
          {formData?.cargoManifestPath ? (
            <>
              <FileIcon className="h-4 w-4" />
              {formData.cargoManifestPath}
              <span className="flex items-center gap-1 text-xs border rounded px-2 py-0.5">
                <CheckCircle2Icon className="h-3 w-3" /> Uploaded
              </span>
            </>
          ) : <span className="text-muted-foreground">No file uploaded</span>}
        </span>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-start sm:gap-0 sm:space-x-4">
        <Button variant="outline" onClick={() => setCancelOpen(true)}>
          Cancel
        </Button>
        <Button variant="outline" onClick={() => navigate({ to: '/berth-request-add' })}>
          Modify Request
        </Button>
        <Button onClick={() => setSuccessOpen(true)}>
          Confirm and Submit
        </Button>
      </div>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle className="uppercase tracking-wide">Confirmation Required</DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-center py-2">
            Canceling a Berth Request can't be undone.<br />Do you want to continue?
          </DialogDescription>
          <DialogFooter className="bg-transparent border-0 -mx-0 -mb-0 rounded-none flex-row justify-center gap-2">
            <Button onClick={handleConfirmCancel}>Yes</Button>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>No</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle className="uppercase tracking-wide">Success</DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-center py-2">
            Your Berth Request has been sent to the<br />Terminal Manager for review.
          </DialogDescription>
          <DialogFooter className="bg-transparent border-0 -mx-0 -mb-0 rounded-none flex-row justify-center">
            <Button onClick={handleConfirmSubmit}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Error Dialog when Berth registration submission fails*/}
      <Dialog open={error?.length > 0} onOpenChange={()=>setError('')}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle className="uppercase tracking-wide">Error</DialogTitle>
          </DialogHeader>
          <DialogDescription className="w-full max-w-md text-left py-2">
            {printDError()}
          </DialogDescription>
          <DialogFooter className="bg-transparent border-0 -mx-0 -mb-0 rounded-none flex-row justify-center">
            <Button onClick={()=>setError('')}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

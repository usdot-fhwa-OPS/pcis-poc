import { createFileRoute } from '@tanstack/react-router'
import { FileUploader } from '@aws-amplify/ui-react-storage';
import '@aws-amplify/ui-react/styles.css';

export const Route = createFileRoute('/import')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <main className="p-6">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">How to import Stow Plan Data</h1>
        <ol className="mt-6 space-y-4 list-decimal list-inside text-sm">
          <li>Locate your Stow Plan file on your computer (ensure it&apos;s in .csv format).</li>
          <li>Drag and drop the file into the upload area or click &quot;Browse Files&quot; to browse for it.</li>
          <li>Ensure the file name appears in the list with a success indicator.</li>
        </ol>

        <div className="mt-8">
          <h2 className="text-xl font-semibold tracking-tight">Start Stow Plan Data Import</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Upload and process your Stow Plan file for your container planning and management.<br />
            Required columns (in order): cargoUnitID, arrivalDate (M/DD/YYYY format), bcoEmail, bcoName, containerStatus 
            (On-Dock/On-Ship), destination, origin
          </p>
          <FileUploader
            acceptedFileTypes={[
              '.csv',
            ]}
            path="stowPlans/cargoUnits/"
            maxFileCount={1}
            isResumable
          />
        </div>
      </div>
    </main>
  )
}

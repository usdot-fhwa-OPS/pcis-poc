import { createFileRoute } from '@tanstack/react-router'
import { FileUploader } from '@aws-amplify/ui-react-storage';
import { Button } from "../components/ui/button";
import '@aws-amplify/ui-react/styles.css';

export const Route = createFileRoute('/import')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="w-full max-w-4xl px-6 py-6 md:px-10 md:py-8">
      <h1 className="mb-2 text-2xl leading-none font-bold text-gray-900">Upload Manifest</h1>
      <p className="mb-6 text-sm text-gray-700">Upload vessel manifest or Manifest &mdash; CSV format supported.</p>
      <div className="mb-4 p-6 bg-white border border-gray-200 rounded-xl">
        <h2 className="mb-2 text-lg leading-none font-medium text-gray-900">Upload Manifest File</h2>
        <p className="flex max-lg:flex-col gap-2 mb-6 text-sm text-gray-500">
          <span>Accepted format: .csv</span> <span className="max-lg:hidden font-bold">&#128900;</span> <span>This file contains: cargo unit IDs, vessel info, origin/destination, arrival timing</span>
        </p>
        <h3 className="mb-2 leading-none font-medium text-gray-900">Instructions for file attachment:</h3>
        <ol role="list" className="list-decimal list-inside space-y-2 mb-6 text-sm text-gray-700">
          <li>Locate your cargo manifest file on your computer.</li>
          <li>Drag and drop the file into the upload area below or select &ldquo;Browse Files&rdquo; to find it.</li>
          <li>A check mark will appear next to your file&apos;s name when it is uploaded.</li>
        </ol>
        <FileUploader
          acceptedFileTypes={[
            '.csv',
          ]}
          path="stowPlans/cargoUnits/"
          maxFileCount={1}
          isResumable
        />
      </div>
      <div className="mb-6 p-6 bg-white border border-gray-200 rounded-xl">
        <h3 className="mb-2 leading-none font-medium text-gray-900">Required Data Fields</h3>
        <p className="mb-4 pb-1 border-b text-sm text-gray-500">The manifest CSV must include the following columns:</p>
        <ul role="list" className="list-image-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%278%27%20height=%278%27%3E%3Ccircle%20cx=%274%27%20cy=%274%27%20r=%274%27%20fill=%27%232563eb%27/%3E%3C/svg%3E')] pl-0 grid grid-cols-2 max-sm:grid-cols-1 gap-x-6 gap-y-3 text-sm">
          <li className="ml-6 pr-6">
            <p className="font-medium text-gray-900">Cargo Unit ID</p>
            <p className="text-xs text-gray-500">Unique identifier per cargo unit (e.g. CGO-2026-0041)</p>
          </li>
          <li className="ml-6 pr-6">
            <p className="font-medium text-gray-900">Vessel Name</p>
            <p className="text-xs text-gray-500">Name of the vessel (e.g. MV Pacific Star)</p>
          </li>
          <li className="ml-6 pr-6">
            <p className="font-medium text-gray-900">Origin / Destination</p>
            <p className="text-xs text-gray-500">Port of origin and delivery destination</p>
          </li>
          <li className="ml-6 pr-6">
            <p className="font-medium text-gray-900">Arrival Timing</p>
            <p className="text-xs text-gray-500">Expected arrival date and time window</p>
          </li>
        </ul>
      </div>
      <div className="flex md:justify-end gap-3">
        <Button variant="outline">Cancel</Button>
        <Button variant="default">Submit Manifest</Button>
      </div>
    </div>
  )
}

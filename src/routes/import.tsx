import { createFileRoute } from '@tanstack/react-router'
import { FileUploader } from '@aws-amplify/ui-react-storage';
import { Button } from "../components/ui/button";
import '@aws-amplify/ui-react/styles.css';

export const Route = createFileRoute('/import')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="w-full px-6 py-6 md:px-10 md:py-8">

      <h1 className="mb-2 text-2xl leading-none font-semibold text-gray-900">Upload Manifest</h1>
      <p className="mb-4 text-sm text-gray-700">Upload vessel manifest or Manifest &mdash; CSV format supported.</p>
      <p className="mb-4font-medium text-gray-900">Instructions for file attachment:</p>
      <ol className="mb-8 space-y-4 list-decimal list-inside text-sm">
        <li>Locate your cargo ma nifest file on your computer.</li>
        <li>Drag and drop the file into the upload area below or select &ldquo;Browse Files&rdquo; to find it.</li>
        <li>A check mark will appear next to your file&apos;s name when it is uploaded.</li>
      </ol>

      <div className="mb-4 p-6 bg-white border border-gray-200 rounded-xl">
        <h2 className="mb-2 text-lg font-medium text-gray-900">Upload Manifest File</h2>
        <p className="flex max-sm:flex-col gap-x-2 mb-8 text-sm text-gray-500">
          <span>Accepted format: .csv</span> <span className="max-sm:hidden font-bold">&#128900;</span> <span>This file contains: cargo unit IDs, vessel info, origin/destination, arrival timing</span>
        </p>
        <FileUploader
          acceptedFileTypes={[
            '.csv',
          ]}
          path="stowPlans/"
          maxFileCount={1}
          isResumable
        />
      </div>
      <div className="mb-4 p-6 bg-white border border-gray-200 rounded-xl">
        <h3 className="mb-2 text-md font-medium text-gray-900">Required Data Fields</h3>
        <p className="mb-4 pb-2 border border-bottom text-sm text-gray-500">The manifest CSV must include the following columns:</p>
        <p>Bullet points here.</p>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button variant="default">Submit Manifest</Button>
      </div>

    </div>
  )
}

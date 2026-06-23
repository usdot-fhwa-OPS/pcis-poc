import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react'
import { HazardousCargoItem } from '../components/hazardous-cargo/hazardous-cargo-types'
import { useAppSelector } from '../hooks'
import { getHazardousCargoList } from '../components/hazardous-cargo/hazardous-cargo-state'
import { UserContext } from '../AppContext'
import React, { useContext } from 'react'
import { Checkbox } from '../components/ui/checkbox'
import { CheckedState } from '@radix-ui/react-checkbox'
import { completeDocumentCheck } from '../components/hazardous-cargo/hazardous-cargos-client'

export const Route = createFileRoute('/hazardous-cargo/$cargoUnitID')({
  component: HazardousCargoDetailPage,
})

function LabeledField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  )
}

function HazardousCargoDetailPage() {
  const { cargoUnitID } = Route.useParams()

    const userContext = useContext(UserContext);
    const userRole = userContext["custom:role"];
  

  const hazCargoList = useAppSelector(getHazardousCargoList)
  

  // TODO: Replace dummy data lookup with a DynamoDB query via Amplify once the
  // HazardousCargo model is available. Example:
  //   const { data: item } = await client.models.HazardousCargo.get({ cargoUnitID }, { authMode: 'apiKey' })
  const item: HazardousCargoItem | undefined = hazCargoList.find(
    (d) => d.cargoUnitID === cargoUnitID
  )

  if (!item) {
    return (
      <div className="w-full px-6 py-6 md:px-10 md:py-8 flex flex-col gap-4">
        <Link to="/hazardous-cargo" className="flex items-center gap-1 text-sm text-blue-600 hover:underline w-fit">
          <ArrowLeft className="h-4 w-4" /> Hazardous Cargo
        </Link>
        <p className="text-gray-500">Cargo unit not found.</p>
      </div>
    )
  }

  const isNonCompliant = !item.isCompliant
  const [documentsChecked, setDocumentsChecked] = React.useState<CheckedState>(item.documentsChecked)

  async function onDocumentChecked(state: CheckedState) {
    if (item && state) {
      await completeDocumentCheck(item?.vesselId, item?.cargoUnitID);
      setDocumentsChecked(state);

    }
  }

  return (
    <div className="w-full px-6 py-6 md:px-10 md:py-8 flex flex-col gap-5">
      {/* Back link */}
      <Link to="/hazardous-cargo" className="flex items-center gap-1 text-sm text-blue-600 hover:underline w-fit">
        <ArrowLeft className="h-4 w-4" /> Hazardous Cargo
      </Link>

      {/* Page title */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gray-900">Hazardous Cargo Details</h1>
        <p className="text-sm text-gray-500">
          Cargo Unit {item.cargoUnitID} · Vessel {item.vesselId} · Arrival {item.arrivalDate}
        </p>
      </div>

      {/* Non-compliant banner */}
      {isNonCompliant && (
        <div className="border border-red-300 bg-red-50 rounded-lg px-5 py-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-red-700 font-semibold text-sm">
            <XCircle className="h-4 w-4 flex-shrink-0" />
            Non-Compliant — Documentation Missing
          </div>
          <p className="text-red-600 text-sm">
            Required hazmat documentation has not been verified. Status set to Non-Compliant.
          </p>
          <p className="text-red-600 text-sm">
            Cargo is blocked from release until documentation is reviewed and confirmed.
          </p>
        </div>
      )}

      {/* Two-column detail layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Cargo Classification */}
        <div className="border border-gray-200 rounded-lg p-6 bg-white flex flex-col gap-5">
          <h2 className="text-base font-semibold text-gray-900">Cargo Classification</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <LabeledField label="Cargo Unit" value={item.cargoUnitID} />
            <LabeledField label="Vessel" value={item.vesselId} />
            <LabeledField label="BCO" value={item.bcoName} />
            {/* TODO: hazmatClass and unNumber are not yet in DynamoDB — populate when schema is extended. */}
            <LabeledField label="Hazmat Class" value={item.hazmatClass ?? '—'} />
            <LabeledField label="UN Number" value={item.unNumber ?? '—'} />
            <LabeledField label="Origin" value={item.origin} />
            <LabeledField label="Destination" value={item.destination} />
            <LabeledField label="Arrival Date" value={item.arrivalDate} />
          </div>
        </div>

        {/* Right: Required Documentation */}
        <div className="border border-gray-200 rounded-lg p-6 bg-white flex flex-col gap-5">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-base font-semibold text-gray-900">Required Documentation</h2>
            {/* TODO: Replace static timestamp with item.updatedAt once live data is connected. */}
            <p className="text-xs text-gray-500">
              Last updated — {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : 'Not available'}
            </p>
          </div>

          {/* TODO: Replace this single checkbox with the full document checklist once
              the DynamoDB schema is extended with individual document fields.
              Currently only documentsChecked is available as a boolean. */}
          <div className="flex flex-col gap-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="mt-0.5">
                {item.documentsChecked ? (
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                ) : (
                  ((userRole === 'Vessel Agent')  || (userRole === 'Beneficiary Cargo Owner'))?
                  (<Checkbox checked={documentsChecked} onCheckedChange={(state: CheckedState)=>onDocumentChecked(state)} />):
                  (<div className="h-5 w-5 rounded border-2 border-gray-300 flex-shrink-0" />)
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-gray-900">Documents Checked</span>
                <span className={`text-xs ${item.documentsChecked ? 'text-green-600' : 'text-red-500'}`}>
                  {item.documentsChecked ? 'Verified — documents confirmed present' : 'Not verified — review required'}
                </span>
              </div>
            </label>
          </div>

          {/* Summary footer */}
          <div className={`mt-auto pt-4 border-t text-sm flex items-center gap-2 ${isNonCompliant ? 'text-red-600' : 'text-green-600'}`}>
            {isNonCompliant ? (
              <>
                <XCircle className="h-4 w-4 flex-shrink-0" />
                Documentation incomplete · Non-Compliant
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                Documentation verified · Compliant
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

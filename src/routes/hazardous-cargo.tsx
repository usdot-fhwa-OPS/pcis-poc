import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import { HazardousCargoTable } from '../components/hazardous-cargo/hazardous-cargo-table'
import { HazardousCargoItem } from '../components/hazardous-cargo/hazardous-cargo-types'
import { dummyHazardousCargoData } from '../components/hazardous-cargo/hazardous-cargo-dummy-data'

export const Route = createFileRoute('/hazardous-cargo')({
  component: HazardousCargoPage,
})

// TODO: Replace dummy data fetch with a real DynamoDB query via Amplify when the
// HazardousCargo model is available. Example:
//   const { data } = await client.models.HazardousCargo.list({
//     filter: { isHazardous: { eq: true } },
//     authMode: 'apiKey',
//   })
function useHazardousCargoData() {
  const [data, setData] = useState<HazardousCargoItem[]>([])

  useEffect(() => {
    // TODO: Swap this line for the Amplify query above.
    setData(dummyHazardousCargoData)
  }, [])

  return data
}

function StatCard({
  label,
  value,
  sublabel,
  variant = 'default',
}: {
  label: string
  value: number | string
  sublabel: string
  variant?: 'default' | 'compliant' | 'missing'
}) {
  const valueColor =
    variant === 'compliant'
      ? 'text-green-600'
      : variant === 'missing'
      ? 'text-red-600'
      : 'text-gray-900'

  const borderColor =
    variant === 'missing' ? 'border-red-200' : 'border-gray-200'

  return (
    <div className={`bg-white border ${borderColor} rounded-lg p-5 flex flex-col gap-1`}>
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
      <span className={`text-3xl font-bold ${valueColor}`}>{value}</span>
      <span className="text-sm text-gray-500">{sublabel}</span>
    </div>
  )
}

function HazardousCargoPage() {
  const data = useHazardousCargoData()

  // TODO: These counts will be derived from the live DynamoDB query once backend is wired.
  const totalHazmat = data.length
  const documentationPresent = data.filter((item) => item.isCompliant).length
  const documentationMissing = data.filter((item) => !item.isCompliant).length

  return (
    <div className="w-full px-6 py-6 md:px-10 md:py-8 flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <TriangleAlert className="h-6 w-6 text-gray-700" />
          <h1 className="text-2xl font-bold text-gray-900">Hazardous Cargo</h1>
        </div>
        <p className="text-sm text-gray-500">
          System automatically scans all manifests for hazardous cargo classifications — UN number and hazard class
        </p>
      </div>

      {/* Summary widgets */}
      {/* TODO: Hook up each stat to the live DynamoDB query result once backend is integrated. */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Hazmat Cargo"
          value={totalHazmat}
          sublabel="across all vessels"
          variant="default"
        />
        <StatCard
          label="Documentation Present"
          value={documentationPresent}
          sublabel="compliant & cleared"
          variant="compliant"
        />
        <StatCard
          label="Documentation Missing"
          value={documentationMissing}
          sublabel="requires attention"
          variant="missing"
        />
      </div>

      {/* Hazardous cargo table */}
      {/* TODO: Pass live data from the Amplify query here instead of dummy data. */}
      <HazardousCargoTable data={data} />
    </div>
  )
}

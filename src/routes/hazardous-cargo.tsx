import { createFileRoute, Outlet, useMatchRoute } from '@tanstack/react-router'
import { useContext, useEffect, useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import { HazardousCargoTable } from '../components/hazardous-cargo/hazardous-cargo-table'
import { HazardousCargoItem } from '../components/hazardous-cargo/hazardous-cargo-types'
import { hazardousCargoList } from '../components/hazardous-cargo/hazardous-cargos-client'
import { useAppDispatch } from '../hooks'
import { populate } from '../components/hazardous-cargo/hazardous-cargo-state'
import { UserContext } from '../AppContext'

export const Route = createFileRoute('/hazardous-cargo')({
  component: HazardousCargoPage,
})

function useHazardousCargoData() {
  const userContext = useContext(UserContext);
  const userRole = userContext["custom:role"];
  const [data, setData] = useState<HazardousCargoItem[]>([])

  const dispatch = useAppDispatch()
  

  async function fetchHazardousCargoList() {

    let hazardousCargoItemList = [] as HazardousCargoItem[];
    if (userRole === 'Vessel Agent') {
      if (userContext.email) {
        hazardousCargoItemList = await hazardousCargoList('', userContext.email, '')
      }

    } else if (userRole === 'Beneficiary Cargo Owner') {

      if (userContext.email) {
        hazardousCargoItemList = await hazardousCargoList('', '', userContext.email)
      }

    } else if (userRole === 'Terminal Operator') {

      hazardousCargoItemList = await hazardousCargoList('', '', '')

    }

    dispatch(populate(hazardousCargoItemList));
    return hazardousCargoItemList;
  }

  useEffect(() => {
    if (!userRole) return
    fetchHazardousCargoList().then(list => setData(list))
  }, [userRole, userContext.email])

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
    <div className={`bg-white border ${borderColor} rounded-xl p-4 flex flex-col gap-1`}>
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
      <span className={`text-3xl font-bold ${valueColor}`}>{value}</span>
      <span className="text-sm text-gray-500">{sublabel}</span>
    </div>
  )
}

function HazardousCargoPage() {
  const data = useHazardousCargoData()
  const matchRoute = useMatchRoute()
  const isDetailView = matchRoute({ to: '/hazardous-cargo/$cargoUnitID' })

  // Render child route (detail page) when a cargoUnitID is matched.
  if (isDetailView) return <Outlet />

  // TODO: These counts will be derived from the live DynamoDB query once backend is wired.
  const totalHazmat = data.length
  const documentationPresent = data.filter((item) => item.isCompliant).length
  const documentationMissing = data.filter((item) => !item.isCompliant).length

  return (
    <div className="w-full px-6 py-6 md:px-10 md:py-8">
      {/* Page header */}
      <h1 className="flex items-center gap-2 mb-2 text-2xl leading-none font-bold text-gray-900">
        <TriangleAlert className="h-6 w-6 text-gray-700" />
        Hazardous Cargo
      </h1>
      <p className="mb-4 text-sm text-gray-700">
        System automatically scans all manifests for hazardous cargo classifications — UN number and hazard class
      </p>

      {/* Summary widgets */}
      {/* TODO: Hook up each stat to the live DynamoDB query result once backend is integrated. */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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

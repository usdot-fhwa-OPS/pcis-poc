import { createFileRoute } from '@tanstack/react-router'
import { flagHazardousCargo, getHazardousCargo, hazardousCargoList, requestAdditionalDocument, saveHazardousCargo } from '../components/hazardous-cargos/hazardous-cargos-client'
import { HazardousCargoDomain } from '../components/hazardous-cargos/hazardous-cargo-domain';

export const Route = createFileRoute('/hazardous-cargo-manager')({
  component: RouteComponent,
})


function RouteComponent() {
//    const hazardousCargo = saveHazardousCargo(JSON.parse('{ \
//  "vesselId": "5", \
//  "cargoUnitID": "AL-721", \
//  "arrivalDate": "3/14/2020", \
//  "bcoEmail": "yfd1k@indigobook.com", \
//  "bcoName": "Jane Doe", \
//  "destination": "Baltimore", \
//  "documentsChecked": false, \
//  "isCompliant": true, \
//  "isHazardous": true, \
//  "origin": "New York City", \
//  "vesselAgentEmail": "l9scihrptc@bwmyga.com" \
//   }') as HazardousCargoDomain);
 
  //const hazCargoList =  hazardousCargoList('6', 'l9scihrptc@bwmyga.com')
   //const hazCargoList2 =  hazardousCargoList('6')
  //const hazCargo =  getHazardousCargo('6', 'AL-821');
  const hazCargo =  requestAdditionalDocument('6', 'AL-821');
   const flaggedHazCargo =  flagHazardousCargo('5', 'AL-721');

  return (
    <div className="p-2">
      <h1 className="text-2xl font-bold text-center">Hazardous Cargo Management</h1>
    </div>
    
  )
}
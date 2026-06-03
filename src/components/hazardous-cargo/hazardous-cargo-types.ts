// Mirrors the DynamoDB HazardousCargo table schema.
// TODO: Update this type when the Amplify data model is finalized (add hazmatClass, unNumber).
export interface HazardousCargoItem {
  vesselId: string
  cargoUnitID: string
  // TODO: hazmatClass and unNumber are not yet in DynamoDB — add when schema is extended.
  hazmatClass?: string
  unNumber?: string
  isCompliant: boolean
  isHazardous: boolean
  arrivalDate: string
  bcoName: string
  bcoEmail: string
  destination: string
  origin: string
  documentsChecked: boolean
  reviewStatus?: string
  updatedAt?: string
  vesselAgentEmail?: string
  additionalDocumentPath?: string
}

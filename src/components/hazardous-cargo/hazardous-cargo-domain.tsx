export type HazardousCargoDomain = 
{
  vesselId: string,             // "1"
  containerId: string,          // "MD-123"
  weight: string,               // "18,500 kg"
  arrivalDate: string,          // "4/14/2026"
  bcoEmail: string,             // "Jane Doe"
  bcoName: string,              // "janedoe@xyz.com"
  cargoUnitStatus: string,      // "On-Dock" | "On-Ship"
  vesselAgentEmail: string,     // "John Doe"
  vesselAgentName: string,      // "johndoe@abc.com"
  origin: string,               // "Houston, TX"
  destination: string,          // "Baltimore, MD"
  isHazardous: boolean,         // true | false
  cargoType: string,            // "CHEMICALS" | "ELECTRONICS" | "CHEMICALS" | "FLAMMABLE" | "COMPRESSED GAS" | "MACHINERY" |
  reviewStatus: string,         // "APPROVED" | "FLAGGED" | "PENDING REVIEW" | "PENDING UPLOAD"
  priority: string,             // "LOW" | "MEDIUM" | "HIGH" 
  isCompliant: boolean,         // true | false 
}
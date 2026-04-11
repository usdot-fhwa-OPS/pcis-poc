export type BerthRequestDomain = {
  
  terminalId: string,
  vesselAgentEmail: string,
  vesselID: string,
  berthAssignment: {
    berthId: string,
    designation: string
  },
  etaAt: string,
  etdAt: string,
  services: string[],
  manifestFileName: string,
  manifestPath: string,
  manifestCsvContent: string,

}
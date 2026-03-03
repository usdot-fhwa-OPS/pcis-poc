export type TerminalCapacityDomain = {
  capacityId: string,           // "MAXIMUM" for default, UUID for temp capacities
  capacityType: string,         // "MAXIMUM" | "TEMPORARY"
  capacity: number,             // The actual capacity number
  startDate?: string,           // "YYYY-MM-DD" format
  startTime?: string,           // "HH:mm" format (24-hour)
  endDate?: string,             // "YYYY-MM-DD" format
  endTime?: string,             // "HH:mm" format (24-hour)
  repeat?: string,              // "none" | "daily" | "weekly" | "monthly" | "yearly" | "custom"
  reason?: string,              // "equipment_malfunction" | "maintenance" | "labor_shortage" | "other"
  
  // Recurrence configuration (only when repeat is set to custom)
  repeatConfig?: {
    frequency?: string,         // "daily" | "weekly" | "monthly" | "yearly"
    interval?: number,          // Every X days/weeks/months/years
    
    // Weekly specific
    daysOfWeek?: string[],      // ["monday", "wednesday"]
    
    // Monthly specific
    cycle?: string,             // "each" | "onThe"
    daysOfMonth?: number[],     // [10, 27] when cycle = "each"
    weekNumber?: string,        // "first" | "second" | "third" | "fourth" | "last"
    dayOfWeek?: string,         // "monday" through "sunday"
    
    // Yearly specific
    months?: string[],          // ["june", "december"]
    // Can also use weekNumber + dayOfWeek for yearly
  },
  
  createdAt: string,            // ISO 8601
  updatedAt: string,            // ISO 8601
  createdBy?: string,           // User ID
  isActive: boolean,            // For soft deletes
}
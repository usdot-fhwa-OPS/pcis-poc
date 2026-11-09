export type ClosureDomain = {
  sk: string,                   // "CLOSURE#<date>", e.g. "CLOSURE#2026-12-24"
  entityType: "CLOSURE",
  date: string,                 // "YYYY-MM-DD", in the terminal's timezone
  reason: string,               // e.g. "Christmas Eve", 1–100 characters
  openIntervals?: [             // Omit = closed all day. Set = reduced hours that day
    {
      open: string,             //   "HH:mm" (24-hour), e.g. "07:00"
      close: string
    }           //   "HH:mm" (24-hour), e.g. "12:00"
  ],
}
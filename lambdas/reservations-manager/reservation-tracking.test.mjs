import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createReservationTrackingRoutes, cognitoUserLookup, NOT_FOUND } from "./reservation-tracking.mjs";

const response = (statusCode, body) => ({ statusCode, body });

const RESERVATION = {
  reservationId: "r1",
  confirmationCode: "PCIS-AB12-CD34",
  terminalId: "NNMT",
  status: "CONFIRMED",
  modifiedByTerminal: true,
  startAt: "2026-11-20T14:00:00.000Z",
  endAt: "2026-11-20T15:30:00.000Z",
  preferredStartAt: "2026-11-20T13:00:00.000Z",
  requestingUserEmail: "tc@example.com",
  requestingUserName: "Robert Brown",
  executingUserEmail: "tc@example.com",
  twicEscortRequired: true,
  confirmedBy: "to@example.com",
  updatedAt: "2026-11-19T16:00:00.000Z",
};
const MOVES = [
  { moveId: "m2", reservationId: "r1", cargoUnitID: "MSCU-2", bookingNumber: "BKG-5501", equipmentType: "Crane", sequence: 2, gangName: "GANG A", gangId: "g-a" },
  { moveId: "m1", reservationId: "r1", cargoUnitID: "HLCU-1", equipmentType: "Forklift", sequence: 1, gangName: "GANG F", gangId: "g-f" },
];
const EVENTS = [
  { eventId: "e2", reservationId: "r1", type: "MODIFIED", actorEmail: "to@example.com", createdAt: "2026-11-19T16:00:00.000Z", data: { status: "CONFIRMED", before: {}, after: {}, gangs: [] } },
  { eventId: "e1", reservationId: "r1", type: "CREATED", actorEmail: "tc@example.com", createdAt: "2026-11-19T15:00:00.000Z", data: { status: "REQUESTED" } },
];
const CARGO = {
  "HLCU-1": {
    cargoUnitID: "HLCU-1", billOfLading: "BL-777", bcoName: "Dave Park", bcoEmail: "bco@example.com", transopName: "Jessica Taylor",
    transopEmail: "tc@example.com", voyageVesselName: "MV Pacific Star", vesselID: "1001", origin: "Oakland", destination: "Norfolk",
    weight: 4800, weightUnit: "lbs", hazmatClass: "3", unNumber: "UN1993", containerStatus: "On-Dock", yardBlock: "4-A",
    arrivalDate: "11/16/2026", reservationStatus: "Pending Pick Up", holds: { customs: true }, carrierScac: "MSCU",
  },
  "MSCU-2": { cargoUnitID: "MSCU-2", billOfLading: "BL-888", vesselID: "1002", containerStatus: "On-Ship" },
};
const BERTH_CONFIG = {
  NNMT: { terminalId: "NNMT", terminalName: "Newport News Marine Terminal", address: "25th St & Warwick Blvd Newport News, VA 23607", terminalEmail: "ops@example.com", overtimeRatePerHour: "250" },
};
const PEOPLE = {
  "to@example.com": { name: "Carlos Martinez", role: "Terminal Operator" },
  "tc@example.com": { name: "Robert Brown", role: "Trucking Operator" },
};

// Answers the GSI queries and the CargoUnits and BerthConfig GetItems the route makes, and records every call.
function fakeDb({ reservations = [RESERVATION], moves = MOVES, events = EVENTS, cargo = CARGO, berthConfig = BERTH_CONFIG } = {}) {
  const calls = [];
  return {
    calls,
    async send(cmd) {
      const { input } = cmd;
      calls.push({ name: cmd.constructor.name, table: input.TableName, index: input.IndexName });
      if (cmd.constructor.name === "GetCommand") {
        return { Item: input.TableName === "BerthConfig" ? berthConfig[input.Key.terminalId] : cargo[input.Key.cargoUnitID] };
      }
      const v = input.ExpressionAttributeValues;
      if (input.TableName === "Reservations") return { Items: reservations.filter((r) => r.confirmationCode === v[":c"]) };
      if (input.TableName === "ReservationMoves") return { Items: moves.filter((m) => m.reservationId === v[":r"]) };
      if (input.TableName === "ReservationEvents") return { Items: events.filter((e) => e.reservationId === v[":r"]) };
      throw new Error(`unexpected ${input.TableName}`);
    },
  };
}

const lookupUser = async (email) => PEOPLE[email] || {};

const track = (db, body, lookup = lookupUser) =>
  createReservationTrackingRoutes({ db, response, lookupUser: lookup }).trackReservation({
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

describe("POST /public/track", () => {
  test("the right code and a cargo unit ID return the guest view from the G-2 mockup", async () => {
    const res = await track(fakeDb(), { code: "PCIS-AB12-CD34", factor: "HLCU-1" });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
      confirmationCode: "PCIS-AB12-CD34",
      status: "CONFIRMED",
      modifiedByTerminal: true,
      updatedAt: "2026-11-19T16:00:00.000Z",
      terminal: { id: "NNMT", name: "Newport News Marine Terminal", address: "25th St & Warwick Blvd Newport News, VA 23607" },
      window: { start: "2026-11-20T14:00:00.000Z", end: "2026-11-20T15:30:00.000Z" },
      requestedStartAt: "2026-11-20T13:00:00.000Z",
      twicEscortRequired: true,
      driver: { name: "Robert Brown" },
      equipment: ["Forklift", "Crane"],
      cargoUnits: [
        {
          cargoUnitID: "HLCU-1", equipmentType: "Forklift", vessel: "MV Pacific Star", origin: "Oakland", destination: "Norfolk",
          weight: 4800, weightUnit: "lbs", hazmatClass: "3", unNumber: "UN1993", containerStatus: "On-Dock", location: "4-A",
          arrivalDate: "11/16/2026", pickupStatus: "Pending Pick Up", bcoName: "Dave Park", transportationCoordinatorName: "Jessica Taylor",
        },
        {
          cargoUnitID: "MSCU-2", equipmentType: "Crane", vessel: "1002", origin: null, destination: null,
          weight: null, weightUnit: null, hazmatClass: null, unNumber: null, containerStatus: "On-Ship", location: null,
          arrivalDate: null, pickupStatus: null, bcoName: null, transportationCoordinatorName: null,
        },
      ],
      history: [
        { type: "CREATED", status: "REQUESTED", at: "2026-11-19T15:00:00.000Z", actor: { name: "Robert Brown", role: "Trucking Operator" } },
        { type: "MODIFIED", status: "CONFIRMED", at: "2026-11-19T16:00:00.000Z", actor: { name: "Carlos Martinez", role: "Terminal Operator" } },
      ],
    });
  });

  test("a bill of lading number works as the factor, ignoring case and spaces", async () => {
    const res = await track(fakeDb(), { code: " pcis-ab12-cd34 ", factor: " bl-888 " });
    assert.equal(res.statusCode, 200);
  });

  test("an export booking number on a move works as the factor", async () => {
    const res = await track(fakeDb(), { code: "PCIS-AB12-CD34", factor: "bkg-5501" });
    assert.equal(res.statusCode, 200);
  });

  test("wrong code, wrong factor, both, or missing input give an identical not-found", async () => {
    const bodies = [
      { code: "PCIS-ZZZZ-ZZZZ", factor: "HLCU-1" },
      { code: "PCIS-AB12-CD34", factor: "NOPE-9" },
      { code: "PCIS-ZZZZ-ZZZZ", factor: "NOPE-9" },
      { code: "PCIS-AB12-CD34" },
      { factor: "HLCU-1" },
      { code: "not a code", factor: "HLCU-1" },
      { code: "PCIS-AB12-CD34", factor: "X".repeat(101) },
      "{not json",
      "[]",
    ];
    for (const body of bodies) {
      const res = await track(fakeDb(), body);
      assert.deepEqual(res, { statusCode: 404, body: NOT_FOUND }, JSON.stringify(body));
    }
  });

  test("never returns emails, BL or booking numbers, gangs, holds, or internal IDs", async () => {
    const res = await track(fakeDb(), { code: "PCIS-AB12-CD34", factor: "HLCU-1" });
    const text = JSON.stringify(res.body);
    for (const leak of ["@", "BL-", "BKG-", "GANG", "g-a", "customs", "MSCU\"", "reservationId", "\"r1\"", "moveId", "eventId", "250"]) {
      assert.ok(!text.includes(leak), `leaked ${leak}`);
    }
  });

  test("an unconfirmed reservation shows no time window but keeps the requested start", async () => {
    const db = fakeDb({ reservations: [{ ...RESERVATION, status: "REQUESTED", modifiedByTerminal: undefined, twicEscortRequired: undefined }] });
    const res = await track(db, { code: "PCIS-AB12-CD34", factor: "HLCU-1" });
    assert.equal(res.body.window, null);
    assert.equal(res.body.requestedStartAt, "2026-11-20T13:00:00.000Z");
    assert.equal(res.body.modifiedByTerminal, false);
    assert.equal(res.body.twicEscortRequired, null);
  });

  test("a terminal with no BerthConfig record returns null name and address", async () => {
    const res = await track(fakeDb({ berthConfig: {} }), { code: "PCIS-AB12-CD34", factor: "HLCU-1" });
    assert.deepEqual(res.body.terminal, { id: "NNMT", name: null, address: null });
  });

  test("an actor the lookup can't find shows as null, and the lookup runs once per person", async () => {
    const seen = [];
    const lookup = async (email) => (seen.push(email), email === "to@example.com" ? {} : PEOPLE[email]);
    const events = [...EVENTS, { ...EVENTS[0], eventId: "e3", createdAt: "2026-11-19T17:00:00.000Z" }];
    const res = await track(fakeDb({ events }), { code: "PCIS-AB12-CD34", factor: "HLCU-1" }, lookup);
    assert.deepEqual(res.body.history[1].actor, { name: null, role: null });
    assert.deepEqual(seen.sort(), ["tc@example.com", "to@example.com"]);
  });

  test("looks up by the confirmation code index, never a table scan", async () => {
    const db = fakeDb();
    await track(db, { code: "PCIS-AB12-CD34", factor: "HLCU-1" });
    assert.ok(!db.calls.some((c) => c.name === "ScanCommand"));
    assert.deepEqual(db.calls[0], { name: "QueryCommand", table: "Reservations", index: "GSI_confirmationCode" });
  });

  test("a database error returns a generic 500 without internal details", async () => {
    const db = { async send() { throw new Error("AccessDeniedException: secret arn"); } };
    const original = console.error;
    console.error = () => {};
    try {
      const res = await track(db, { code: "PCIS-AB12-CD34", factor: "HLCU-1" });
      assert.equal(res.statusCode, 500);
      assert.ok(!JSON.stringify(res.body).includes("arn"));
    } finally {
      console.error = original;
    }
  });
});

describe("cognitoUserLookup", () => {
  test("builds name and role from Cognito attributes, filtering by email", async () => {
    let sent;
    const client = {
      async send(cmd) {
        sent = cmd.input;
        return { Users: [{ Attributes: [{ Name: "given_name", Value: "Carlos" }, { Name: "family_name", Value: "Martinez" }, { Name: "custom:role", Value: "Terminal Operator" }, { Name: "email", Value: "to@example.com" }] }] };
      },
    };
    assert.deepEqual(await cognitoUserLookup(client)("to@example.com"), { name: "Carlos Martinez", role: "Terminal Operator" });
    assert.equal(sent.Filter, 'email = "to@example.com"');
  });

  test("refuses values that could break the filter, and swallows errors", async () => {
    const client = { async send() { throw new Error("boom"); } };
    const original = console.error;
    console.error = () => {};
    try {
      assert.deepEqual(await cognitoUserLookup(client)('x" or email ^= "'), {});
      assert.deepEqual(await cognitoUserLookup(client)("to@example.com"), {});
    } finally {
      console.error = original;
    }
  });
});

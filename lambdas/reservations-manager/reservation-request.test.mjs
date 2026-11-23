import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  createReservationRequestRoutes,
  legacyDateTime,
  hasActiveHolds,
  ACCEPTED_STATUS,
  LEGACY_REQUESTED_STATUS,
} from "./reservation-request.mjs";

const NOW = new Date("2026-11-18T15:00:00Z");
const TC = { email: "tc@example.com", "custom:role": "Trucking Operator", given_name: "Tess", family_name: "Coord" };

// In-memory stand-in for the DynamoDB document client.
class FakeDb {
  constructor() {
    this.tables = { CargoUnits: new Map(), TerminalResources: new Map(), Reservations: new Map(), ReservationMoves: new Map(), ReservationEvents: new Map() };
    this.transactions = [];
    this.failNextTransaction = false;
  }
  key(table, key) {
    return table === "TerminalResources" ? `${key.terminalId}|${key.sk}` : Object.values(key)[0];
  }
  put(table, item) {
    const key = table === "TerminalResources" ? { terminalId: item.terminalId, sk: item.sk } : item;
    const id = table === "TerminalResources" ? this.key(table, key) : item[{ CargoUnits: "cargoUnitID", Reservations: "reservationId", ReservationMoves: "moveId", ReservationEvents: "eventId" }[table]];
    this.tables[table].set(id, structuredClone(item));
  }
  async send(cmd) {
    const name = cmd.constructor.name;
    const input = cmd.input;
    if (name === "GetCommand") {
      const item = this.tables[input.TableName].get(this.key(input.TableName, input.Key));
      return { Item: item && structuredClone(item) };
    }
    if (name === "QueryCommand") {
      const t = input.ExpressionAttributeValues[":t"];
      const p = input.ExpressionAttributeValues[":p"];
      const Items = [...this.tables[input.TableName].values()].filter((i) => i.terminalId === t && i.sk.startsWith(p));
      return { Items };
    }
    if (name === "TransactWriteCommand") {
      if (this.failNextTransaction) {
        this.failNextTransaction = false;
        const err = new Error("Transaction cancelled");
        err.name = "TransactionCanceledException";
        throw err;
      }
      this.transactions.push(input.TransactItems);
      for (const op of input.TransactItems) {
        if (op.Put) this.put(op.Put.TableName, op.Put.Item);
        if (op.Update) {
          const unit = this.tables.CargoUnits.get(op.Update.Key.cargoUnitID);
          const v = op.Update.ExpressionAttributeValues;
          Object.assign(unit, {
            reservationStatus: v[":requested"], reservationDate: v[":d"], reservationTime: v[":t"],
            reservationId: v[":rid"], isTerminalNotify: true, isBCONotify: true, isTransportationNotify: false, updatedAt: v[":now"],
          });
        }
      }
      return {};
    }
    throw new Error(`Unexpected command ${name}`);
  }
}

const response = (statusCode, body) => ({ statusCode, body });

function setup({ claims = TC } = {}) {
  const db = new FakeDb();
  db.put("CargoUnits", {
    cargoUnitID: "HLCU-1", terminalID: "NNMT", transopEmail: "TC@example.com", bcoEmail: "bco@example.com",
    reservationStatus: ACCEPTED_STATUS, containerStatus: "On-Dock", holds: {},
  });
  db.put("CargoUnits", {
    cargoUnitID: "HLCU-2", terminalID: "NNMT", transopEmail: "tc@example.com", bcoEmail: "bco@example.com",
    reservationStatus: ACCEPTED_STATUS, containerStatus: "On-Dock", holds: {},
  });
  db.put("TerminalResources", { terminalId: "NNMT", sk: "EQTYPE#FORKLIFT", record: { equipmentType: "FORKLIFT", label: "Forklift", defaultDurationMins: 60, gangsRequired: 1, active: true } });
  db.put("TerminalResources", { terminalId: "NNMT", sk: "EQTYPE#HEAVY_LIFT_CRANE", record: { equipmentType: "HEAVY_LIFT_CRANE", label: "Heavy-Lift Crane", defaultDurationMins: 180, gangsRequired: 1, active: true } });
  db.put("TerminalResources", { terminalId: "NNMT", sk: "EQTYPE#CRANE", record: { equipmentType: "CRANE", label: "Crane", defaultDurationMins: 90, active: false } });
  db.put("TerminalResources", { terminalId: "NNMT", sk: "GANG#1", record: { name: "Gang A" } });
  const verify = async (token) => {
    if (token !== "good") throw new Error("bad token");
    return claims;
  };
  const routes = createReservationRequestRoutes({ db, response, verify, now: () => NOW });
  return { db, routes };
}

const authed = (extra = {}) => ({ headers: { Authorization: "Bearer good" }, ...extra });
const createEvent = (body) => authed({ body: JSON.stringify(body) });
const validBody = (over = {}) => ({
  preferredStartAt: "2026-11-20T14:00:00.000Z",
  moves: [{ cargoUnitID: "HLCU-1", equipmentType: "HEAVY_LIFT_CRANE" }],
  ...over,
});

describe("listEquipmentTypes", () => {
  test("lists active equipment types for the cargo unit's terminal, sorted by label", async () => {
    const { routes } = setup();
    const res = await routes.listEquipmentTypes(authed({ queryStringParameters: { cargoUnitID: "HLCU-1" } }));
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.terminalId, "NNMT");
    assert.deepEqual(res.body.items.map((i) => i.equipmentType), ["FORKLIFT", "HEAVY_LIFT_CRANE"]);
  });

  test("rejects a TC asking about cargo that isn't assigned to them", async () => {
    const { routes } = setup({ claims: { ...TC, email: "other@example.com" } });
    const res = await routes.listEquipmentTypes(authed({ queryStringParameters: { cargoUnitID: "HLCU-1" } }));
    assert.equal(res.statusCode, 403);
  });

  test("requires a valid token", async () => {
    const { routes } = setup();
    assert.equal((await routes.listEquipmentTypes({ headers: {} })).statusCode, 401);
    assert.equal((await routes.listEquipmentTypes({ headers: { Authorization: "Bearer bad" } })).statusCode, 401);
  });
});

describe("createReservationRequest", () => {
  let ctx;
  beforeEach(() => {
    ctx = setup();
  });

  test("creates a REQUESTED reservation, one move per unit, a CREATED event and updates the old CargoUnits fields", async () => {
    const res = await ctx.routes.createReservationRequest(createEvent(validBody()));
    assert.equal(res.statusCode, 201);
    assert.match(res.body.confirmationCode, /^PCIS-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    assert.equal(res.body.durationMins, 180);
    assert.equal(res.body.endAt, "2026-11-20T17:00:00.000Z");

    const reservation = ctx.db.tables.Reservations.get(res.body.reservationId);
    assert.equal(reservation.status, "REQUESTED");
    assert.equal(reservation.terminalId, "NNMT");
    assert.equal(reservation.requestingUserEmail, "tc@example.com");
    assert.equal(reservation.executingUserEmail, "tc@example.com");
    assert.deepEqual(reservation.cargoOwnerEmails, ["bco@example.com"]);

    const moves = [...ctx.db.tables.ReservationMoves.values()];
    assert.equal(moves.length, 1);
    assert.equal(moves[0].sequence, 1);
    assert.equal(moves[0].durationMins, 180);
    assert.equal(moves[0].moveType, "PICKUP");

    const events = [...ctx.db.tables.ReservationEvents.values()];
    assert.equal(events.length, 1);
    assert.equal(events[0].type, "CREATED");

    const unit = ctx.db.tables.CargoUnits.get("HLCU-1");
    assert.equal(unit.reservationStatus, LEGACY_REQUESTED_STATUS);
    assert.equal(unit.reservationDate, "11/20/2026");
    assert.equal(unit.reservationTime, "09:00 AM");
    assert.equal(unit.reservationId, res.body.reservationId);
  });

  test("a two-unit visit sums the durations and keeps the moves in order", async () => {
    const res = await ctx.routes.createReservationRequest(
      createEvent(validBody({ moves: [
        { cargoUnitID: "HLCU-1", equipmentType: "FORKLIFT" },
        { cargoUnitID: "HLCU-2", equipmentType: "HEAVY_LIFT_CRANE" },
      ] }))
    );
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.durationMins, 240);
    const moves = [...ctx.db.tables.ReservationMoves.values()].sort((a, b) => a.sequence - b.sequence);
    assert.deepEqual(moves.map((m) => [m.cargoUnitID, m.sequence]), [["HLCU-1", 1], ["HLCU-2", 2]]);
  });

  test("ignores any duration sent by the client", async () => {
    const res = await ctx.routes.createReservationRequest(
      createEvent(validBody({ moves: [{ cargoUnitID: "HLCU-1", equipmentType: "FORKLIFT", durationMins: 1 }] }))
    );
    assert.equal(res.body.durationMins, 60);
  });

  const rejections = [
    ["a role that isn't a TC", () => setup({ claims: { ...TC, "custom:role": "Beneficiary Cargo Owner" } }), validBody(), 403],
    ["cargo assigned to another TC", () => setup({ claims: { ...TC, email: "other@example.com" } }), validBody(), 403],
    ["a missing time", null, validBody({ preferredStartAt: undefined }), 400],
    ["a time in the past", null, validBody({ preferredStartAt: "2026-11-17T10:00:00Z" }), 400],
    ["no cargo units", null, validBody({ moves: [] }), 400],
    ["the same unit twice", null, validBody({ moves: [{ cargoUnitID: "HLCU-1", equipmentType: "FORKLIFT" }, { cargoUnitID: "HLCU-1", equipmentType: "FORKLIFT" }] }), 400],
    ["an unknown cargo unit", null, validBody({ moves: [{ cargoUnitID: "NOPE", equipmentType: "FORKLIFT" }] }), 404],
    ["an inactive equipment type", null, validBody({ moves: [{ cargoUnitID: "HLCU-1", equipmentType: "CRANE" }] }), 400],
    ["an unknown equipment type", null, validBody({ moves: [{ cargoUnitID: "HLCU-1", equipmentType: "ROCKET" }] }), 400],
    ["a mismatched terminalId", null, validBody({ terminalId: "OTHER" }), 400],
  ];
  for (const [label, makeCtx, body, status] of rejections) {
    test(`rejects ${label} (${status}) and writes nothing`, async () => {
      const c = makeCtx ? makeCtx() : ctx;
      const res = await c.routes.createReservationRequest(createEvent(body));
      assert.equal(res.statusCode, status, JSON.stringify(res.body));
      assert.equal(c.db.transactions.length, 0);
    });
  }

  test("rejects units that are on the ship, held, at another terminal or already reserved", async () => {
    const cases = [
      [{ containerStatus: "On-Ship" }, 422],
      [{ holds: { customs: true } }, 422],
      [{ terminalID: undefined }, 422],
      [{ reservationStatus: LEGACY_REQUESTED_STATUS }, 409],
    ];
    for (const [patch, status] of cases) {
      const c = setup();
      Object.assign(c.db.tables.CargoUnits.get("HLCU-1"), patch);
      const res = await c.routes.createReservationRequest(createEvent(validBody()));
      assert.equal(res.statusCode, status, JSON.stringify(patch));
      assert.equal(c.db.transactions.length, 0);
    }
    const c = setup();
    c.db.tables.CargoUnits.get("HLCU-2").terminalID = "OTHER";
    const res = await c.routes.createReservationRequest(createEvent(validBody({ moves: [
      { cargoUnitID: "HLCU-1", equipmentType: "FORKLIFT" },
      { cargoUnitID: "HLCU-2", equipmentType: "FORKLIFT" },
    ] })));
    assert.equal(res.statusCode, 400);
  });

  test("returns 409 when the unit changes between the check and the write", async () => {
    ctx.db.failNextTransaction = true;
    const res = await ctx.routes.createReservationRequest(createEvent(validBody()));
    assert.equal(res.statusCode, 409);
  });
});

describe("helpers", () => {
  test("legacyDateTime formats in the terminal's time zone", () => {
    assert.deepEqual(legacyDateTime(new Date("2026-04-24T16:00:00Z")), { reservationDate: "04/24/2026", reservationTime: "12:00 PM" });
    assert.deepEqual(legacyDateTime(new Date("2026-12-01T05:30:00Z")), { reservationDate: "12/01/2026", reservationTime: "12:30 AM" });
  });

  test("hasActiveHolds treats empty maps and lists as no holds", () => {
    assert.equal(hasActiveHolds({}), false);
    assert.equal(hasActiveHolds([]), false);
    assert.equal(hasActiveHolds(undefined), false);
    assert.equal(hasActiveHolds({ customs: false }), false);
    assert.equal(hasActiveHolds({ customs: true }), true);
    assert.equal(hasActiveHolds(["CUSTOMS"]), true);
  });
});

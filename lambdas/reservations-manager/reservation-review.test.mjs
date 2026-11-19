import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createReservationReviewRoutes, LEGACY_CONFIRMED_STATUS } from "./reservation-review.mjs";
import { ACCEPTED_STATUS, LEGACY_REQUESTED_STATUS } from "./reservation-request.mjs";

const NOW = new Date("2026-11-18T15:00:00Z");
const TO = { email: "to@example.com", "custom:role": "Terminal Operator", "custom:terminalId": "PMT,NNMT" };

const KEYS = { CargoUnits: "cargoUnitID", Reservations: "reservationId", ReservationMoves: "moveId", ReservationEvents: "eventId" };

// In-memory DynamoDB stand-in that understands the simple SET/REMOVE updates and "a = :b AND …" conditions used here.
class FakeDb {
  constructor() {
    this.tables = Object.fromEntries([...Object.keys(KEYS), "TerminalResources"].map((t) => [t, new Map()]));
  }
  id(table, key) {
    return table === "TerminalResources" ? `${key.terminalId}|${key.sk}` : key[KEYS[table]];
  }
  put(table, item) {
    this.tables[table].set(this.id(table, item), structuredClone(item));
  }
  resolve(name, names) {
    return names?.[name] ?? name;
  }
  check(item, expr, names, values) {
    if (!expr) return true;
    return expr.split(" AND ").every((clause) => {
      const [field, value] = clause.split(" = ").map((s) => s.trim());
      return item?.[this.resolve(field, names)] === values[value];
    });
  }
  async send(cmd) {
    const name = cmd.constructor.name;
    const input = cmd.input;
    if (name === "GetCommand") {
      const item = this.tables[input.TableName].get(this.id(input.TableName, input.Key));
      return { Item: item && structuredClone(item) };
    }
    if (name === "QueryCommand") {
      const v = input.ExpressionAttributeValues;
      const items = [...this.tables[input.TableName].values()].filter((i) =>
        input.TableName === "TerminalResources"
          ? i.terminalId === v[":t"] && i.sk.startsWith(v[":p"])
          : i.reservationId === v[":r"]
      );
      return { Items: structuredClone(items) };
    }
    if (name === "ScanCommand") {
      const v = input.ExpressionAttributeValues;
      const terminals = Object.entries(v).filter(([k]) => k.startsWith(":t")).map(([, t]) => t);
      const items = [...this.tables[input.TableName].values()].filter(
        (i) => i.status === v[":requested"] && terminals.includes(i.terminalId)
      );
      return { Items: structuredClone(items) };
    }
    if (name === "TransactWriteCommand") {
      // All conditions first, then all writes, like a real transaction.
      for (const op of input.TransactItems) {
        const u = op.Update || op.Put;
        const existing = op.Update ? this.tables[u.TableName].get(this.id(u.TableName, u.Key)) : undefined;
        if (op.Update && !this.check(existing, u.ConditionExpression, u.ExpressionAttributeNames, u.ExpressionAttributeValues)) {
          const err = new Error("Transaction cancelled");
          err.name = "TransactionCanceledException";
          throw err;
        }
      }
      this.lastTransaction = input.TransactItems;
      for (const op of input.TransactItems) {
        if (op.Put) this.put(op.Put.TableName, op.Put.Item);
        if (op.Update) {
          const u = op.Update;
          const item = this.tables[u.TableName].get(this.id(u.TableName, u.Key));
          const [setPart, removePart] = u.UpdateExpression.replace(/^SET /, "").split(" REMOVE ");
          for (const assignment of setPart.split(", ")) {
            const [field, value] = assignment.split(" = ");
            item[this.resolve(field, u.ExpressionAttributeNames)] = u.ExpressionAttributeValues[value];
          }
          for (const field of removePart ? removePart.split(", ") : []) delete item[field];
        }
      }
      return {};
    }
    throw new Error(`Unexpected command ${name}`);
  }
}

const response = (statusCode, body) => ({ statusCode, body });

function setup({ claims = TO } = {}) {
  const db = new FakeDb();
  db.put("TerminalResources", { terminalId: "NNMT", sk: "EQTYPE#FORKLIFT", record: { equipmentType: "FORKLIFT", label: "Forklift", defaultDurationMins: 60, active: true } });
  db.put("TerminalResources", { terminalId: "NNMT", sk: "EQTYPE#CRANE", record: { equipmentType: "CRANE", label: "Crane", defaultDurationMins: 90, active: true } });
  db.put("Reservations", {
    reservationId: "R1", confirmationCode: "PCIS-AAAA-BBBB", status: "REQUESTED", terminalId: "NNMT",
    startAt: "2026-11-20T14:00:00.000Z", endAt: "2026-11-20T15:00:00.000Z", durationMins: 60,
    requestingUserEmail: "tc@example.com", createdAt: "2026-11-18T12:00:00.000Z",
  });
  db.put("ReservationMoves", { moveId: "M1", reservationId: "R1", cargoUnitID: "CU-1", equipmentType: "FORKLIFT", durationMins: 60, sequence: 1, status: "REQUESTED" });
  db.put("CargoUnits", {
    cargoUnitID: "CU-1", vesselID: "1001", bcoName: "BCO", transopName: "TC", transopEmail: "tc@example.com",
    reservationStatus: LEGACY_REQUESTED_STATUS, reservationId: "R1", reservationDate: "11/20/2026", reservationTime: "09:00 AM",
  });
  db.put("Reservations", { reservationId: "R2", status: "REQUESTED", terminalId: "PORTX", startAt: "2026-11-21T14:00:00.000Z" });
  db.put("TerminalResources", { terminalId: "NNMT", sk: "GANG#G1", record: { entityType: "GANG", gangId: "G1", name: "GANG F", equipmentType: ["FORKLIFT"], active: true } });
  db.put("TerminalResources", { terminalId: "NNMT", sk: "GANG#G2", record: { entityType: "GANG", gangId: "G2", name: "GANG OLD", equipmentType: ["CRANE"], active: false } });
  db.put("TerminalResources", { terminalId: "PORTX", sk: "GANG#G9", record: { entityType: "GANG", gangId: "G9", name: "GANG X", equipmentTypes: ["CRANE"], active: true } });
  const verify = async (token) => {
    if (token !== "good") throw new Error("bad token");
    return claims;
  };
  return { db, routes: createReservationReviewRoutes({ db, response, verify, now: () => NOW }) };
}

const post = (body) => ({ headers: { Authorization: "Bearer good" }, body: JSON.stringify(body) });
const GANG = [{ moveId: "M1", gangId: "G1" }];
const events = (db) => [...db.tables.ReservationEvents.values()];

describe("listReservationRequests", () => {
  test("lists REQUESTED reservations only for the TO's terminals, with move and cargo details", async () => {
    const { routes } = setup();
    const res = await routes.listReservationRequests({ headers: { Authorization: "Bearer good" } });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body.items.map((i) => i.reservationId), ["R1"]);
    const move = res.body.items[0].moves[0];
    assert.equal(move.equipmentLabel, "Forklift");
    assert.equal(move.vesselID, "1001");
    assert.equal(move.transopName, "TC");
    assert.deepEqual(res.body.gangs.NNMT, [{ gangId: "G1", name: "GANG F", equipmentTypes: ["FORKLIFT"] }], "active gangs only");
  });

  test("refuses non-TOs and TOs without a terminal", async () => {
    let { routes } = setup({ claims: { ...TO, "custom:role": "Trucking Operator" } });
    assert.equal((await routes.listReservationRequests({ headers: { Authorization: "Bearer good" } })).statusCode, 403);
    ({ routes } = setup({ claims: { ...TO, "custom:terminalId": "" } }));
    assert.equal((await routes.listReservationRequests({ headers: { Authorization: "Bearer good" } })).statusCode, 403);
  });
});

describe("acceptReservation", () => {
  test("confirms the reservation and moves, writes one CONFIRMED event and bridges the cargo unit", async () => {
    const { db, routes } = setup();
    const res = await routes.acceptReservation(post({ reservationId: "R1", twicEscortRequired: true, gangAssignments: GANG }));
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    const r = db.tables.Reservations.get("R1");
    assert.equal(r.status, "CONFIRMED");
    assert.equal(r.twicEscortRequired, true);
    assert.equal(r.confirmedBy, "to@example.com");
    const move = db.tables.ReservationMoves.get("M1");
    assert.equal(move.status, "CONFIRMED");
    assert.deepEqual([move.gangId, move.gangName, move.laborType, move.laborQuantity], ["G1", "GANG F", "GANG", 1]);
    assert.deepEqual(events(db).map((e) => e.type), ["CONFIRMED"]);
    assert.equal(events(db)[0].data.gangs[0].gangName, "GANG F");
    const unit = db.tables.CargoUnits.get("CU-1");
    assert.equal(unit.reservationStatus, LEGACY_CONFIRMED_STATUS);
    assert.equal(unit.twicEscortRequired, true);
    assert.equal(unit.resApprovalDate, "11/18/2026");
    assert.equal(unit.reservationTime, "09:00 AM", "time unchanged on accept");
  });

  test("requires an active gang from the reservation's terminal for every move", async () => {
    for (const gangAssignments of [undefined, [], [{ moveId: "M1", gangId: "G2" }], [{ moveId: "M1", gangId: "G9" }], [{ moveId: "M1", gangId: "NOPE" }]]) {
      const { db, routes } = setup();
      const res = await routes.acceptReservation(post({ reservationId: "R1", twicEscortRequired: false, gangAssignments }));
      assert.equal(res.statusCode, 400, JSON.stringify(gangAssignments));
      assert.equal(db.tables.Reservations.get("R1").status, "REQUESTED");
    }
  });

  test("requires the TWIC answer", async () => {
    const { routes } = setup();
    assert.equal((await routes.acceptReservation(post({ reservationId: "R1" }))).statusCode, 400);
  });

  test("another terminal's reservation looks like it doesn't exist", async () => {
    const { routes } = setup();
    assert.equal((await routes.acceptReservation(post({ reservationId: "R2", twicEscortRequired: false, gangAssignments: GANG }))).statusCode, 404);
  });

  test("can't accept twice", async () => {
    const { routes } = setup();
    await routes.acceptReservation(post({ reservationId: "R1", twicEscortRequired: false, gangAssignments: GANG }));
    assert.equal((await routes.acceptReservation(post({ reservationId: "R1", twicEscortRequired: false, gangAssignments: GANG }))).statusCode, 409);
  });

  test("returns 409 and writes nothing if the cargo unit no longer matches", async () => {
    const { db, routes } = setup();
    db.tables.CargoUnits.get("CU-1").reservationStatus = ACCEPTED_STATUS;
    const res = await routes.acceptReservation(post({ reservationId: "R1", twicEscortRequired: false, gangAssignments: GANG }));
    assert.equal(res.statusCode, 409);
    assert.equal(db.tables.Reservations.get("R1").status, "REQUESTED");
    assert.equal(events(db).length, 0);
  });
});

describe("modifyReservation", () => {
  test("changes time and equipment, recomputes duration, confirms and records before/after", async () => {
    const { db, routes } = setup();
    const res = await routes.modifyReservation(
      post({ reservationId: "R1", startAt: "2026-11-20T18:00:00.000Z", moves: [{ moveId: "M1", equipmentType: "CRANE" }], twicEscortRequired: false, gangAssignments: GANG })
    );
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    const r = db.tables.Reservations.get("R1");
    assert.equal(r.status, "CONFIRMED");
    assert.equal(r.modifiedByTerminal, true);
    assert.equal(r.startAt, "2026-11-20T18:00:00.000Z");
    assert.equal(r.endAt, "2026-11-20T19:30:00.000Z");
    assert.equal(r.durationMins, 90);
    const move = db.tables.ReservationMoves.get("M1");
    assert.equal(move.equipmentType, "CRANE");
    assert.equal(move.durationMins, 90);
    const [event] = events(db);
    assert.equal(event.type, "MODIFIED");
    assert.equal(event.data.before.startAt, "2026-11-20T14:00:00.000Z");
    assert.equal(event.data.after.startAt, "2026-11-20T18:00:00.000Z");
    const unit = db.tables.CargoUnits.get("CU-1");
    assert.equal(unit.reservationStatus, LEGACY_CONFIRMED_STATUS);
    assert.equal(unit.reservationTime, "01:00 PM");
  });

  test("lets the TO override the duration (forklift in 30 minutes instead of 60)", async () => {
    const { db, routes } = setup();
    const res = await routes.modifyReservation(
      post({ reservationId: "R1", startAt: "2026-11-20T14:00:00.000Z", moves: [{ moveId: "M1", equipmentType: "FORKLIFT", durationMins: 30 }], twicEscortRequired: false, gangAssignments: GANG })
    );
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    const r = db.tables.Reservations.get("R1");
    assert.equal(r.durationMins, 30);
    assert.equal(r.endAt, "2026-11-20T14:30:00.000Z");
    assert.equal(db.tables.ReservationMoves.get("M1").durationMins, 30);
    assert.equal(events(db)[0].data.after.moves[0].durationMins, 30);
  });

  test("rejects invalid durations and a missing gang", async () => {
    const cases = [
      { moves: [{ moveId: "M1", equipmentType: "FORKLIFT", durationMins: 0 }] },
      { moves: [{ moveId: "M1", equipmentType: "FORKLIFT", durationMins: 1441 }] },
      { moves: [{ moveId: "M1", equipmentType: "FORKLIFT", durationMins: 12.5 }] },
      { moves: [{ moveId: "M1", equipmentType: "FORKLIFT", durationMins: 30 }], gangAssignments: [] },
    ];
    for (const extra of cases) {
      const { db, routes } = setup();
      const res = await routes.modifyReservation(post({ reservationId: "R1", startAt: "2026-11-20T14:00:00.000Z", twicEscortRequired: false, gangAssignments: GANG, ...extra }));
      assert.equal(res.statusCode, 400, JSON.stringify(extra));
      assert.equal(db.tables.Reservations.get("R1").status, "REQUESTED");
    }
  });

  test("rejects no-op changes, past times, unknown equipment and foreign moves", async () => {
    const cases = [
      [{ startAt: "2026-11-20T14:00:00.000Z", moves: [] }, 400],
      [{ startAt: "2026-11-17T14:00:00.000Z", moves: [] }, 400],
      [{ startAt: "2026-11-20T18:00:00.000Z", moves: [{ moveId: "M1", equipmentType: "ROCKET" }] }, 400],
      [{ startAt: "2026-11-20T18:00:00.000Z", moves: [{ moveId: "OTHER", equipmentType: "CRANE" }] }, 400],
    ];
    for (const [body, status] of cases) {
      const { db, routes } = setup();
      const res = await routes.modifyReservation(post({ reservationId: "R1", twicEscortRequired: false, gangAssignments: GANG, ...body }));
      assert.equal(res.statusCode, status, JSON.stringify(body));
      assert.equal(db.tables.Reservations.get("R1").status, "REQUESTED");
    }
  });
});

describe("denyReservation", () => {
  test("marks DENIED with the reason, keeps history and returns the cargo to the TC", async () => {
    const { db, routes } = setup();
    const res = await routes.denyReservation(post({ reservationId: "R1", reason: "  Crane out of service  " }));
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    const r = db.tables.Reservations.get("R1");
    assert.equal(r.status, "DENIED");
    assert.equal(r.deniedReason, "Crane out of service");
    assert.equal(db.tables.ReservationMoves.get("M1").status, "DENIED");
    assert.deepEqual(events(db).map((e) => [e.type, e.data.reason]), [["DENIED", "Crane out of service"]]);
    const unit = db.tables.CargoUnits.get("CU-1");
    assert.equal(unit.reservationStatus, ACCEPTED_STATUS);
    assert.equal(unit.reservationId, undefined);
    assert.equal(unit.reservationDate, undefined);
    assert.equal(unit.transopEmail, "tc@example.com", "the TC keeps the cargo");
  });

  test("requires a reason", async () => {
    const { routes } = setup();
    assert.equal((await routes.denyReservation(post({ reservationId: "R1", reason: "   " }))).statusCode, 400);
    assert.equal((await routes.denyReservation(post({ reservationId: "R1", reason: "x".repeat(501) }))).statusCode, 400);
  });
});

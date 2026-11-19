// I-4: Terminal review of requested reservations (accept, modify, deny).
//
// Routes (wired in index.mjs):
//   GET  /listReservationRequests   REQUESTED reservations for the caller's terminals
//   POST /acceptReservation         { reservationId, twicEscortRequired }
//   POST /modifyReservation         { reservationId, startAt, moves: [{ moveId, equipmentType }], twicEscortRequired }
//   POST /denyReservation           { reservationId, reason }
//
// Only Terminal Operators linked to the reservation's terminal (Cognito "custom:terminalId") may act.
// Every action writes exactly one ReservationEvents row and never deletes history.

import { v4 as uuidv4 } from "uuid";
import { GetCommand, QueryCommand, ScanCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import {
  authenticate,
  HttpError,
  legacyDateTime,
  isUsableEquipment,
  toEquipmentOption,
  ACCEPTED_STATUS,
  LEGACY_REQUESTED_STATUS,
  PAST_TOLERANCE_MS,
  RESERVATIONS_TABLE,
  RESERVATION_EVENTS_TABLE,
  RESERVATION_MOVES_TABLE,
  CARGO_UNITS_TABLE,
  TERMINAL_RESOURCES_TABLE,
} from "./reservation-request.mjs";

export const TERMINAL_OPERATOR_ROLE = "Terminal Operator";
// Old CargoUnits.reservationStatus once the terminal approves (bridge until I-8 and I-10).
export const LEGACY_CONFIRMED_STATUS = "Pending Pick Up";

const RESERVATION_MOVES_GSI = process.env.RESERVATION_MOVES_GSI || "GSI_reservationId";
const TERMINAL_TIME_ZONE = process.env.TERMINAL_TIME_ZONE || "America/New_York";
const MAX_REASON_LENGTH = 500;

// "11/18/2026", matching the old resApprovalDate written by toLocaleDateString("en-US").
export function legacyApprovalDate(date, timeZone = TERMINAL_TIME_ZONE) {
  return new Intl.DateTimeFormat("en-US", { timeZone, month: "numeric", day: "numeric", year: "numeric" }).format(date);
}

function parseBody(event) {
  try {
    return typeof event.body === "string" ? JSON.parse(event.body || "{}") : event.body || {};
  } catch {
    throw new HttpError(400, "The request body isn't valid JSON.");
  }
}

function requireTerminalOperator(user) {
  if (user.role !== TERMINAL_OPERATOR_ROLE) {
    throw new HttpError(403, "Only Terminal Operators can review reservations.");
  }
  if (user.terminalIds.length === 0) {
    throw new HttpError(403, "Your account isn't linked to a terminal.");
  }
}

export function createReservationReviewRoutes({ db, response, verify, now = () => new Date() }) {
  async function run(fn) {
    try {
      const { statusCode, body } = await fn();
      return response(statusCode, body);
    } catch (err) {
      if (err instanceof HttpError) return response(err.statusCode, { message: err.message });
      if (err?.name === "TransactionCanceledException") {
        return response(409, { message: "This reservation was just changed by someone else. Refresh and try again." });
      }
      throw err;
    }
  }

  async function authenticateOperator(event) {
    const user = await authenticate(event, verify);
    requireTerminalOperator(user);
    return user;
  }

  async function loadReservationForReview(user, reservationId) {
    if (!reservationId) throw new HttpError(400, "A reservationId is required.");
    const { Item: reservation } = await db.send(
      new GetCommand({ TableName: RESERVATIONS_TABLE, Key: { reservationId } })
    );
    if (!reservation || !user.terminalIds.includes(reservation.terminalId)) {
      // Same answer for "missing" and "another terminal's", so IDs can't be probed.
      throw new HttpError(404, "Reservation not found.");
    }
    if (reservation.status !== "REQUESTED") {
      throw new HttpError(409, `This reservation is already ${String(reservation.status).toLowerCase()}.`);
    }
    return reservation;
  }

  async function loadMoves(reservationId) {
    const moves = [];
    let ExclusiveStartKey;
    do {
      const page = await db.send(
        new QueryCommand({
          TableName: RESERVATION_MOVES_TABLE,
          IndexName: RESERVATION_MOVES_GSI,
          KeyConditionExpression: "reservationId = :r",
          ExpressionAttributeValues: { ":r": reservationId },
          ExclusiveStartKey,
        })
      );
      moves.push(...(page.Items || []));
      ExclusiveStartKey = page.LastEvaluatedKey;
    } while (ExclusiveStartKey);
    return moves.sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
  }

  async function getCargoUnit(cargoUnitID) {
    const { Item } = await db.send(new GetCommand({ TableName: CARGO_UNITS_TABLE, Key: { cargoUnitID } }));
    return Item;
  }

  async function getEquipmentType(terminalId, equipmentType) {
    const { Item } = await db.send(
      new GetCommand({ TableName: TERMINAL_RESOURCES_TABLE, Key: { terminalId, sk: `EQTYPE#${equipmentType}` } })
    );
    return isUsableEquipment(Item?.record) ? toEquipmentOption(Item.record) : null;
  }

  async function equipmentLabels(terminalId) {
    const labels = {};
    let ExclusiveStartKey;
    do {
      const page = await db.send(
        new QueryCommand({
          TableName: TERMINAL_RESOURCES_TABLE,
          KeyConditionExpression: "terminalId = :t AND begins_with(sk, :p)",
          ExpressionAttributeValues: { ":t": terminalId, ":p": "EQTYPE#" },
          ExclusiveStartKey,
        })
      );
      for (const item of page.Items || []) {
        if (item.record?.equipmentType) labels[item.record.equipmentType] = item.record.label || item.record.equipmentType;
      }
      ExclusiveStartKey = page.LastEvaluatedKey;
    } while (ExclusiveStartKey);
    return labels;
  }

  // Bridge: keep the old CargoUnits fields in step so today's Ongoing tabs still work.
  function cargoUnitBridgeUpdate(cargoUnitID, reservationId, set, remove = []) {
    const values = { ":legacyRequested": LEGACY_REQUESTED_STATUS, ":rid": reservationId };
    const assignments = Object.entries(set).map(([field, value], i) => {
      values[`:v${i}`] = value;
      return `${field} = :v${i}`;
    });
    return {
      Update: {
        TableName: CARGO_UNITS_TABLE,
        Key: { cargoUnitID },
        UpdateExpression: `SET ${assignments.join(", ")}${remove.length ? ` REMOVE ${remove.join(", ")}` : ""}`,
        ConditionExpression: "reservationStatus = :legacyRequested AND reservationId = :rid",
        ExpressionAttributeValues: values,
      },
    };
  }

  // The one place a reservation becomes CONFIRMED (Accept and Modify both use it).
  // C-5 and C-7 extend this to book and assign terminal resources in the same transaction.
  function confirm({ reservation, moves, user, nowIso, twicEscortRequired, event, changes = null }) {
    const reservationValues = {
      ":confirmed": "CONFIRMED",
      ":requested": "REQUESTED",
      ":twic": twicEscortRequired,
      ":now": nowIso,
      ":by": user.email,
    };
    let reservationSet =
      "#s = :confirmed, twicEscortRequired = :twic, confirmedAt = :now, confirmedBy = :by, updatedAt = :now";
    if (changes) {
      reservationSet += ", startAt = :startAt, endAt = :endAt, durationMins = :duration, modifiedByTerminal = :modified";
      Object.assign(reservationValues, {
        ":startAt": changes.startAt,
        ":endAt": changes.endAt,
        ":duration": changes.durationMins,
        ":modified": true,
      });
    }

    const items = [
      {
        Update: {
          TableName: RESERVATIONS_TABLE,
          Key: { reservationId: reservation.reservationId },
          UpdateExpression: `SET ${reservationSet}`,
          ConditionExpression: "#s = :requested",
          ExpressionAttributeNames: { "#s": "status" },
          ExpressionAttributeValues: reservationValues,
        },
      },
    ];

    for (const move of moves) {
      const changed = changes?.moves.find((m) => m.moveId === move.moveId);
      const values = { ":confirmed": "CONFIRMED", ":now": nowIso, ":rid": reservation.reservationId };
      let set = "#s = :confirmed, updatedAt = :now";
      if (changed) {
        set += ", equipmentType = :eq, durationMins = :mins";
        values[":eq"] = changed.equipmentType;
        values[":mins"] = changed.durationMins;
      }
      items.push({
        Update: {
          TableName: RESERVATION_MOVES_TABLE,
          Key: { moveId: move.moveId },
          UpdateExpression: `SET ${set}`,
          ConditionExpression: "reservationId = :rid",
          ExpressionAttributeNames: { "#s": "status" },
          ExpressionAttributeValues: values,
        },
      });
    }

    items.push({ Put: { TableName: RESERVATION_EVENTS_TABLE, Item: event } });

    const legacyFields = {
      reservationStatus: LEGACY_CONFIRMED_STATUS,
      resApprovalDate: legacyApprovalDate(new Date(nowIso)),
      twicEscortRequired,
      isTerminalNotify: false,
      isBCONotify: true,
      isTransportationNotify: true,
      updatedAt: nowIso,
    };
    if (changes) Object.assign(legacyFields, legacyDateTime(new Date(changes.startAt)));
    for (const move of moves) {
      items.push(cargoUnitBridgeUpdate(move.cargoUnitID, reservation.reservationId, legacyFields));
    }
    return items;
  }

  function newEvent(reservationId, type, user, nowIso, data) {
    return { eventId: uuidv4(), reservationId, type, actorEmail: user.email, createdAt: nowIso, data };
  }

  function requireTwicAnswer(body) {
    if (typeof body.twicEscortRequired !== "boolean") {
      throw new HttpError(400, "Answer whether a TWIC escort is required.");
    }
    return body.twicEscortRequired;
  }

  async function listReservationRequests(event) {
    return run(async () => {
      const user = await authenticateOperator(event);

      const terminalValues = {};
      user.terminalIds.forEach((id, i) => (terminalValues[`:t${i}`] = id));
      const reservations = [];
      let ExclusiveStartKey;
      do {
        const page = await db.send(
          new ScanCommand({
            TableName: RESERVATIONS_TABLE,
            FilterExpression: `#s = :requested AND terminalId IN (${Object.keys(terminalValues).join(", ")})`,
            ExpressionAttributeNames: { "#s": "status" },
            ExpressionAttributeValues: { ":requested": "REQUESTED", ...terminalValues },
            ExclusiveStartKey,
          })
        );
        reservations.push(...(page.Items || []));
        ExclusiveStartKey = page.LastEvaluatedKey;
      } while (ExclusiveStartKey);

      const labelsByTerminal = {};
      await Promise.all(
        [...new Set(reservations.map((r) => r.terminalId))].map(async (t) => {
          labelsByTerminal[t] = await equipmentLabels(t);
        })
      );

      const items = await Promise.all(
        reservations.map(async (reservation) => {
          const moves = await loadMoves(reservation.reservationId);
          const detailed = await Promise.all(
            moves.map(async (move) => {
              const unit = (await getCargoUnit(move.cargoUnitID)) || {};
              return {
                moveId: move.moveId,
                sequence: move.sequence,
                cargoUnitID: move.cargoUnitID,
                moveType: move.moveType,
                equipmentType: move.equipmentType,
                equipmentLabel: labelsByTerminal[reservation.terminalId]?.[move.equipmentType] || move.equipmentType,
                durationMins: Number(move.durationMins),
                vesselID: unit.vesselID,
                origin: unit.origin,
                bcoName: unit.bcoName,
                bcoEmail: unit.bcoEmail,
                transopName: unit.transopName,
                transopEmail: unit.transopEmail,
              };
            })
          );
          return {
            reservationId: reservation.reservationId,
            confirmationCode: reservation.confirmationCode,
            status: reservation.status,
            terminalId: reservation.terminalId,
            preferredStartAt: reservation.preferredStartAt,
            startAt: reservation.startAt,
            endAt: reservation.endAt,
            durationMins: Number(reservation.durationMins),
            requestingUserEmail: reservation.requestingUserEmail,
            requestingUserName: reservation.requestingUserName,
            createdAt: reservation.createdAt,
            moves: detailed,
          };
        })
      );

      items.sort((a, b) => String(a.startAt).localeCompare(String(b.startAt)));
      return { statusCode: 200, body: { items, count: items.length } };
    });
  }

  async function acceptReservation(event) {
    return run(async () => {
      const user = await authenticateOperator(event);
      const body = parseBody(event);
      const twicEscortRequired = requireTwicAnswer(body);
      const reservation = await loadReservationForReview(user, body.reservationId);
      const moves = await loadMoves(reservation.reservationId);
      const nowIso = now().toISOString();

      const confirmedEvent = newEvent(reservation.reservationId, "CONFIRMED", user, nowIso, {
        status: "CONFIRMED",
        twicEscortRequired,
      });
      await db.send(
        new TransactWriteCommand({
          TransactItems: confirm({ reservation, moves, user, nowIso, twicEscortRequired, event: confirmedEvent }),
        })
      );
      return {
        statusCode: 200,
        body: { reservationId: reservation.reservationId, status: "CONFIRMED", startAt: reservation.startAt, endAt: reservation.endAt },
      };
    });
  }

  async function modifyReservation(event) {
    return run(async () => {
      const user = await authenticateOperator(event);
      const body = parseBody(event);
      const twicEscortRequired = requireTwicAnswer(body);
      const reservation = await loadReservationForReview(user, body.reservationId);
      const moves = await loadMoves(reservation.reservationId);

      const start = new Date(body.startAt);
      if (!body.startAt || Number.isNaN(start.getTime())) throw new HttpError(400, "A new date and time is required.");
      if (start.getTime() < now().getTime() - PAST_TOLERANCE_MS) throw new HttpError(400, "The new time is in the past.");

      const requested = Array.isArray(body.moves) ? body.moves : [];
      for (const m of requested) {
        if (!moves.some((move) => move.moveId === m?.moveId)) {
          throw new HttpError(400, "A move in the request doesn't belong to this reservation.");
        }
      }

      // Durations always come from the terminal's equipment types.
      const after = await Promise.all(
        moves.map(async (move) => {
          const equipmentType = requested.find((m) => m.moveId === move.moveId)?.equipmentType || move.equipmentType;
          const eq = await getEquipmentType(reservation.terminalId, equipmentType);
          if (!eq) {
            throw new HttpError(400, `Equipment type ${equipmentType} isn't available at terminal ${reservation.terminalId}.`);
          }
          return { moveId: move.moveId, cargoUnitID: move.cargoUnitID, equipmentType, durationMins: eq.defaultDurationMins };
        })
      );
      const durationMins = after.reduce((sum, m) => sum + m.durationMins, 0);
      const startAt = start.toISOString();
      const endAt = new Date(start.getTime() + durationMins * 60 * 1000).toISOString();

      const before = {
        startAt: reservation.startAt,
        endAt: reservation.endAt,
        durationMins: Number(reservation.durationMins),
        moves: moves.map((m) => ({ moveId: m.moveId, cargoUnitID: m.cargoUnitID, equipmentType: m.equipmentType, durationMins: Number(m.durationMins) })),
      };
      const unchanged =
        before.startAt === startAt && after.every((m, i) => m.equipmentType === before.moves[i].equipmentType);
      if (unchanged) throw new HttpError(400, "Nothing was changed. Use Accept to confirm the request as it is.");

      const nowIso = now().toISOString();
      const modifiedEvent = newEvent(reservation.reservationId, "MODIFIED", user, nowIso, {
        status: "CONFIRMED",
        twicEscortRequired,
        before,
        after: { startAt, endAt, durationMins, moves: after },
      });
      await db.send(
        new TransactWriteCommand({
          TransactItems: confirm({
            reservation,
            moves,
            user,
            nowIso,
            twicEscortRequired,
            event: modifiedEvent,
            changes: { startAt, endAt, durationMins, moves: after },
          }),
        })
      );
      return {
        statusCode: 200,
        body: { reservationId: reservation.reservationId, status: "CONFIRMED", modifiedByTerminal: true, startAt, endAt, durationMins },
      };
    });
  }

  async function denyReservation(event) {
    return run(async () => {
      const user = await authenticateOperator(event);
      const body = parseBody(event);
      const reason = String(body.reason || "").trim();
      if (!reason) throw new HttpError(400, "A reason is required to deny a request.");
      if (reason.length > MAX_REASON_LENGTH) {
        throw new HttpError(400, `The reason can be at most ${MAX_REASON_LENGTH} characters.`);
      }
      const reservation = await loadReservationForReview(user, body.reservationId);
      const moves = await loadMoves(reservation.reservationId);
      const nowIso = now().toISOString();

      const items = [
        {
          Update: {
            TableName: RESERVATIONS_TABLE,
            Key: { reservationId: reservation.reservationId },
            UpdateExpression: "SET #s = :denied, deniedReason = :reason, deniedAt = :now, deniedBy = :by, updatedAt = :now",
            ConditionExpression: "#s = :requested",
            ExpressionAttributeNames: { "#s": "status" },
            ExpressionAttributeValues: { ":denied": "DENIED", ":requested": "REQUESTED", ":reason": reason, ":now": nowIso, ":by": user.email },
          },
        },
        ...moves.map((move) => ({
          Update: {
            TableName: RESERVATION_MOVES_TABLE,
            Key: { moveId: move.moveId },
            UpdateExpression: "SET #s = :denied, updatedAt = :now",
            ConditionExpression: "reservationId = :rid",
            ExpressionAttributeNames: { "#s": "status" },
            ExpressionAttributeValues: { ":denied": "DENIED", ":now": nowIso, ":rid": reservation.reservationId },
          },
        })),
        { Put: { TableName: RESERVATION_EVENTS_TABLE, Item: newEvent(reservation.reservationId, "DENIED", user, nowIso, { status: "DENIED", reason }) } },
        // The cargo goes back to the TC, who can request another time.
        ...moves.map((move) =>
          cargoUnitBridgeUpdate(
            move.cargoUnitID,
            reservation.reservationId,
            { reservationStatus: ACCEPTED_STATUS, isTerminalNotify: false, isBCONotify: false, isTransportationNotify: true, updatedAt: nowIso },
            ["reservationDate", "reservationTime", "reservationId"]
          )
        ),
      ];
      await db.send(new TransactWriteCommand({ TransactItems: items }));
      return { statusCode: 200, body: { reservationId: reservation.reservationId, status: "DENIED", reason } };
    });
  }

  return { listReservationRequests, acceptReservation, modifyReservation, denyReservation };
}

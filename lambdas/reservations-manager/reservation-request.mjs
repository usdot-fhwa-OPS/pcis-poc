// I-3: Create import reservation request.
//
// Routes (wired in index.mjs):
//   GET /listEquipmentTypes?cargoUnitID=...|terminalId=...
//   PUT /createReservationRequest
//
// Both routes verify the caller's Cognito ID token (sent as "Authorization: Bearer <idToken>").
// The requester's email, name and role always come from the verified token, never from the body.

import { randomBytes } from "crypto";
import { v4 as uuidv4 } from "uuid";
import { GetCommand, QueryCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { CognitoJwtVerifier } from "aws-jwt-verify";

export const RESERVATIONS_TABLE = process.env.RESERVATIONS_TABLE || "Reservations";
export const RESERVATION_EVENTS_TABLE = process.env.RESERVATION_EVENTS_TABLE || "ReservationEvents";
export const RESERVATION_MOVES_TABLE = process.env.RESERVATION_MOVES || "ReservationMoves";
export const CARGO_UNITS_TABLE = process.env.CARGO_UNITS_TABLE || "CargoUnits";
export const TERMINAL_RESOURCES_TABLE = process.env.TERMINAL_RESOURCES_TABLE || "TerminalResources";

const USER_POOL_ID = process.env.USER_POOL_ID || "us-east-1_ODcx7VXFP";
const USER_POOL_CLIENT_IDS = (
  process.env.USER_POOL_CLIENT_IDS || "3i3rr3m2vs2hn4ovq1b7rl8oa6,10gcf48k488jolhk4hs9ic5q9c"
)
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

// The old screens show reservation dates and times in the terminal's local time.
const TERMINAL_TIME_ZONE = process.env.TERMINAL_TIME_ZONE || "America/New_York";

// Roles that act as a Transportation Coordinator (the "custom:role" values in Cognito).
export const TC_ROLES = ["Trucking Operator", "Rail Operator", "Third Party Logistics Provider"];

// Old CargoUnits.reservationStatus values (bridge until I-4 and I-10 move the screens to the new tables).
export const ACCEPTED_STATUS = "Pending Reservation";
export const LEGACY_REQUESTED_STATUS = "Pending Reservation Approval";

const MAX_MOVES = 10;
// Allow a little clock skew between the browser and the server.
export const PAST_TOLERANCE_MS = 5 * 60 * 1000;

export class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

let cachedVerifier;
function defaultVerify(token) {
  if (!cachedVerifier) {
    cachedVerifier = CognitoJwtVerifier.create({
      userPoolId: USER_POOL_ID,
      tokenUse: "id",
      clientId: USER_POOL_CLIENT_IDS,
    });
  }
  return cachedVerifier.verify(token);
}

export async function authenticate(event, verify = defaultVerify) {
  const header = event?.headers?.Authorization || event?.headers?.authorization;
  if (!header) throw new HttpError(401, "Sign in to continue.");
  const token = header.replace(/^Bearer\s+/i, "").trim();
  let claims;
  try {
    claims = await verify(token);
  } catch {
    throw new HttpError(401, "Your session has expired. Sign in again.");
  }
  if (!claims?.email) throw new HttpError(401, "Your sign-in is missing an email address.");
  return {
    email: String(claims.email).toLowerCase(),
    role: String(claims["custom:role"] || ""),
    name: [claims.given_name, claims.family_name].filter(Boolean).join(" "),
    terminalIds: String(claims["custom:terminalId"] || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  };
}

export function isTransportationCoordinator(role) {
  return TC_ROLES.includes(role);
}

export function hasActiveHolds(holds) {
  if (!holds) return false;
  if (Array.isArray(holds)) return holds.some(Boolean);
  if (typeof holds === "object") return Object.values(holds).some(Boolean);
  return Boolean(holds);
}

export function isReleased(unit) {
  return Boolean(unit.containerStatus) && unit.containerStatus !== "On-Ship";
}

export function generateConfirmationCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const part = () => {
    const bytes = randomBytes(4);
    let out = "";
    for (let i = 0; i < 4; i++) out += chars[bytes[i] % chars.length];
    return out;
  };
  return `PCIS-${part()}-${part()}`;
}

// "04/24/2026" and "12:00 PM" in the terminal's time zone, matching the old reservationDate/reservationTime fields.
export function legacyDateTime(date, timeZone = TERMINAL_TIME_ZONE) {
  const reservationDate = new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).format(date);
  const reservationTime = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
  return { reservationDate, reservationTime };
}

export function sameEmail(a, b) {
  return Boolean(a) && Boolean(b) && String(a).toLowerCase() === String(b).toLowerCase();
}

export function toEquipmentOption(record) {
  return {
    equipmentType: record.equipmentType,
    label: record.label || record.equipmentType,
    defaultDurationMins: Number(record.defaultDurationMins),
    gangsRequired: Number(record.gangsRequired ?? 0),
  };
}

export function isUsableEquipment(record) {
  return (
    record &&
    record.active !== false &&
    record.equipmentType &&
    Number.isFinite(Number(record.defaultDurationMins)) &&
    Number(record.defaultDurationMins) > 0
  );
}

export function createReservationRequestRoutes({ db, response, verify = defaultVerify, now = () => new Date() }) {
  async function getCargoUnit(cargoUnitID) {
    const result = await db.send(new GetCommand({ TableName: CARGO_UNITS_TABLE, Key: { cargoUnitID } }));
    return result.Item;
  }

  async function getEquipmentType(terminalId, equipmentType) {
    const result = await db.send(
      new GetCommand({
        TableName: TERMINAL_RESOURCES_TABLE,
        Key: { terminalId, sk: `EQTYPE#${equipmentType}` },
      })
    );
    const record = result.Item?.record;
    return isUsableEquipment(record) ? toEquipmentOption(record) : null;
  }

  async function queryEquipmentTypes(terminalId) {
    const items = [];
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
      items.push(...(page.Items || []));
      ExclusiveStartKey = page.LastEvaluatedKey;
    } while (ExclusiveStartKey);
    return items
      .map((item) => item.record)
      .filter(isUsableEquipment)
      .map(toEquipmentOption)
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  async function run(fn) {
    try {
      const { statusCode, body } = await fn();
      return response(statusCode, body);
    } catch (err) {
      if (err instanceof HttpError) return response(err.statusCode, { message: err.message });
      throw err;
    }
  }

  async function listEquipmentTypes(event) {
    return run(async () => {
      const user = await authenticate(event, verify);
      const params = event.queryStringParameters || {};
      let terminalId = params.terminalId;

      if (params.cargoUnitID) {
        const unit = await getCargoUnit(params.cargoUnitID);
        if (!unit) throw new HttpError(404, `Cargo unit ${params.cargoUnitID} wasn't found.`);
        if (isTransportationCoordinator(user.role) && !sameEmail(unit.transopEmail, user.email)) {
          throw new HttpError(403, `Cargo unit ${params.cargoUnitID} isn't assigned to you.`);
        }
        if (!unit.terminalID) {
          throw new HttpError(422, `Cargo unit ${params.cargoUnitID} has no terminal, so equipment can't be listed.`);
        }
        terminalId = unit.terminalID;
      }

      if (!terminalId) throw new HttpError(400, "A cargoUnitID or terminalId is required.");

      const items = await queryEquipmentTypes(terminalId);
      return { statusCode: 200, body: { terminalId, items } };
    });
  }

  async function createReservationRequest(event) {
    return run(async () => {
      const user = await authenticate(event, verify);
      if (!isTransportationCoordinator(user.role)) {
        throw new HttpError(403, "Only Transportation Coordinators can request reservations.");
      }

      let body;
      try {
        body = typeof event.body === "string" ? JSON.parse(event.body || "{}") : event.body || {};
      } catch {
        throw new HttpError(400, "The request body isn't valid JSON.");
      }

      const preferredStart = new Date(body.preferredStartAt);
      if (!body.preferredStartAt || Number.isNaN(preferredStart.getTime())) {
        throw new HttpError(400, "A requested date and time is required.");
      }
      if (preferredStart.getTime() < now().getTime() - PAST_TOLERANCE_MS) {
        throw new HttpError(400, "The requested time is in the past.");
      }

      const requestedMoves = Array.isArray(body.moves) ? body.moves : [];
      if (requestedMoves.length === 0) throw new HttpError(400, "At least one cargo unit is required.");
      if (requestedMoves.length > MAX_MOVES) {
        throw new HttpError(400, `A visit can include at most ${MAX_MOVES} cargo units.`);
      }
      for (const move of requestedMoves) {
        if (!move?.cargoUnitID || !move?.equipmentType) {
          throw new HttpError(400, "Each cargo unit needs a cargoUnitID and an equipmentType.");
        }
      }
      const ids = requestedMoves.map((m) => m.cargoUnitID);
      if (new Set(ids).size !== ids.length) {
        throw new HttpError(400, "A cargo unit can only appear once in a visit.");
      }

      const units = await Promise.all(ids.map(getCargoUnit));
      units.forEach((unit, i) => {
        const id = ids[i];
        if (!unit) throw new HttpError(404, `Cargo unit ${id} wasn't found.`);
        if (!sameEmail(unit.transopEmail, user.email)) {
          throw new HttpError(403, `Cargo unit ${id} isn't assigned to you.`);
        }
        if (unit.reservationStatus !== ACCEPTED_STATUS) {
          throw new HttpError(409, `Cargo unit ${id} can't be reserved (status: ${unit.reservationStatus || "none"}).`);
        }
        if (!isReleased(unit)) throw new HttpError(422, `Cargo unit ${id} is still on the ship.`);
        if (hasActiveHolds(unit.holds)) throw new HttpError(422, `Cargo unit ${id} has a hold.`);
        if (!unit.terminalID) throw new HttpError(422, `Cargo unit ${id} has no terminal.`);
      });

      const terminalId = units[0].terminalID;
      if (units.some((u) => u.terminalID !== terminalId)) {
        throw new HttpError(400, "All cargo units in a visit must be at the same terminal.");
      }
      if (body.terminalId && body.terminalId !== terminalId) {
        throw new HttpError(400, "The terminal doesn't match the cargo units.");
      }

      // Durations always come from the terminal's equipment types, never from the client.
      const equipment = await Promise.all(
        requestedMoves.map((m) => getEquipmentType(terminalId, m.equipmentType))
      );
      equipment.forEach((eq, i) => {
        if (!eq) {
          throw new HttpError(
            400,
            `Equipment type ${requestedMoves[i].equipmentType} isn't available at terminal ${terminalId}.`
          );
        }
      });

      const durationMins = equipment.reduce((sum, eq) => sum + eq.defaultDurationMins, 0);
      const startAt = preferredStart.toISOString();
      const endAt = new Date(preferredStart.getTime() + durationMins * 60 * 1000).toISOString();
      const nowIso = now().toISOString();
      const reservationId = uuidv4();
      const confirmationCode = generateConfirmationCode();
      const cargoOwnerEmails = [...new Set(units.map((u) => u.bcoEmail).filter(Boolean))];

      const reservation = {
        reservationId,
        confirmationCode,
        status: "REQUESTED",
        terminalId,
        preferredStartAt: startAt,
        startAt,
        endAt,
        durationMins,
        requestingUserEmail: user.email,
        requestingUserName: user.name || undefined,
        // The TC drives the truck, so the executing user is the requester.
        executingUserEmail: user.email,
        cargoOwnerEmails,
        modifiedByTerminal: false,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      const moves = requestedMoves.map((m, i) => ({
        moveId: uuidv4(),
        reservationId,
        cargoUnitID: m.cargoUnitID,
        direction: "IMPORT",
        moveType: "PICKUP",
        equipmentType: equipment[i].equipmentType,
        durationMins: equipment[i].defaultDurationMins,
        sequence: i + 1,
        status: "REQUESTED",
        createdAt: nowIso,
        updatedAt: nowIso,
      }));

      const createdEvent = {
        eventId: uuidv4(),
        reservationId,
        type: "CREATED",
        actorEmail: user.email,
        createdAt: nowIso,
        data: {
          status: "REQUESTED",
          preferredStartAt: startAt,
          moves: moves.map(({ cargoUnitID, equipmentType, durationMins: mins, sequence }) => ({
            cargoUnitID,
            equipmentType,
            durationMins: mins,
            sequence,
          })),
        },
      };

      // Bridge: keep the old CargoUnits status fields in step so today's TO and TC screens still work.
      // Remove once I-4 and I-10 read from the reservation tables.
      const { reservationDate, reservationTime } = legacyDateTime(preferredStart);
      const cargoUnitUpdates = units.map((unit) => ({
        Update: {
          TableName: CARGO_UNITS_TABLE,
          Key: { cargoUnitID: unit.cargoUnitID },
          UpdateExpression:
            "SET reservationStatus = :requested, reservationDate = :d, reservationTime = :t, " +
            "reservationId = :rid, isTerminalNotify = :yes, isBCONotify = :yes, " +
            "isTransportationNotify = :no, updatedAt = :now",
          ConditionExpression: "reservationStatus = :accepted AND transopEmail = :tc",
          ExpressionAttributeValues: {
            ":requested": LEGACY_REQUESTED_STATUS,
            ":accepted": ACCEPTED_STATUS,
            ":tc": unit.transopEmail,
            ":d": reservationDate,
            ":t": reservationTime,
            ":rid": reservationId,
            ":yes": true,
            ":no": false,
            ":now": nowIso,
          },
        },
      }));

      try {
        await db.send(
          new TransactWriteCommand({
            TransactItems: [
              {
                Put: {
                  TableName: RESERVATIONS_TABLE,
                  Item: reservation,
                  ConditionExpression: "attribute_not_exists(reservationId)",
                },
              },
              ...moves.map((Item) => ({ Put: { TableName: RESERVATION_MOVES_TABLE, Item } })),
              { Put: { TableName: RESERVATION_EVENTS_TABLE, Item: createdEvent } },
              ...cargoUnitUpdates,
            ],
          })
        );
      } catch (err) {
        if (err?.name === "TransactionCanceledException") {
          throw new HttpError(409, "This cargo unit was just reserved or changed. Refresh and try again.");
        }
        throw err;
      }

      return {
        statusCode: 201,
        body: { reservationId, confirmationCode, status: "REQUESTED", terminalId, startAt, endAt, durationMins },
      };
    });
  }

  return { listEquipmentTypes, createReservationRequest };
}

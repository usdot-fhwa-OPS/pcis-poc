// G-1: Public reservation status lookup for guests (drivers and the cargo owner's customers).
//
// Route (wired in index.mjs; the API has no authorizer on it):
//   POST /public/track   { code, factor }
//
// The code alone is not enough: the factor must match one of the reservation's moves: its cargo unit ID,
// its booking number (export moves, X-1), or the cargo unit's bill of lading number. Truck plate is not used.
// Every failure returns the same 404, so a caller can't tell a wrong code from a wrong factor.
//
// What a guest sees follows the G-2 mockup (decided 2026-11-19): status, timeline, terminal, pickup window,
// TWIC escort, driver, and per cargo unit the vessel, route, weight, hazard class, location, BCO and TC names.
// It never returns email addresses, gangs, BL or booking numbers, gate passes or vehicles.

import { GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { CognitoIdentityProviderClient, ListUsersCommand } from "@aws-sdk/client-cognito-identity-provider";

const RESERVATIONS_TABLE = process.env.RESERVATIONS_TABLE || "Reservations";
const RESERVATION_EVENTS_TABLE = process.env.RESERVATION_EVENTS_TABLE || "ReservationEvents";
const RESERVATION_MOVES_TABLE = process.env.RESERVATION_MOVES || "ReservationMoves";
const CARGO_UNITS_TABLE = process.env.CARGO_UNITS_TABLE || "CargoUnits";
const BERTH_CONFIG_TABLE = process.env.BERTH_CONFIG_TABLE || "BerthConfig";
const CONFIRMATION_CODE_GSI = process.env.CONFIRMATION_CODE_GSI || "GSI_confirmationCode";
const RESERVATION_EVENTS_GSI = process.env.RESERVATION_EVENTS_GSI || "GSI_reservationId";
const RESERVATION_MOVES_GSI = process.env.RESERVATION_MOVES_GSI || "GSI_reservationId";
const USER_POOL_ID = process.env.USER_POOL_ID || "us-east-1_ODcx7VXFP";

const CODE_PATTERN = /^PCIS-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
const EMAIL_PATTERN = /^[^\s"\\]+@[^\s"\\]+$/;
const MAX_FACTOR_LENGTH = 100;

export const NOT_FOUND = { message: "We couldn't find a reservation matching those details." };

export function normalize(value) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

function parseBody(event) {
  try {
    const body = typeof event.body === "string" ? JSON.parse(event.body || "{}") : event.body || {};
    return body && typeof body === "object" ? body : {};
  } catch {
    return {};
  }
}

// What a move offers as a second factor without another read.
export function moveFactors(move) {
  return [move?.cargoUnitID, move?.bookingNumber].map(normalize).filter(Boolean);
}

// What a cargo unit adds.
export function cargoUnitFactors(cargoUnit) {
  return [cargoUnit?.billOfLading].map(normalize).filter(Boolean);
}

const orNull = (v) => (v === undefined || v === "" ? null : v);

// One cargo unit as the guest sees it. Only fields listed here leave this route.
export function toCargoUnitView(move, unit = {}) {
  return {
    cargoUnitID: move.cargoUnitID,
    equipmentType: orNull(move.equipmentType),
    vessel: orNull(unit.voyageVesselName ?? unit.vesselID),
    origin: orNull(unit.origin),
    destination: orNull(unit.destination),
    weight: orNull(unit.weight),
    weightUnit: orNull(unit.weightUnit),
    hazmatClass: orNull(unit.hazmatClass),
    unNumber: orNull(unit.unNumber),
    containerStatus: orNull(unit.containerStatus),
    location: orNull(unit.yardBlock),
    arrivalDate: orNull(unit.arrivalDate),
    // The old CargoUnits status (e.g. "Pending Pick Up", "Picked Up", "Late for Pick Up") until I-8 moves it.
    pickupStatus: orNull(unit.reservationStatus),
    bcoName: orNull(unit.bcoName),
    transportationCoordinatorName: orNull(unit.transopName),
  };
}

export function toTrackingView({ reservation, moves, cargoUnits, events, terminalConfig, actors }) {
  const sortedMoves = [...moves].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
  const history = [...events]
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
    .map((e) => {
      const actor = actors.get(e.actorEmail) || {};
      return {
        type: e.type,
        status: e.data?.status ?? e.type,
        at: e.createdAt,
        actor: { name: actor.name || null, role: actor.role || null },
      };
    })
    .filter((h) => h.status && h.at);
  return {
    confirmationCode: reservation.confirmationCode,
    status: reservation.status,
    modifiedByTerminal: reservation.modifiedByTerminal === true,
    updatedAt: reservation.updatedAt,
    terminal: {
      id: reservation.terminalId,
      name: terminalConfig?.terminalName || null,
      address: terminalConfig?.address || null,
    },
    window: reservation.status === "CONFIRMED" ? { start: reservation.startAt, end: reservation.endAt } : null,
    requestedStartAt: orNull(reservation.preferredStartAt),
    twicEscortRequired: typeof reservation.twicEscortRequired === "boolean" ? reservation.twicEscortRequired : null,
    // The TC who requested the visit drives it (I-3).
    driver: { name: orNull(reservation.requestingUserName) },
    equipment: [...new Set(sortedMoves.map((m) => m.equipmentType).filter(Boolean))],
    cargoUnits: sortedMoves.map((m) => toCargoUnitView(m, cargoUnits.get(m.cargoUnitID))),
    history,
  };
}

// Looks up a person's name and role in Cognito by email. Returns {} when unknown or on any error.
export function cognitoUserLookup(client = new CognitoIdentityProviderClient({})) {
  return async (email) => {
    if (!email || !EMAIL_PATTERN.test(email)) return {};
    try {
      const { Users = [] } = await client.send(
        new ListUsersCommand({ UserPoolId: USER_POOL_ID, Filter: `email = "${email}"`, Limit: 1 })
      );
      const attrs = Object.fromEntries((Users[0]?.Attributes || []).map((a) => [a.Name, a.Value]));
      return {
        name: [attrs.given_name, attrs.family_name].filter(Boolean).join(" ") || null,
        role: attrs["custom:role"] || null,
      };
    } catch (err) {
      console.error("public track user lookup failed:", err?.name);
      return {};
    }
  };
}

export function createReservationTrackingRoutes({ db, response, lookupUser = cognitoUserLookup() }) {
  async function queryAll(input) {
    const items = [];
    let ExclusiveStartKey;
    do {
      const page = await db.send(new QueryCommand({ ...input, ExclusiveStartKey }));
      items.push(...(page.Items || []));
      ExclusiveStartKey = page.LastEvaluatedKey;
    } while (ExclusiveStartKey);
    return items;
  }

  const byReservation = (TableName, IndexName, reservationId) =>
    queryAll({ TableName, IndexName, KeyConditionExpression: "reservationId = :r", ExpressionAttributeValues: { ":r": reservationId } });

  async function getItem(TableName, Key) {
    const { Item } = await db.send(new GetCommand({ TableName, Key }));
    return Item;
  }

  // Reads each cargo unit once; the reads are reused for the response.
  async function loadCargoUnits(moves) {
    const ids = [...new Set(moves.map((m) => m.cargoUnitID).filter(Boolean))];
    const units = await Promise.all(ids.map((cargoUnitID) => getItem(CARGO_UNITS_TABLE, { cargoUnitID })));
    return new Map(ids.map((id, i) => [id, units[i]]));
  }

  async function loadActors(events) {
    const emails = [...new Set(events.map((e) => e.actorEmail).filter(Boolean))];
    const found = await Promise.all(emails.map((email) => lookupUser(email)));
    return new Map(emails.map((email, i) => [email, found[i] || {}]));
  }

  async function trackReservation(event) {
    try {
      const body = parseBody(event);
      const code = normalize(body.code);
      const factor = normalize(body.factor);
      if (!CODE_PATTERN.test(code) || !factor || factor.length > MAX_FACTOR_LENGTH) {
        return response(404, NOT_FOUND);
      }

      const reservations = await queryAll({
        TableName: RESERVATIONS_TABLE,
        IndexName: CONFIRMATION_CODE_GSI,
        KeyConditionExpression: "confirmationCode = :c",
        ExpressionAttributeValues: { ":c": code },
      });

      for (const reservation of reservations) {
        const moves = await byReservation(RESERVATION_MOVES_TABLE, RESERVATION_MOVES_GSI, reservation.reservationId);
        const cargoUnits = await loadCargoUnits(moves);
        const matches =
          moves.some((m) => moveFactors(m).includes(factor)) ||
          [...cargoUnits.values()].some((u) => cargoUnitFactors(u).includes(factor));
        if (!matches) continue;

        const [events, terminalConfig] = await Promise.all([
          byReservation(RESERVATION_EVENTS_TABLE, RESERVATION_EVENTS_GSI, reservation.reservationId),
          reservation.terminalId ? getItem(BERTH_CONFIG_TABLE, { terminalId: reservation.terminalId }) : undefined,
        ]);
        const actors = await loadActors(events);
        return response(200, toTrackingView({ reservation, moves, cargoUnits, events, terminalConfig, actors }));
      }
      return response(404, NOT_FOUND);
    } catch (err) {
      // Never echo internal errors to an unauthenticated caller.
      console.error("public track error:", err);
      return response(500, { message: "Something went wrong. Please try again." });
    }
  }

  return { trackReservation };
}

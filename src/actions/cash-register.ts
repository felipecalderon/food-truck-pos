"use server";

import redis from "@/lib/redis"; // Deprecated, but keeping import if needed for migration scripts or cleanup
import { CashRegisterSession } from "@/types/cash-register";
import { Sale } from "@/types/sale";
import { isToday, isThisWeek, isThisMonth } from "date-fns";
import connectDB from "@/lib/db";
import CashRegisterSessionModel, {
  ICashRegisterSession,
} from "@/models/CashRegisterSession";
import { getAllSales } from "./sales";
import SaleModel from "@/models/Sale";

// Helper to map Mongoose document to CashRegisterSession interface
function mapSessionDocument(doc: ICashRegisterSession): CashRegisterSession {
  return {
    id: doc.sessionId,
    posName: doc.posName,
    openedAt: doc.openedAt.getTime(),
    closedAt: doc.closedAt ? doc.closedAt.getTime() : undefined,
    openingBalance: doc.openingBalance,
    closingBalance: doc.closingBalance,
    calculatedSales: doc.calculatedSales,
    difference: doc.difference,
    status: doc.status,
  };
}

export async function getSessionDetails(
  sessionId: string
): Promise<{ session: CashRegisterSession | null; sales: Sale[] }> {
  await connectDB();
  const sessionDoc = await CashRegisterSessionModel.findOne({ sessionId });

  if (!sessionDoc) {
    return { session: null, sales: [] };
  }

  const session = mapSessionDocument(sessionDoc);

  // Fetch sales for this session
  // We can use the SaleModel directly
  const salesDocs = await SaleModel.find({ sessionId })
    .sort({ date: -1 })
    .lean();

  const sales: Sale[] = salesDocs.map((doc: any) => ({
    id: doc.saleId,
    sessionId: doc.sessionId,
    posName: doc.posName,
    items: doc.items,
    total: doc.total,
    date: doc.date.toISOString(),
    paymentMethod: doc.paymentMethod,
    amountPaid: doc.amountPaid,
    change: doc.change,
    comment: doc.comment,
  }));

  return { session, sales };
}

type SessionProps = Promise<CashRegisterSession | null>;

export const openCashRegister = async (
  openingBalance: number,
  posName: string
): Promise<CashRegisterSession> => {
  await connectDB();

  // Check if there is already an open session
  const existingSession = await CashRegisterSessionModel.findOne({
    posName,
    status: "OPEN",
  });
  if (existingSession) {
    throw new Error("Ya existe una caja abierta para este punto de venta.");
  }

  const sessionId = new Date().toISOString(); // Keeping same ID generation strategy or use UUID

  const newSessionData = {
    sessionId,
    posName,
    openedAt: new Date(),
    openingBalance,
    calculatedSales: 0,
    difference: 0,
    status: "OPEN",
  };

  const newSession = await CashRegisterSessionModel.create(newSessionData);

  return mapSessionDocument(newSession);
};

export const getCurrentSession = async (posName: string): SessionProps => {
  await connectDB();
  const sessionDoc = await CashRegisterSessionModel.findOne({
    posName,
    status: "OPEN",
  });

  if (!sessionDoc) {
    return null;
  }

  return mapSessionDocument(sessionDoc);
};

export const closeCashRegister = async (
  closingBalance: number,
  posName: string
): Promise<CashRegisterSession> => {
  await connectDB();

  const sessionDoc = await CashRegisterSessionModel.findOne({
    posName,
    status: "OPEN",
  });
  if (!sessionDoc) {
    throw new Error("No hay una sesión de caja abierta para cerrar.");
  }

  const difference =
    closingBalance - sessionDoc.openingBalance - sessionDoc.calculatedSales;

  sessionDoc.closedAt = new Date();
  sessionDoc.closingBalance = closingBalance;
  sessionDoc.difference = difference;
  sessionDoc.status = "CLOSED";

  await sessionDoc.save();

  return mapSessionDocument(sessionDoc);
};

export async function getAllCashRegisterSessions(searchParams: {
  range?: string;
  from?: string;
  to?: string;
}): Promise<CashRegisterSession[]> {
  try {
    await connectDB();
    const { range, from, to } = searchParams;
    let query: any = {};

    // Date filtering on 'openedAt'
    if (range) {
      const now = new Date();
      if (range === "today") {
        const start = new Date(now.setHours(0, 0, 0, 0));
        const end = new Date(now.setHours(23, 59, 59, 999));
        query.openedAt = { $gte: start, $lte: end };
      } else if (range === "week") {
        const start = new Date(now.setDate(now.getDate() - now.getDay()));
        start.setHours(0, 0, 0, 0);
        const end = new Date(now.setDate(start.getDate() + 6));
        end.setHours(23, 59, 59, 999);
      } else if (range === "month") {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        );
        query.openedAt = { $gte: start, $lte: end };
      }
    } else if (from && to) {
      query.openedAt = { $gte: new Date(from), $lte: new Date(to) };
    }

    const sessionsDocs = await CashRegisterSessionModel.find(query).sort({
      openedAt: -1,
    });

    let allSessions = sessionsDocs.map(mapSessionDocument);

    // Fallback client-side filtering to match exact legacy logic if needed,
    // especially for 'week' which relies on locale in previous implementation.
    if (range === "week") {
      allSessions = allSessions.filter((session: CashRegisterSession) =>
        isThisWeek(new Date(session.openedAt))
      );
    } else if (range === "today") {
      allSessions = allSessions.filter((session: CashRegisterSession) =>
        isToday(new Date(session.openedAt))
      );
    } else if (range == "month") {
      allSessions = allSessions.filter((session: CashRegisterSession) =>
        isThisMonth(new Date(session.openedAt))
      );
    }

    return allSessions;
  } catch (error) {
    console.error(
      "Error fetching all cash register sessions from MongoDB:",
      error
    );
    return [];
  }
}

export async function deleteCashRegister(
  sessionId: string,
  posName: string
): Promise<{ success: boolean; message: string }> {
  try {
    await connectDB();

    const result = await CashRegisterSessionModel.deleteOne({ sessionId });

    if (result.deletedCount === 1) {
      return {
        success: true,
        message: "Sesión de caja eliminada con éxito.",
      };
    }

    return { success: false, message: "No se encontró la sesión de caja." };
  } catch (error) {
    console.error("Error deleting cash register session:", error);
    return { success: false, message: "Error al eliminar la sesión de caja." };
  }
}

export async function getCashRegisterSessionsByPosName(
  posName: string,
  searchParams: {
    range?: string;
    from?: string;
    to?: string;
  }
): Promise<CashRegisterSession[]> {
  try {
    await connectDB();
    // Similar filtering logic as getAllCashRegisterSessions but constrained by posName
    const { range, from, to } = searchParams;
    let query: any = { posName };

    if (range) {
      const now = new Date();
      if (range === "today") {
        const start = new Date(now.setHours(0, 0, 0, 0));
        const end = new Date(now.setHours(23, 59, 59, 999));
        query.openedAt = { $gte: start, $lte: end };
      } else if (range === "week") {
        // Simplified mongo filter, refined by JS below
        const start = new Date(now.setDate(now.getDate() - now.getDay()));
        start.setHours(0, 0, 0, 0);
        query.openedAt = { $gte: start };
      } else if (range === "month") {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        );
        query.openedAt = { $gte: start, $lte: end };
      }
    } else if (from && to) {
      query.openedAt = { $gte: new Date(from), $lte: new Date(to) };
    }

    const sessionsDocs = await CashRegisterSessionModel.find(query).sort({
      openedAt: -1,
    });
    let sessions = sessionsDocs.map(mapSessionDocument);

    if (range === "week") {
      sessions = sessions.filter((session: CashRegisterSession) =>
        isThisWeek(new Date(session.openedAt))
      );
    } else if (range === "today") {
      sessions = sessions.filter((session: CashRegisterSession) =>
        isToday(new Date(session.openedAt))
      );
    } else if (range == "month") {
      sessions = sessions.filter((session: CashRegisterSession) =>
        isThisMonth(new Date(session.openedAt))
      );
    }

    return sessions;
  } catch (error) {
    console.error(
      `Error fetching cash register sessions for POS ${posName} from MongoDB:`,
      error
    );
    return [];
  }
}

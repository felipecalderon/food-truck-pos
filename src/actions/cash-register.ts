"use server";

import { randomUUID } from "crypto";
import { isThisMonth, isThisWeek, isToday } from "date-fns";
import connectDB from "@/lib/db";
import CashMovementModel, { type ICashMovement } from "@/models/CashMovement";
import CashRegisterSessionModel, {
  type ICashRegisterSession,
} from "@/models/CashRegisterSession";
import SaleModel from "@/models/Sale";
import type {
  CashMovement,
  SessionCashMovementTotals,
} from "@/types/cash-movement";
import type { CashRegisterSession } from "@/types/cash-register";
import type { Sale } from "@/types/sale";

function mapSessionDocument(
  doc: ICashRegisterSession,
  netCashMovements = 0,
): CashRegisterSession {
  return {
    id: doc.sessionId,
    posName: doc.posName,
    openedAt: doc.openedAt.getTime(),
    closedAt: doc.closedAt ? doc.closedAt.getTime() : undefined,
    openingBalance: doc.openingBalance,
    closingBalance: doc.closingBalance,
    calculatedSales: doc.calculatedSales,
    netCashMovements,
    difference: doc.difference,
    status: doc.status,
  };
}

function mapCashMovementDocument(doc: ICashMovement): CashMovement {
  return {
    id: doc.movementId,
    sessionId: doc.sessionId,
    posName: doc.posName,
    type: doc.type,
    reason: doc.reason,
    amount: doc.amount,
    receiptAmount: doc.receiptAmount ?? undefined,
    reintegratedAmount: doc.reintegratedAmount ?? undefined,
    netImpact: doc.netImpact,
    createdAt: doc.createdAt.toISOString(),
  };
}

async function getSessionNetCashMovements(sessionId: string): Promise<number> {
  const [result] = await CashMovementModel.aggregate([
    { $match: { sessionId } },
    { $group: { _id: null, net: { $sum: "$netImpact" } } },
  ]);

  return typeof result?.net === "number" ? result.net : 0;
}

function calculateMovementTotals(
  movements: CashMovement[],
): SessionCashMovementTotals {
  return movements.reduce<SessionCashMovementTotals>(
    (acc, movement) => {
      if (movement.type === "WITHDRAWAL") {
        acc.withdrawals += movement.amount;
        acc.receipts += movement.receiptAmount ?? 0;
        acc.reintegrations += movement.reintegratedAmount ?? 0;
      } else {
        acc.deposits += movement.amount;
      }

      acc.netImpact += movement.netImpact;
      return acc;
    },
    {
      withdrawals: 0,
      deposits: 0,
      reintegrations: 0,
      receipts: 0,
      netImpact: 0,
    },
  );
}

export async function getSessionDetails(sessionId: string): Promise<{
  session: CashRegisterSession | null;
  sales: Sale[];
  cashMovements: CashMovement[];
  cashMovementTotals: SessionCashMovementTotals;
}> {
  await connectDB();
  const sessionDoc = await CashRegisterSessionModel.findOne({ sessionId });

  if (!sessionDoc) {
    return {
      session: null,
      sales: [],
      cashMovements: [],
      cashMovementTotals: {
        withdrawals: 0,
        deposits: 0,
        reintegrations: 0,
        receipts: 0,
        netImpact: 0,
      },
    };
  }

  const netCashMovements = await getSessionNetCashMovements(sessionId);
  const session = mapSessionDocument(sessionDoc, netCashMovements);

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

  const cashMovementDocs = await CashMovementModel.find({ sessionId })
    .sort({ createdAt: -1 })
    .lean();

  const cashMovements = cashMovementDocs.map((doc: any) =>
    mapCashMovementDocument(doc),
  );

  const cashMovementTotals = calculateMovementTotals(cashMovements);

  return { session, sales, cashMovements, cashMovementTotals };
}

type SessionProps = Promise<CashRegisterSession | null>;

export const openCashRegister = async (
  openingBalance: number,
  posName: string,
): Promise<CashRegisterSession> => {
  try {
    await connectDB();

    if (!posName || posName.trim() === "") {
      throw new Error("El nombre del punto de venta es requerido.");
    }

    if (typeof openingBalance !== "number" || isNaN(openingBalance)) {
      throw new Error("El saldo inicial debe ser un número válido.");
    }

    const existingSession = await CashRegisterSessionModel.findOne({
      posName,
      status: "OPEN",
    });

    if (existingSession) {
      throw new Error("Ya existe una caja abierta para este punto de venta.");
    }

    const sessionId = new Date().toISOString();

    const newSessionData = {
      sessionId,
      posName,
      openedAt: new Date(),
      openingBalance,
      calculatedSales: 0,
      difference: 0,
      status: "OPEN" as const,
    };

    const newSession = await CashRegisterSessionModel.create(newSessionData);

    if (!newSession) {
      throw new Error("Error al crear la sesión de caja en la base de datos.");
    }

    return mapSessionDocument(newSession);
  } catch (error) {
    console.error("Error en openCashRegister:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Error desconocido al abrir la caja.");
  }
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

  const netCashMovements = await getSessionNetCashMovements(
    sessionDoc.sessionId,
  );
  return mapSessionDocument(sessionDoc, netCashMovements);
};

export const closeCashRegister = async (
  closingBalance: number,
  posName: string,
): Promise<CashRegisterSession> => {
  try {
    await connectDB();

    if (!posName || posName.trim() === "") {
      throw new Error("El nombre del punto de venta es requerido.");
    }

    if (typeof closingBalance !== "number" || isNaN(closingBalance)) {
      throw new Error("El saldo de cierre debe ser un número válido.");
    }

    const sessionDoc = await CashRegisterSessionModel.findOne({
      posName,
      status: "OPEN",
    });

    if (!sessionDoc) {
      throw new Error("No hay una sesión de caja abierta para cerrar.");
    }

    const netCashMovements = await getSessionNetCashMovements(
      sessionDoc.sessionId,
    );
    const difference =
      closingBalance -
      sessionDoc.openingBalance -
      sessionDoc.calculatedSales -
      netCashMovements;

    sessionDoc.closedAt = new Date();
    sessionDoc.closingBalance = closingBalance;
    sessionDoc.difference = difference;
    sessionDoc.status = "CLOSED";

    const savedSession = await sessionDoc.save();

    if (!savedSession) {
      throw new Error(
        "Error al guardar el cierre de caja en la base de datos.",
      );
    }

    return mapSessionDocument(savedSession, netCashMovements);
  } catch (error) {
    console.error("Error en closeCashRegister:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Error desconocido al cerrar la caja.");
  }
};

export async function getAllCashRegisterSessions(searchParams: {
  range?: string;
  from?: string;
  to?: string;
}): Promise<CashRegisterSession[]> {
  try {
    await connectDB();
    const { range, from, to } = searchParams;
    const query: any = {};

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
          999,
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

    if (range === "week") {
      allSessions = allSessions.filter((session: CashRegisterSession) =>
        isThisWeek(new Date(session.openedAt)),
      );
    } else if (range === "today") {
      allSessions = allSessions.filter((session: CashRegisterSession) =>
        isToday(new Date(session.openedAt)),
      );
    } else if (range == "month") {
      allSessions = allSessions.filter((session: CashRegisterSession) =>
        isThisMonth(new Date(session.openedAt)),
      );
    }

    return allSessions;
  } catch (error) {
    console.error(
      "Error fetching all cash register sessions from MongoDB:",
      error,
    );
    return [];
  }
}

export async function createCashMovement(input: {
  posName: string;
  type: "WITHDRAWAL" | "DEPOSIT";
  amount: number;
  reason: "Retiro para comprar" | "Ingreso manual";
  receiptAmount?: number;
}): Promise<{ success: boolean; message: string; movement?: CashMovement }> {
  try {
    await connectDB();

    const { posName, type, amount, reason, receiptAmount } = input;

    if (!posName || posName.trim() === "") {
      return {
        success: false,
        message: "El nombre del punto de venta es requerido.",
      };
    }

    if (typeof amount !== "number" || Number.isNaN(amount) || amount <= 0) {
      return {
        success: false,
        message: "El monto del movimiento debe ser mayor a 0.",
      };
    }

    const session = await CashRegisterSessionModel.findOne({
      posName,
      status: "OPEN",
    });

    if (!session) {
      return {
        success: false,
        message: "No hay una caja abierta para registrar el movimiento.",
      };
    }

    let netImpact = amount;
    let normalizedReceiptAmount: number | null = null;
    let reintegratedAmount: number | null = null;

    if (type === "WITHDRAWAL") {
      if (reason !== "Retiro para comprar") {
        return {
          success: false,
          message: "El motivo del retiro no es válido.",
        };
      }

      if (
        typeof receiptAmount !== "number" ||
        Number.isNaN(receiptAmount) ||
        receiptAmount < 0
      ) {
        return {
          success: false,
          message: "Debes ingresar un monto de boleta válido.",
        };
      }

      if (receiptAmount > amount) {
        return {
          success: false,
          message: "La boleta no puede ser mayor al monto retirado.",
        };
      }

      normalizedReceiptAmount = receiptAmount;
      reintegratedAmount = amount - receiptAmount;
      netImpact = -receiptAmount;
    } else if (reason !== "Ingreso manual") {
      return {
        success: false,
        message: "El motivo para agregar efectivo no es válido.",
      };
    }

    const movementDoc = await CashMovementModel.create({
      movementId: randomUUID(),
      sessionId: session.sessionId,
      posName,
      type,
      reason,
      amount,
      receiptAmount: normalizedReceiptAmount,
      reintegratedAmount,
      netImpact,
      createdAt: new Date(),
    });

    if (!movementDoc) {
      return {
        success: false,
        message: "No se pudo registrar el movimiento de caja.",
      };
    }

    return {
      success: true,
      message: "Movimiento de caja registrado con éxito.",
      movement: mapCashMovementDocument(movementDoc),
    };
  } catch (error) {
    console.error("Error creating cash movement:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Error desconocido al registrar movimiento de caja.",
    };
  }
}

export async function getSessionCashMovements(
  sessionId: string,
): Promise<CashMovement[]> {
  try {
    await connectDB();
    const docs = await CashMovementModel.find({ sessionId })
      .sort({ createdAt: -1 })
      .lean();
    return docs.map((doc: any) => mapCashMovementDocument(doc));
  } catch (error) {
    console.error("Error fetching session cash movements:", error);
    return [];
  }
}

export async function getSessionCashMovementTotals(
  sessionId: string,
): Promise<SessionCashMovementTotals> {
  const movements = await getSessionCashMovements(sessionId);
  return calculateMovementTotals(movements);
}

export async function deleteCashRegister(
  sessionId: string,
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
  },
): Promise<CashRegisterSession[]> {
  try {
    await connectDB();
    // Similar filtering logic as getAllCashRegisterSessions but constrained by posName
    const { range, from, to } = searchParams;
    const query: any = { posName };

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
          999,
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
        isThisWeek(new Date(session.openedAt)),
      );
    } else if (range === "today") {
      sessions = sessions.filter((session: CashRegisterSession) =>
        isToday(new Date(session.openedAt)),
      );
    } else if (range == "month") {
      sessions = sessions.filter((session: CashRegisterSession) =>
        isThisMonth(new Date(session.openedAt)),
      );
    }

    return sessions;
  } catch (error) {
    console.error(
      `Error fetching cash register sessions for POS ${posName} from MongoDB:`,
      error,
    );
    return [];
  }
}

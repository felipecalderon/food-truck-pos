"use server";

import redis from "@/lib/redis";
import { CashRegisterSession } from "@/types/cash-register";
import { Sale } from "@/types/sale";
import { isToday, isThisWeek, isThisMonth } from "date-fns";

export async function getSessionDetails(sessionId: string): Promise<{ session: CashRegisterSession | null; sales: Sale[] }> {
  try {
    // Obtener todas las sesiones y encontrar la correcta
    const allSessions = await getAllCashRegisterSessions({ range: undefined, from: undefined, to: undefined });
    const session = allSessions.find((s) => s.id === sessionId) || null;

    if (!session) {
      return { session: null, sales: [] };
    }

    // Obtener los IDs de las ventas de la sesión
    const saleIds = await redis.smembers(`session-sales:${sessionId}`);
    if (saleIds.length === 0) {
      return { session, sales: [] };
    }

    // Obtener los detalles de cada venta
    const saleKeys = saleIds.map((id) => `sale:${id}`);
    const salesJson = await redis.mget(saleKeys);

    const sales = salesJson
      .map((saleJson) => {
        try {
          return saleJson ? (JSON.parse(saleJson) as Sale) : null;
        } catch (e) {
          return null;
        }
      })
      .filter((sale): sale is Sale => sale !== null)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { session, sales };
  } catch (error) {
    console.error("Error fetching session details from Redis:", error);
    return { session: null, sales: [] };
  }
}


type SessionProps = Promise<CashRegisterSession | null>;

export const openCashRegister = async (
  openingBalance: number,
  posName: string
): Promise<CashRegisterSession> => {
  const CURRENT_SESSION_KEY = `cash-register:${posName}:current`;
  // TODO: Verificar si ya existe una sesión abierta
  const newSession: CashRegisterSession = {
    id: new Date().toISOString(),
    posName: posName,
    openedAt: Date.now(),
    openingBalance,
    calculatedSales: 0,
    difference: 0,
    status: "OPEN",
  };

  await redis.set(CURRENT_SESSION_KEY, JSON.stringify(newSession));

  return newSession;
};

export const getCurrentSession = async (posName: string): SessionProps => {
  const CURRENT_SESSION_KEY = `cash-register:${posName}:current`;
  const sessionData = await redis.get(CURRENT_SESSION_KEY);

  if (!sessionData) {
    return null;
  }

  try {
    const session = JSON.parse(sessionData as string) as CashRegisterSession;
    return session;
  } catch (error) {
    console.error("Error parsing cash register session data:", error);
    return null;
  }
};

export const closeCashRegister = async (
  closingBalance: number,
  posName: string
): Promise<CashRegisterSession> => {
  const CURRENT_SESSION_KEY = `cash-register:${posName}:current`;
  const sessionData = await redis.get(CURRENT_SESSION_KEY);
  if (!sessionData) {
    throw new Error("No hay una sesión de caja abierta para cerrar.");
  }

  const session = JSON.parse(sessionData as string) as CashRegisterSession;
  if (session.status !== "OPEN") {
    throw new Error(
      `La sesión de caja tiene un estado inválido: ${session.status}`
    );
  }

  const difference =
    closingBalance - session.openingBalance - session.calculatedSales;

  const closedSession: CashRegisterSession = {
    ...session,
    closedAt: Date.now(),
    closingBalance,
    difference,
    status: "CLOSED",
  };

  // Mover la sesión a un historial y limpiar la sesión actual
  await redis
    .multi()
    .rpush(`cash-register:${posName}:history`, JSON.stringify(closedSession))
    .del(CURRENT_SESSION_KEY)
    .exec();

  return closedSession;
};

export async function getAllCashRegisterSessions(searchParams: {
  range?: string;
  from?: string;
  to?: string;
}): Promise<CashRegisterSession[]> {
  try {
    const currentSessionKeys = await redis.keys("cash-register:*:current");
    const historySessionKeys = await redis.keys("cash-register:*:history");

    let allSessions: CashRegisterSession[] = [];

    // Obtener sesiones actuales
    if (currentSessionKeys.length > 0) {
      const currentSessionsJson = await redis.mget(currentSessionKeys);
      currentSessionsJson.forEach((sessionJson) => {
        if (sessionJson) {
          try {
            allSessions.push(JSON.parse(sessionJson) as CashRegisterSession);
          } catch (error) {
            console.error("Error parsing current session JSON:", error);
          }
        }
      });
    }

    // Obtener sesiones históricas
    if (historySessionKeys.length > 0) {
      for (const historyKey of historySessionKeys) {
        const historySessionsJson = await redis.lrange(historyKey, 0, -1);
        historySessionsJson.forEach((sessionJson) => {
          if (sessionJson) {
            try {
              allSessions.push(JSON.parse(sessionJson) as CashRegisterSession);
            } catch (error) {
              console.error("Error parsing history session JSON:", error);
            }
          }
        });
      }
    }

    const { range, from, to } = searchParams;

    if (range) {
      if (range === "today") {
        allSessions = allSessions.filter((session) =>
          isToday(new Date(session.openedAt))
        );
      } else if (range === "week") {
        allSessions = allSessions.filter((session) =>
          isThisWeek(new Date(session.openedAt))
        );
      } else if (range === "month") {
        allSessions = allSessions.filter((session) =>
          isThisMonth(new Date(session.openedAt))
        );
      }
    } else if (from && to) {
      const startDate = new Date(from);
      const endDate = new Date(to);
      allSessions = allSessions.filter((session) => {
        const sessionDate = new Date(session.openedAt);
        return sessionDate >= startDate && sessionDate <= endDate;
      });
    }

    // Ordenar por fecha de apertura (más reciente primero)
    return allSessions.sort((a, b) => b.openedAt - a.openedAt);
  } catch (error) {
    console.error(
      "Error fetching all cash register sessions from Redis:",
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
    // Primero, intenta ver si es la sesión actual
    const CURRENT_SESSION_KEY = `cash-register:${posName}:current`;
    const currentSessionJSON = await redis.get(CURRENT_SESSION_KEY);

    if (currentSessionJSON) {
      const currentSession = JSON.parse(
        currentSessionJSON
      ) as CashRegisterSession;
      if (currentSession.id === sessionId) {
        // Si es la sesión actual, la eliminamos
        await redis.del(CURRENT_SESSION_KEY);
        return {
          success: true,
          message: "Sesión de caja actual eliminada con éxito.",
        };
      }
    }

    // Si no es la sesión actual, búscala en el historial
    const HISTORY_KEY = `cash-register:${posName}:history`;
    const historySessionsJSON = await redis.lrange(HISTORY_KEY, 0, -1);

    let sessionToDeleteJSON: string | null = null;
    for (const sessionJSON of historySessionsJSON) {
      const session = JSON.parse(sessionJSON) as CashRegisterSession;
      if (session.id === sessionId) {
        sessionToDeleteJSON = sessionJSON;
        break;
      }
    }

    if (sessionToDeleteJSON) {
      // Elimina la sesión del historial
      await redis.lrem(HISTORY_KEY, 1, sessionToDeleteJSON);
      return {
        success: true,
        message: "Sesión de caja del historial eliminada con éxito.",
      };
    }

    return { success: false, message: "No se encontró la sesión de caja." };
  } catch (error) {
    console.error("Error deleting cash register session:", error);
    return { success: false, message: "Error al eliminar la sesión de caja." };
  }
}

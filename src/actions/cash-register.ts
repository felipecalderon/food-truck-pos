"use server";

import redis from "@/lib/redis";
import { CashRegisterSession } from "@/types/cash-register";

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

export async function getAllCashRegisterSessions(): Promise<CashRegisterSession[]> {
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

    // Ordenar por fecha de apertura (más reciente primero)
    return allSessions.sort((a, b) => b.openedAt - a.openedAt);
  } catch (error) {
    console.error("Error fetching all cash register sessions from Redis:", error);
    return [];
  }
}

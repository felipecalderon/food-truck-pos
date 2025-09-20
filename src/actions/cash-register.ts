"use server";

import redis from "@/lib/redis";
import { CashRegisterSession } from "@/types/cash-register";

const POS_NAME = "main-pos"; // TODO: Esto debería ser dinámico
const CURRENT_SESSION_KEY = `cash-register:${POS_NAME}:current`;

export const openCashRegister = async (
  openingBalance: number
): Promise<CashRegisterSession> => {
  // TODO: Verificar si ya existe una sesión abierta
  const newSession: CashRegisterSession = {
    id: new Date().toISOString(),
    posName: POS_NAME,
    openedAt: Date.now(),
    openingBalance,
    calculatedSales: 0,
    difference: 0,
    status: "OPEN",
  };

  await redis.set(CURRENT_SESSION_KEY, JSON.stringify(newSession));

  return newSession;
};

export const getCurrentSession =
  async (): Promise<CashRegisterSession | null> => {
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
  closingBalance: number
): Promise<CashRegisterSession> => {
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
    .rpush(`cash-register:${POS_NAME}:history`, JSON.stringify(closedSession))
    .del(CURRENT_SESSION_KEY)
    .exec();

  return closedSession;
};

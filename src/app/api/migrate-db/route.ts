import { NextResponse } from "next/server";
import redis from "@/lib/redis";
import connectDB from "@/lib/db";
import SaleModel from "@/models/Sale";
import CashRegisterSessionModel from "@/models/CashRegisterSession";
import { Sale } from "@/types/sale";
import { CashRegisterSession } from "@/types/cash-register";

export async function GET() {
  await connectDB();
  const results = {
    sales: { total: 0, migrated: 0, errors: 0 },
    sessions: { total: 0, migrated: 0, errors: 0 },
  };

  try {
    // 1. Migrate Sales
    const saleKeys = await redis.keys("sale:*");
    results.sales.total = saleKeys.length;

    if (saleKeys.length > 0) {
      const salesJson = await redis.mget(saleKeys);
      for (const saleStr of salesJson) {
        if (!saleStr) continue;
        try {
          const sale: Sale = JSON.parse(saleStr);
          // Check if already exists to ensure idempotency
          const exists = await SaleModel.exists({ saleId: sale.id });
          if (!exists) {
            await SaleModel.create({
              saleId: sale.id,
              sessionId: sale.sessionId,
              posName: sale.posName,
              items: sale.items,
              total: sale.total,
              date: new Date(sale.date), // Convert string to Date
              paymentMethod: sale.paymentMethod,
              amountPaid: sale.amountPaid,
              change: sale.change,
              comment: sale.comment,
            });
            results.sales.migrated++;
          }
        } catch (e) {
          console.error("Error migrating sale:", e);
          results.sales.errors++;
        }
      }
    }

    // 2. Migrate Sessions
    const currentSessionKeys = await redis.keys("cash-register:*:current");
    const historySessionKeys = await redis.keys("cash-register:*:history");

    // Process Current Sessions
    if (currentSessionKeys.length > 0) {
      const currentSessionsJson = await redis.mget(currentSessionKeys);
      for (const sessionStr of currentSessionsJson) {
        if (!sessionStr) continue;
        try {
          const session: CashRegisterSession = JSON.parse(sessionStr);
          results.sessions.total++;

          const exists = await CashRegisterSessionModel.exists({
            sessionId: session.id,
          });
          if (!exists) {
            await CashRegisterSessionModel.create({
              sessionId: session.id,
              posName: session.posName,
              openedAt: new Date(session.openedAt),
              closedAt: session.closedAt
                ? new Date(session.closedAt)
                : undefined,
              openingBalance: session.openingBalance,
              closingBalance: session.closingBalance,
              calculatedSales: session.calculatedSales,
              difference: session.difference,
              status: session.status,
            });
            results.sessions.migrated++;
          }
        } catch (e) {
          console.error("Error migrating current session:", e);
          results.sessions.errors++;
        }
      }
    }

    // Process History Sessions
    for (const key of historySessionKeys) {
      const historySessionsJson = await redis.lrange(key, 0, -1);
      for (const sessionStr of historySessionsJson) {
        if (!sessionStr) continue;
        try {
          const session: CashRegisterSession = JSON.parse(sessionStr);
          results.sessions.total++;

          const exists = await CashRegisterSessionModel.exists({
            sessionId: session.id,
          });
          if (!exists) {
            await CashRegisterSessionModel.create({
              sessionId: session.id,
              posName: session.posName,
              openedAt: new Date(session.openedAt),
              closedAt: session.closedAt
                ? new Date(session.closedAt)
                : undefined,
              openingBalance: session.openingBalance,
              closingBalance: session.closingBalance,
              calculatedSales: session.calculatedSales,
              difference: session.difference,
              status: session.status,
            });
            results.sessions.migrated++;
          }
        } catch (e) {
          console.error("Error migrating history session:", e);
          results.sessions.errors++;
        }
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Migration failed:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

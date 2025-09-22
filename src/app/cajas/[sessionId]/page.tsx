import React from "react";
import { getSessionDetails } from "@/actions/cash-register";
import { SalesList } from "@/components/sales-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default async function SessionDetailsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const { session, sales } = await getSessionDetails(sessionId);

  if (!session) {
    notFound();
  }

  return (
    <div className="container mx-auto py-10 px-6">
      <h1 className="text-3xl font-bold mb-6">Detalles de la Sesión de Caja</h1>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>ID de Sesión: {session.id}</span>
            <Badge
              variant={session.status === "OPEN" ? "default" : "destructive"}
            >
              {session.status === "OPEN" ? "Abierta" : "Cerrada"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">POS</p>
            <p className="font-semibold">{session.posName}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">
              Fecha de Apertura
            </p>
            <p className="font-semibold">
              {formatDate(session.openedAt.toString())}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Saldo Inicial</p>
            <p className="font-semibold">
              {formatCurrency(session.openingBalance)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">
              Ventas Calculadas
            </p>
            <p className="font-semibold">
              {formatCurrency(session.calculatedSales)}
            </p>
          </div>
          {session.status === "CLOSED" && (
            <>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Fecha de Cierre
                </p>
                <p className="font-semibold">
                  {session.closedAt
                    ? formatDate(session.closedAt.toString())
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Saldo Final</p>
                <p className="font-semibold">
                  {session.closingBalance
                    ? formatCurrency(session.closingBalance)
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Diferencia</p>
                <p
                  className={`font-semibold ${
                    session.difference < 0 ? "text-red-500" : "text-green-500"
                  }`}
                >
                  {formatCurrency(session.difference)}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold mb-4">Ventas de la Sesión</h2>
      <SalesList sales={sales} />
    </div>
  );
}

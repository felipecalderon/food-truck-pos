export interface CashRegisterSession {
  id: string; // ID único para la sesión (ej: timestamp o UUID)
  posName: string; // Nombre del punto de venta
  openedAt: number; // Timestamp de apertura
  closedAt?: number; // Timestamp de cierre (opcional)
  openingBalance: number; // Saldo inicial en efectivo
  closingBalance?: number; // Saldo final contado
  calculatedSales: number; // Total de ventas en efectivo registradas por el sistema
  difference: number; // Diferencia: (closingBalance - openingBalance) - calculatedSales
  status: 'OPEN' | 'CLOSED';
}

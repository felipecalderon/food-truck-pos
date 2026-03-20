"use client";

import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCartStore } from "@/stores/cart";
import { useOrderStore } from "@/stores/orders";

export function PendingOrdersList() {
  const { orders, cancelOrder } = useOrderStore();
  const { items, loadOrder } = useCartStore();

  const pendingOrders = orders.filter((order) => order.status === "PENDIENTE");

  const handleLoadOrder = (orderId: string) => {
    const orderToLoad = orders.find((order) => order.id === orderId);
    if (orderToLoad) {
      if (items.length > 0) {
        toast.warning("El carrito actual no está vacío", {
          description:
            "Si continúas, se reemplazará el carrito por el pedido seleccionado.",
          action: {
            label: "Reemplazar",
            onClick: () => {
              loadOrder(orderToLoad);
              toast.success(
                `Pedido ${orderToLoad.name} cargado en el carrito.`,
              );
            },
          },
        });
        return;
      }

      loadOrder(orderToLoad);
      toast.success(`Pedido ${orderToLoad.name} cargado en el carrito.`);
    }
  };

  const handleCancelOrder = (orderId: string) => {
    const order = orders.find((item) => item.id === orderId);
    toast.warning("Cancelar pedido", {
      description: "Esta acción quitará el pedido de la lista pendiente.",
      action: {
        label: "Cancelar pedido",
        onClick: () => {
          cancelOrder(orderId);
          if (order) {
            toast.success(`Pedido ${order.name} cancelado.`);
          } else {
            toast.success("Pedido cancelado.");
          }
        },
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pedidos Pendientes</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {pendingOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground col-span-full">
            No hay pedidos pendientes.
          </p>
        ) : (
          pendingOrders.map((order) => (
            <Card key={order.id} className="flex flex-col">
              <CardHeader className="relative pb-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={() => handleCancelOrder(order.id)}
                >
                  <span className="text-lg">×</span>
                </Button>
                <CardTitle className="text-lg pr-8">{order.name}</CardTitle>
                <Badge variant="outline" className="w-fit">
                  {order.status}
                </Badge>
              </CardHeader>

              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground truncate">
                  {order.items
                    .map((item) => `${item.quantity}x ${item.nombre}`)
                    .join(", ")}
                </p>
                <p className="font-bold text-xl">
                  {order.total.toLocaleString("es-CL", {
                    style: "currency",
                    currency: "CLP",
                  })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(order.createdAt).toLocaleTimeString()}
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => handleLoadOrder(order.id)}
                >
                  Generar Pedido
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  );
}

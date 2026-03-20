"use client";

import { Minus, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createMongoProduct,
  updateMongoProduct,
} from "@/actions/mongo-products";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InsumoRequirement, MongoProduct, Product } from "@/types/product";

interface CreateMongoProductDialogProps {
  allInsumos: Product[];
  isOpen: boolean;
  onClose: () => void;
  mode?: "create" | "edit";
  productToEdit?: MongoProduct | null;
  onCreated?: (product: MongoProduct) => void;
  onUpdated?: (product: MongoProduct) => void;
}

export function CreateMongoProductDialog({
  allInsumos,
  isOpen,
  onClose,
  mode = "create",
  productToEdit = null,
  onCreated,
  onUpdated,
}: CreateMongoProductDialogProps) {
  const [nombre, setNombre] = useState("");
  const [sku, setSku] = useState("");
  const [categoria, setCategoria] = useState("Final");
  const [precio, setPrecio] = useState<string>("0");
  const [searchTerm, setSearchTerm] = useState("");
  const [associatedInsumos, setAssociatedInsumos] = useState<
    InsumoRequirement[]
  >([]);
  const [isPending, startTransition] = useTransition();

  const isEditMode = mode === "edit";

  const filteredInsumos = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return allInsumos
      .filter(
        (insumo) =>
          insumo.nombre.toLowerCase().includes(term) ||
          insumo.sku.toLowerCase().includes(term),
      )
      .slice(0, 15);
  }, [allInsumos, searchTerm]);

  const selectedInsumos = useMemo(() => {
    return associatedInsumos
      .map((insumoItem) => {
        const insumo = allInsumos.find((item) => item.sku === insumoItem.sku);
        if (!insumo) return null;
        return { ...insumo, quantity: insumoItem.quantity };
      })
      .filter(
        (
          insumo,
        ): insumo is Product & {
          quantity: number;
        } => !!insumo,
      );
  }, [associatedInsumos, allInsumos]);

  const increaseInsumoQuantity = (skuItem: string) => {
    setAssociatedInsumos((prev) => {
      const existing = prev.find((item) => item.sku === skuItem);
      if (!existing) {
        return [...prev, { sku: skuItem, quantity: 1 }];
      }

      return prev.map((item) =>
        item.sku === skuItem ? { ...item, quantity: item.quantity + 1 } : item,
      );
    });
  };

  const decreaseInsumoQuantity = (skuItem: string) => {
    setAssociatedInsumos((prev) =>
      prev
        .map((item) =>
          item.sku === skuItem
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const setInsumoQuantity = (skuItem: string, quantityRaw: number) => {
    const quantity = Math.floor(quantityRaw);
    if (!Number.isFinite(quantity)) return;

    setAssociatedInsumos((prev) =>
      prev
        .map((item) => (item.sku === skuItem ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0),
    );
  };

  const removeInsumo = (skuItem: string) => {
    setAssociatedInsumos((prev) => prev.filter((item) => item.sku !== skuItem));
  };

  const resetForm = () => {
    setNombre("");
    setSku("");
    setCategoria("Final");
    setPrecio("0");
    setSearchTerm("");
    setAssociatedInsumos([]);
  };

  useEffect(() => {
    if (!isOpen) return;

    if (isEditMode && productToEdit) {
      setNombre(productToEdit.nombre);
      setSku(productToEdit.sku);
      setCategoria(productToEdit.categoria);
      setPrecio(String(productToEdit.precio));
      setSearchTerm("");
      setAssociatedInsumos(
        productToEdit.associatedInsumos.length > 0
          ? productToEdit.associatedInsumos
          : (productToEdit.associatedSkus ?? []).map((skuItem) => ({
              sku: skuItem,
              quantity: 1,
            })),
      );
      return;
    }

    resetForm();
  }, [isOpen, isEditMode, productToEdit]);

  const handleClose = () => {
    if (isPending) return;
    resetForm();
    onClose();
  };

  const handleSubmit = () => {
    if (associatedInsumos.length === 0) {
      toast.error("Debes asociar al menos un insumo para guardar el producto.");
      return;
    }

    startTransition(async () => {
      const result = isEditMode
        ? await updateMongoProduct({
            sku: productToEdit?.sku || sku,
            nombre,
            categoria,
            precio: Number(precio),
            associatedInsumos,
          })
        : await createMongoProduct({
            nombre,
            sku,
            categoria,
            precio: Number(precio),
            associatedInsumos,
          });

      if (!result.success || !result.data) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);

      if (isEditMode) {
        onUpdated?.(result.data);
      } else {
        onCreated?.(result.data);
      }

      handleClose();
    });
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditMode
              ? "Editar producto final (MongoDB)"
              : "Crear producto final (MongoDB)"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            El único requisito es vincular al menos un insumo.
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
          <Input
            placeholder="Nombre (opcional)"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            disabled={isPending}
          />
          <Input
            placeholder="SKU (opcional)"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            disabled={isPending || isEditMode}
          />
          <Input
            placeholder="Categoría (opcional)"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            disabled={isPending}
          />
          <Input
            type="number"
            min="0"
            placeholder="Precio"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            disabled={isPending}
          />
        </div>

        <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md bg-muted/30">
          {selectedInsumos.length === 0 && (
            <p className="text-xs text-muted-foreground italic">
              Sin insumos asociados.
            </p>
          )}
          {selectedInsumos.map((insumo) => (
            <Badge
              key={insumo.sku}
              variant="secondary"
              className="pl-2 pr-1 py-1 gap-1"
            >
              <span className="mr-1">{insumo.nombre}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 rounded-full"
                onClick={() => decreaseInsumoQuantity(insumo.sku)}
                disabled={isPending}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <Input
                type="number"
                min="1"
                step="1"
                value={insumo.quantity}
                onChange={(e) =>
                  setInsumoQuantity(insumo.sku, Number(e.target.value))
                }
                className="h-6 w-16 px-2 text-xs"
                disabled={isPending}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 rounded-full"
                onClick={() => increaseInsumoQuantity(insumo.sku)}
                disabled={isPending}
              >
                <Plus className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 rounded-full hover:bg-destructive hover:text-white"
                onClick={() => removeInsumo(insumo.sku)}
                disabled={isPending}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar insumos por nombre o SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
            disabled={isPending}
          />
        </div>

        <div className="flex-1 overflow-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Insumo</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!searchTerm && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center py-4 text-muted-foreground"
                  >
                    Escribe para buscar insumos.
                  </TableCell>
                </TableRow>
              )}
              {searchTerm && filteredInsumos.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center py-4 text-muted-foreground"
                  >
                    No se encontraron insumos.
                  </TableCell>
                </TableRow>
              )}
              {filteredInsumos.map((insumo) => (
                <TableRow key={insumo.sku}>
                  <TableCell className="font-mono text-xs">
                    {insumo.sku}
                  </TableCell>
                  <TableCell>{insumo.nombre}</TableCell>
                  <TableCell className="text-right">
                    {associatedInsumos.some(
                      (item) => item.sku === insumo.sku,
                    ) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => increaseInsumoQuantity(insumo.sku)}
                        disabled={isPending}
                      >
                        <Plus className="mr-1 h-3 w-3" /> Agregar +1
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => increaseInsumoQuantity(insumo.sku)}
                        disabled={isPending}
                      >
                        <Plus className="mr-1 h-3 w-3" /> Agregar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending
              ? isEditMode
                ? "Guardando..."
                : "Creando..."
              : isEditMode
                ? "Guardar cambios"
                : "Crear producto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

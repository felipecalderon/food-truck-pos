"use client";

import {
  ExternalLink,
  Link as LinkIcon,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteMongoProduct } from "@/actions/mongo-products";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { MongoProduct, Product } from "@/types/product";
import { CreateMongoProductDialog } from "./create-mongo-product-dialog";
import { ProductRelationDialog } from "./product-relation-dialog";

interface ProductAdminListProps {
  products: Product[];
  initialFinalProducts: MongoProduct[];
}

export function ProductAdminList({
  products: initialProducts,
  initialFinalProducts,
}: ProductAdminListProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [finalProducts, setFinalProducts] =
    useState<MongoProduct[]>(initialFinalProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingFinalProduct, setEditingFinalProduct] =
    useState<MongoProduct | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingSku, setDeletingSku] = useState<string | null>(null);
  const [isDeletingPending, startDeleteTransition] = useTransition();

  // Sincronizar estado local si las props cambian (fuente de verdad del servidor)
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  useEffect(() => {
    setFinalProducts(initialFinalProducts);
  }, [initialFinalProducts]);

  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [products, searchTerm]);

  const insumoNameBySku = useMemo(() => {
    return new Map(products.map((insumo) => [insumo.sku, insumo.nombre]));
  }, [products]);

  const getProductInsumos = (product: MongoProduct) => {
    if (product.associatedInsumos.length > 0) {
      return product.associatedInsumos;
    }

    return (product.associatedSkus ?? []).map((sku) => ({ sku, quantity: 1 }));
  };

  const handleEditRelations = (product: Product) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  const handleUpdateLocalRelation = (
    parentSku: string,
    associatedSkus: string[],
  ) => {
    // Actualización reactiva inmediata en el cliente para mejor UX
    setProducts((prev) =>
      prev.map((p) => {
        if (p.sku === parentSku) {
          const references = associatedSkus
            .map((sku) => prev.find((item) => item.sku === sku))
            .filter((ref): ref is Product => !!ref);
          return { ...p, references };
        }
        return p;
      }),
    );
  };

  const executeDeleteFinalProduct = (product: MongoProduct) => {
    setDeletingSku(product.sku);
    startDeleteTransition(async () => {
      const result = await deleteMongoProduct(product.sku);
      setDeletingSku(null);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setFinalProducts((prev) =>
        prev.filter((item) => item.sku !== product.sku),
      );
      toast.success(result.message);
    });
  };

  const handleDeleteFinalProduct = (product: MongoProduct) => {
    if (isDeletingPending) return;

    toast.warning("Eliminar producto final", {
      description: `${product.nombre} (${product.sku}) se eliminará de forma permanente.`,
      action: {
        label: "Eliminar",
        onClick: () => executeDeleteFinalProduct(product),
      },
    });
  };

  const handleOpenEditFinalProduct = (product: MongoProduct) => {
    setEditingFinalProduct(product);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Cada producto debe tener al menos un insumo.
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            Crear producto
          </Button>
        </div>
        <div className="border rounded-md bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">SKU</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Insumos vinculados</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {finalProducts.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Aún no hay productos finales, crea uno!
                  </TableCell>
                </TableRow>
              )}
              {finalProducts.map((product) => (
                <TableRow key={product.sku}>
                  <TableCell className="font-mono text-xs">
                    {product.sku}
                  </TableCell>
                  <TableCell className="font-medium">
                    {product.nombre}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.categoria}
                  </TableCell>
                  <TableCell>{product.precio}</TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="cursor-help">
                            {getProductInsumos(product).length} insumos
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <div className="space-y-1">
                            {getProductInsumos(product).map((insumo) => (
                              <p
                                key={`${product.sku}-${insumo.sku}`}
                                className="text-xs leading-tight"
                              >
                                {insumoNameBySku.get(insumo.sku) ?? insumo.sku}{" "}
                                x{insumo.quantity}
                              </p>
                            ))}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditFinalProduct(product)}
                        disabled={isDeletingPending}
                      >
                        <Pencil className="mr-1 h-3.5 w-3.5" />
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteFinalProduct(product)}
                        disabled={
                          isDeletingPending && deletingSku === product.sku
                        }
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        {isDeletingPending && deletingSku === product.sku
                          ? "Eliminando..."
                          : "Eliminar"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filtrar productos por nombre o SKU..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-sm text-muted-foreground">
          Mostrando {filteredProducts.length} de {products.length} insumos
        </div>
      </div>

      <div className="border rounded-md bg-white">
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-lg font-semibold">Insumos</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">SKU</TableHead>
              <TableHead>Insumo</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Relaciones</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-10 text-muted-foreground"
                >
                  No se encontraron productos.
                </TableCell>
              </TableRow>
            )}
            {filteredProducts.map((product) => (
              <TableRow key={product.sku}>
                <TableCell className="font-mono text-xs">
                  {product.sku}
                </TableCell>
                <TableCell className="font-medium">{product.nombre}</TableCell>
                <TableCell className="text-muted-foreground">
                  {product.categoria}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={product.stock > 0 ? "secondary" : "destructive"}
                  >
                    {product.stock}
                  </Badge>
                </TableCell>
                <TableCell>
                  {product.references && product.references.length > 0 ? (
                    <Badge
                      variant="outline"
                      className="gap-1 bg-blue-50 border-blue-200 text-blue-700"
                    >
                      <LinkIcon className="h-3 w-3" />
                      {product.references.length} vinculos
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Sin vínculos
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                    onClick={() => handleEditRelations(product)}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Asociar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ProductRelationDialog
        parentProduct={selectedProduct}
        allProducts={products}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSaved={(parentSku, skus) => {
          handleUpdateLocalRelation(parentSku, skus);
        }}
      />

      <CreateMongoProductDialog
        allInsumos={products}
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreated={(created: MongoProduct) => {
          setFinalProducts((prev) => [created, ...prev]);
        }}
      />

      <CreateMongoProductDialog
        allInsumos={products}
        mode="edit"
        productToEdit={editingFinalProduct}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingFinalProduct(null);
        }}
        onUpdated={(updated: MongoProduct) => {
          setFinalProducts((prev) =>
            prev.map((item) => (item.sku === updated.sku ? updated : item)),
          );
          setIsEditDialogOpen(false);
          setEditingFinalProduct(null);
        }}
      />
    </div>
  );
}

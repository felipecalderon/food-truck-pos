"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PosNameSetup() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [posName, setPosName] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      const storedPosName = localStorage.getItem("pos_name");
      if (!storedPosName) {
        setIsDialogOpen(true);
      }
    }
  }, [isMounted]);

  const handleSave = () => {
    if (posName.trim()) {
      localStorage.setItem("pos_name", posName.trim());
      setIsDialogOpen(false);
    }
  };

  // Evita renderizar el diálogo en el servidor
  if (!isMounted) {
    return null;
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[425px]"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Configuración POS</DialogTitle>
          <DialogDescription>
            Dale un nombre a este Punto de Venta (POS) para identificarlo.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="pos-name" className="text-right">
              Nombre:
            </Label>
            <Input
              id="pos-name"
              value={posName}
              onChange={(e) => setPosName(e.target.value)}
              className="col-span-3"
              placeholder="Ej: Compu carrito / celu pame"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave} disabled={!posName}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

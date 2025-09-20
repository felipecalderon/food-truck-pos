
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { updateSale } from '@/actions/sales';
import { Sale } from '@/types/sale';

interface EditSaleDialogProps {
  sale: Sale;
}

export function EditSaleDialog({ sale }: EditSaleDialogProps) {
  const router = useRouter();
  const [comment, setComment] = useState(sale.comment || '');
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    setIsSaving(true);
    await updateSale(sale.id, comment);
    setIsSaving(false);
    setIsOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Editar</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Venta</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="Añadir un comentario..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={isSaving}
          />
        </div>
        <Button onClick={handleSubmit} disabled={isSaving}>
          {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

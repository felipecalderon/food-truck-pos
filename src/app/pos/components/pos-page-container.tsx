'use client'

import { useState, useMemo } from 'react';
import type { Product, CartItem } from '@/app/pos/types';
import { ProductList } from './product-list';
import { ShoppingCart } from './shopping-cart';
import { Input } from '@/components/ui/input';

interface POSPageContainerProps {
  initialProducts: Product[];
}

export function POSPageContainer({ initialProducts }: POSPageContainerProps) {
  const [products] = useState<Product[]>(initialProducts);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.sku === product.sku);
      if (existingItem) {
        return prevCart.map((item) =>
          item.sku === product.sku
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (sku: number, quantity: number) => {
    if (quantity <= 0) {
      setCart((prevCart) => prevCart.filter((item) => item.sku !== sku));
    } else {
      setCart((prevCart) =>
        prevCart.map((item) =>
          item.sku === sku ? { ...item, quantity } : item
        )
      );
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    return products.filter(p => 
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toString().includes(searchTerm)
    );
  }, [products, searchTerm]);

  return (
    <main className="grid md:grid-cols-2 gap-8 p-6">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Productos Disponibles</h2>
          <div className="w-64">
            <Input 
              placeholder="Buscar por nombre o SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <ProductList products={filteredProducts} handleAddToCart={handleAddToCart} />
      </div>
      <ShoppingCart cart={cart} handleUpdateQuantity={handleUpdateQuantity} clearCart={clearCart} />
    </main>
  );
}
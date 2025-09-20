# Análisis del Proyecto: Carrito de Compras POS

Este documento proporciona un análisis detallado de la estructura y tecnologías del proyecto "carrito".

## Resumen

El proyecto es una aplicación web de **Punto de Venta (POS)** construida con Next.js y TypeScript. Su propósito es permitir la gestión de un carrito de compras, la visualización de productos y el seguimiento de las ventas. Utiliza una arquitectura moderna basada en componentes y Server Actions para la lógica de backend.

## Tecnologías Principales

- **Framework**: [Next.js](https://nextjs.org/) (con App Router)
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/)
- **Gestor de Paquetes**: [pnpm](https://pnpm.io/)
- **Base de Datos / Caché**: [Redis](https://redis.io/), gestionado a través de `src/lib/redis.ts`.
- **Estilos**: CSS modular y global, probablemente utilizando [Tailwind CSS](https://tailwindcss.com/) (inferido por `postcss.config.mjs` y `globals.css`).
- **Componentes UI**: Un sistema de componentes personalizados ubicado en `src/components/ui`, similar a la arquitectura de [Shadcn/UI](https://ui.shadcn.com/).
- **Servidor**: Puede incluir un servidor Node.js personalizado (`server.js`) para tareas específicas de backend además de las capacidades de Next.js.

## Estructura de Directorios Clave

A continuación se detalla la función de los directorios y archivos más importantes dentro de `src/`:

- **`src/app/`**: Corazón de la aplicación Next.js (App Router).
  - `layout.tsx`: Layout principal que envuelve todas las páginas.
  - `page.tsx`: Página de inicio de la aplicación, probablemente la interfaz principal del POS.
  - `sales/page.tsx`: Página dedicada a mostrar la lista de ventas realizadas.
  - `total/page.tsx`: Página para mostrar un resumen o total de las ventas.

- **`src/actions/`**: Contiene los [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations).
  - `products.ts`: Funciones para obtener, crear o modificar productos.
  - `sales.ts`: Funciones para procesar y registrar las ventas.

- **`src/components/`**: Componentes de React que forman la interfaz de usuario.
  - `ui/`: Componentes de bajo nivel y reutilizables (Button, Card, Input, etc.).
  - `product-list.tsx`: Muestra la lista de productos disponibles.
  - `shopping-cart.tsx`: Gestiona y muestra los ítems en el carrito de compras.
  - `sales-list.tsx`: Muestra el historial de ventas.

- **`src/lib/`**: Librerías, helpers y configuraciones de servicios externos.
  - `redis.ts`: Lógica para conectar y comunicarse con la base de datos Redis.
  - `utils.ts`: Funciones de utilidad generales para el proyecto.

- **`src/stores/`**: Gestión de estado del lado del cliente.
  - `cart.ts`: Probablemente un store (usando Zustand, Jotai o React Context) para gestionar el estado del carrito en tiempo real en el navegador.

- **`src/types/`**: Definiciones de tipos de TypeScript para los modelos de datos.
  - `cart.ts`, `product.ts`, `sale.ts`: Interfaces que definen la estructura de los datos, asegurando la consistencia en todo el proyecto.

- **`public/`**: Almacena todos los activos estáticos como imágenes (`.svg`) y otros archivos que se sirven directamente al cliente.

## Gestión de Caja (POS)

Se ha implementado un sistema integral para la gestión de apertura y cierre de caja, asegurando la trazabilidad de las operaciones en efectivo.

### Funcionalidad Principal

- **Apertura de Caja**: El usuario debe iniciar una sesión de caja introduciendo un saldo inicial. Mientras la caja no esté abierta, no se pueden procesar nuevas ventas.
- **Registro de Ventas**: Cada venta realizada (con `createSaleInRedis`) se asocia a la sesión de caja abierta, actualizando en tiempo real el monto de `calculatedSales` en Redis.
- **Cierre de Caja**: Al final del turno, el usuario puede cerrar la caja. El sistema presenta un resumen con el saldo inicial, el total de ventas registrado y el monto esperado en caja. El usuario introduce el monto final contado y el sistema calcula la diferencia (sobrante o faltante).
- **Persistencia y Auditoría**: El estado de la caja se gestiona en Redis. Las sesiones cerradas se mueven a un historial para permitir auditorías futuras.

### Componentes y Archivos Clave

- **`src/types/cash-register.ts`**: Define la interfaz `CashRegisterSession`, que es el modelo de datos para una sesión de caja.
- **`src/actions/cash-register.ts`**: Contiene las Server Actions para la lógica de negocio:
    - `openCashRegister`: Inicia una nueva sesión.
    - `getCurrentSession`: Obtiene el estado de la caja actual.
    - `closeCashRegister`: Finaliza la sesión y la archiva.
- **`src/actions/sales.ts` (Modificado)**: La acción `createSaleInRedis` fue actualizada para verificar el estado de la caja y registrar el monto de la venta en la sesión activa.
- **`src/components/cash-register-manager.tsx`**: Componente de UI que renderiza los botones "Abrir/Cerrar Caja" y gestiona los diálogos para la interacción del usuario.
- **`src/components/cash-register-status.tsx`**: Componente de servidor que se muestra en el `header` y refleja el estado actual de la caja ("Abierta" o "Cerrada").

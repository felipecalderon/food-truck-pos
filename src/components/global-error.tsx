"use client";

import { ReactNode, useEffect } from "react";
import { Button } from "@/components/ui/button";
interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps): ReactNode {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <h2 className="text-2xl font-bold mb-4">¡Algo salió mal!</h2>
      <p className="text-red-500 mb-8">{error.message}</p>
      <Button onClick={() => reset()}>Intentar de nuevo</Button>
    </div>
  );
}

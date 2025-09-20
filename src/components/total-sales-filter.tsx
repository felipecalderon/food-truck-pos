 
'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from './ui/button';

export function TotalSalesFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleFilterChange = (range: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('range', range);
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 mb-4">
      <Button
        variant={searchParams.get('range') === 'today' ? 'secondary' : 'outline'}
        onClick={() => handleFilterChange('today')}
      >
        Hoy
      </Button>
      <Button
        variant={searchParams.get('range') === 'week' ? 'secondary' : 'outline'}
        onClick={() => handleFilterChange('week')}
      >
        Esta Semana
      </Button>
      <Button
        variant={searchParams.get('range') === 'month' ? 'secondary' : 'outline'}
        onClick={() => handleFilterChange('month')}
      >
        Este Mes
      </Button>
    </div>
  );
}

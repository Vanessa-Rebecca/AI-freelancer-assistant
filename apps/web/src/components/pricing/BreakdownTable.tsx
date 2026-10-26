import { formatMoney } from '@afa/shared';
import { cn } from '../../lib/cn.ts';
import type { PriceLine } from './priceLines.ts';

export function BreakdownTable({ lines, currency }: { lines: PriceLine[]; currency: string }) {
  return (
    <table className="w-full text-sm">
      <caption className="sr-only">Price breakdown</caption>
      <tbody>
        {lines.map((l, i) => (
          <tr
            key={i}
            className={cn(
              l.kind === 'line' && 'text-muted',
              l.kind === 'subtotal' && 'border-t border-border font-medium',
              l.kind === 'total' && 'border-t-2 border-foreground/20 text-lg font-semibold',
            )}
          >
            {/* Row headers are bold by default; only Subtotal and Total should stand out */}
            <th
              scope="row"
              className={cn(
                'py-2 pr-4 text-left',
                l.kind === 'line' && 'font-normal',
                l.kind === 'subtotal' && 'font-medium',
                l.kind === 'total' && 'font-semibold',
              )}
            >
              {l.label}
            </th>
            {/* tabular-nums lines the digits up in a column */}
            <td className="py-2 text-right whitespace-nowrap tabular-nums">
              {formatMoney(l.amount, currency)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

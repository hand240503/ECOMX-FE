import { Check } from 'lucide-react';
import { cn } from '../../lib/cn';

const ORANGE = '#e67e22';

/** Ô chọn sidebar: chưa chọn viền xám; đã chọn nền cam, tick trắng. */
export function FilterFacetCheckbox({
  checked,
  className,
}: {
  checked: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[3px] border transition-[border-color,background-color,box-shadow] duration-150',
        checked
          ? 'border-transparent text-white shadow-sm'
          : 'border-neutral-300 bg-white',
        className
      )}
      style={checked ? { backgroundColor: ORANGE } : undefined}
      aria-hidden
    >
      {checked && (
        <Check className="h-3.5 w-3.5 stroke-[2.75]" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </span>
  );
}

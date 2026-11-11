import { formatCategory } from '@/lib/format'
import { cn } from '@/lib/utils'

type CategoryFilterProps = {
  categories: string[]
  selected: string | undefined
  onSelect: (category: string | undefined) => void
}

const CHIP =
  'inline-flex h-11 items-center rounded-full border px-4 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

export function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  const options = [undefined, ...categories]
  return (
    <div role="group" aria-label="Filter kategori" className="flex flex-wrap gap-2">
      {options.map((category) => {
        const isSelected = category === selected
        return (
          <button
            key={category ?? 'all'}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(category)}
            className={cn(
              CHIP,
              isSelected
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input bg-background hover:bg-muted',
            )}
          >
            {category === undefined ? 'Semua' : formatCategory(category)}
          </button>
        )
      })}
    </div>
  )
}

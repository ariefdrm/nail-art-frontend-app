import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Input } from '@/components/ui/input'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

const DEBOUNCE_MS = 300

type SearchBoxProps = {
  /** The value currently in the URL. Remount (change `key`) to reset it from outside. */
  value: string
  onChange: (value: string) => void
}

export function SearchBox({ value, onChange }: SearchBoxProps) {
  const [text, setText] = useState(value)
  const debounced = useDebouncedValue(text, DEBOUNCE_MS)

  useEffect(() => {
    if (debounced !== value) onChange(debounced)
  }, [debounced, value, onChange])

  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        type="search"
        aria-label="Cari reservasi"
        placeholder="Cari nama, nomor HP, atau kode"
        value={text}
        onChange={(event) => setText(event.target.value)}
        className="h-9 pl-9"
      />
    </div>
  )
}

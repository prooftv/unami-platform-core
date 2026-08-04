import type { SanityBlock } from '@/lib/sanity/types'

export function PortableText({ value }: { value: SanityBlock[] }) {
  return (
    <div className="space-y-4">
      {value.map((block) => {
        const text = block.children?.map((c) => c.text).join('') ?? ''
        if (block.style === 'h2') {
          return <h2 key={block._key} className="font-semibold text-foreground">{text}</h2>
        }
        return <p key={block._key} className="text-sm text-muted-foreground leading-relaxed">{text}</p>
      })}
    </div>
  )
}

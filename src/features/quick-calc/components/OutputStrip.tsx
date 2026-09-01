import type { QuickView } from '../viewModel.ts'

type OutputStripProps = {
  outputs: QuickView['outputs']
}

export function OutputStrip({ outputs }: OutputStripProps) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-5 lg:grid-cols-4 lg:gap-0">
      {outputs.map((output, index) => (
        <div
          key={output.label}
          className="lg:border-r lg:border-[#E3E5E8] lg:pr-4 lg:pl-4 first:lg:pl-0 last:lg:border-r-0"
          style={index === outputs.length - 1 ? { borderRightColor: 'transparent' } : undefined}
        >
          <div className="min-h-8 text-xs leading-snug text-[#5B6169] lg:min-h-[34px]">{output.label}</div>
          <div className="font-mono text-xl tabular-nums tracking-tight text-[#16181C] lg:text-[22px]">
            {output.value}
            {output.unit ? <span className="text-[13px] text-[#8A9199]"> {output.unit}</span> : null}
          </div>
        </div>
      ))}
    </div>
  )
}

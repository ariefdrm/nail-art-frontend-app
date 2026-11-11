const STEPS = [
  { title: 'Pilih layanan', body: 'Lihat daftar layanan dan harganya, lalu pilih yang Anda mau.' },
  { title: 'Pilih jam', body: 'Hanya jam yang masih kosong yang ditampilkan.' },
  { title: 'Isi data', body: 'Cukup nama dan nomor HP. Tanpa akun, tanpa kata sandi.' },
] as const

/** A real sequence, so the numbering carries meaning. */
export function HowToOrder() {
  return (
    <section className="border-t border-border py-16 md:py-24" aria-labelledby="steps-title">
      <h2 id="steps-title" className="mb-8 text-2xl font-semibold tracking-tight">
        Cara memesan
      </h2>
      <ol className="grid gap-8 md:grid-cols-3 md:gap-12">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex gap-4 md:block">
            <span className="text-4xl leading-none font-semibold tracking-tight text-muted-foreground tabular-nums md:mb-4 md:block">
              {index + 1}
            </span>
            <div>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="mt-1 max-w-prose text-muted-foreground">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

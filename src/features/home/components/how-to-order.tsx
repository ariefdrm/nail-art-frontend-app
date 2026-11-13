import { Reveal } from '@/components/common/reveal'

const STEPS = [
  { title: 'Pilih layanan', body: 'Lihat daftar layanan dan harganya, lalu pilih yang Anda mau.' },
  { title: 'Pilih jam', body: 'Hanya jam yang masih kosong yang ditampilkan.' },
  { title: 'Isi data', body: 'Cukup nama dan nomor HP. Tanpa akun, tanpa kata sandi.' },
  {
    title: 'Tunggu konfirmasi',
    body: 'Pemilik studio mengonfirmasi pesanan. Cek statusnya kapan saja dengan kode booking.',
  },
] as const

/** A real sequence, so the numbering carries meaning. */
export function HowToOrder() {
  return (
    <section className="border-t border-border py-16 md:py-24" aria-labelledby="steps-title">
      <h2 id="steps-title" className="font-display text-3xl font-medium tracking-tight md:text-5xl">
        Empat langkah, selesai.
      </h2>
      <ol className="mt-12 grid gap-10 md:grid-cols-4 md:gap-8">
        {STEPS.map((step, index) => (
          <li key={step.title}>
            <Reveal index={index}>
              <div
                className="draw h-0.5 bg-foreground"
                style={{ '--i': index } as React.CSSProperties}
              />
              <div className="pt-5">
                <span
                  aria-hidden
                  className="font-display text-5xl leading-none font-medium tracking-tight tabular-nums"
                >
                  {index + 1}
                </span>
                <h3 className="mt-6 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-muted-foreground">{step.body}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  )
}

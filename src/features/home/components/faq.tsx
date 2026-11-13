import { ChevronDown } from 'lucide-react'

const ITEMS = [
  {
    question: 'Apakah saya perlu membuat akun?',
    answer:
      'Tidak. Cukup nama dan nomor HP. Nomor boleh ditulis 08..., 62..., atau +62...; kami menyeragamkannya untuk Anda.',
  },
  {
    question: 'Bagaimana saya tahu pesanan saya diterima?',
    answer:
      'Setelah mengirim, Anda mendapat kode booking dengan status "Menunggu konfirmasi". Pemilik studio akan mengonfirmasinya, dan Anda bisa mengecek perubahan status di halaman Cek booking.',
  },
  {
    question: 'Bagaimana cara mengecek atau membatalkan pesanan?',
    answer:
      'Buka Cek booking, lalu masukkan kode booking dan nomor HP yang Anda pakai saat memesan.',
  },
  {
    question: 'Bisakah saya memilih artist tertentu?',
    answer:
      'Bisa. Di langkah memilih jam, buka "Pilih artist". Jika tidak dipilih, studio menugaskan artist yang tersedia.',
  },
  {
    question: 'Jam yang saya mau tidak tersedia, bagaimana?',
    answer:
      'Coba tanggal lain; hanya jam kosong yang ditampilkan. Jika jam yang Anda pilih keburu diambil orang lain, Anda akan diminta memilih jam lagi.',
  },
] as const

export function Faq() {
  return (
    <section
      className="grid gap-10 border-t border-border py-16 md:py-24 lg:grid-cols-[1fr_1.6fr] lg:gap-20"
      aria-labelledby="faq-title"
    >
      <h2 id="faq-title" className="font-display text-3xl font-medium tracking-tight md:text-5xl">
        Pertanyaan yang sering muncul
      </h2>
      <div className="border-b border-border">
        {ITEMS.map((item) => (
          <details key={item.question} className="faq-item group border-t border-border">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-md py-4 text-left font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
              {item.question}
              <ChevronDown
                className="size-5 shrink-0 transition-transform duration-300 group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <p className="max-w-prose pb-5 text-muted-foreground">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

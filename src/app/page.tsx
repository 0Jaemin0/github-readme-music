import { AudioLines } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'
import { CardGenerator } from '@/features/card-generator/components/CardGenerator'

export default function Page() {
  return (
    <div className="min-h-dvh">
      <header>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-6">
          <Link href="/" className="flex items-center gap-2" aria-label="github-readme-music 홈">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <AudioLines className="size-4" aria-hidden="true" />
            </span>
            <span className="font-mono text-[13px] font-semibold tracking-[-0.02em]">github-readme-music</span>
          </Link>
          <nav className="flex items-center" aria-label="보조 메뉴">
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-3xl px-5 pb-4 pt-16 text-center sm:pt-24">
          <h1 className="text-balance text-[2rem] font-semibold leading-[1.16] tracking-[-0.04em] sm:text-[3.25rem]">
            좋아하는 음악을,
            <br />
            <span className="text-primary">README에 남겨보세요.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-7 text-muted-foreground sm:max-w-none sm:text-base">
            YouTube 링크 하나로, 나를 소개하는 음악 카드를 만들어 README에 남겨보세요.
          </p>
        </section>

        <section className="mx-auto max-w-3xl px-5 pb-24 pt-8">
          <CardGenerator />
        </section>
      </main>

    </div>
  )
}

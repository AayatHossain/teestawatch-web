import { Logo } from './Nav'

export default function Footer() {
  return (
    <footer className="relative mt-32 border-t border-white/5">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 py-12 md:flex-row">
        <Logo />
        <a
          href="https://github.com/AayatHossain/teestawatch"
          target="_blank"
          rel="noreferrer"
          className="text-center text-sm text-slate-500 transition hover:text-slate-300"
        >
          Models and data pipeline on GitHub
        </a>
        <p className="text-sm text-slate-500">Built with NASA Earth data</p>
      </div>
    </footer>
  )
}

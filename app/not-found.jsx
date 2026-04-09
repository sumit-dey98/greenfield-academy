import Link from "next/link"
import { GraduationCap, Home, LayoutDashboard } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg px-6 text-center">

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mb-12">
        <div className="w-20 20 rounded-md flex items-center justify-center text-white shrink-0">
          <img src="/assets/images/logo.png" alt="Greenfield Academy Logo" />
        </div>
        <span className="text-3xl font-bold text-text text-left leading-tight">
          Greenfield<span className="text-primary block">Academy</span>
        </span>
      </Link>

      {/* 404 */}
      <div className="relative mb-6 select-none">
        <span className="text-[10rem] font-black leading-none text-surface-2">404</span>
        <span className="absolute inset-0 flex items-center justify-center text-[10rem] font-black leading-none text-primary opacity-10 blur-sm">
          404
        </span>
      </div>

      <h1 className="text-2xl font-bold text-text mb-3">Page not found</h1>
      <p className="text-muted text-sm max-w-lg leading-relaxed mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>

      <div className="flex items-center gap-3">
        <Link href="/" className="btn btn-primary">
          <Home size={15} /> Home
        </Link>
        <Link href="/login?tab=student" className="btn btn-outline">
          <LayoutDashboard size={15} /> Portal
        </Link>
      </div>

    </div>
  )
}
import Link from "next/link"
import { GraduationCap, MapPin, Phone, Mail } from "lucide-react"

const links = {
  "Quick Links": [
    { label: "Home", href: "/" },
    { label: "Events", href: "/events" },
    { label: "Notices", href: "/notices" },
    { label: "Admin Panel", href: "/admin/login" },
  ]
}

export default function Footer() {
  return (
    <footer className="bg-sidebar border-t border-border text-sidebar-text pt-10 md:pt-16 pb-8 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Grid container */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-8 md:gap-12 mb-8 md:mb-12">
          {/* Brand section */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-md flex items-center justify-center">
                <img src="/assets/images/logo.png" alt="Greenfield Academy Logo" />
              </div>
              <span className="font-bold text-lg text-white">Greenfield Academy</span>
            </div>
            
            <div className="flex flex-col gap-2.5">
              {[
                { icon: <MapPin size={14} />, text: "123 Education Lane, Dhaka" },
                { icon: <Phone size={14} />, text: "+880-2-9876543" },
                { icon: <Mail size={14} />, text: "info@greenfieldacademy.edu.bd" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm opacity-70">
                  <span className="text-primary shrink-0">{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>
          </div>

          {/* Link sections */}
          {Object.entries(links).map(([title, items]) => (
            <div key={title}>
              <h4 className="text-white font-semibold text-xs uppercase tracking-wide mb-4">
                {title}
              </h4>
              <ul className="list-none flex flex-col gap-2.5">
                {items.map(item => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm opacity-70 hover:opacity-100 transition-opacity duration-200 no-underline text-inherit"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex justify-between items-center flex-wrap gap-4 text-xs opacity-50">
          <span>© {new Date().getFullYear()} Greenfield Academy. All rights reserved.</span>
          <span >
            Built by <Link href="https://sumithilloldey.vercel.app" target="_blank" className="underline hover:text-bg">Sumit Hillol Dey </Link>
          </span>
        </div>
      </div>
    </footer>
  )
}
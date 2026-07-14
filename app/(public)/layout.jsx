import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Navbar />
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer />
    </div>
  )
}

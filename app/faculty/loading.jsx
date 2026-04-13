import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"

function FacultyCardSkeleton() {
  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-surface-2 animate-pulse shrink-0" />
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <div className="h-4 w-3/4 rounded bg-surface-2 animate-pulse" />
          <div className="h-3 w-1/2 rounded bg-surface-2 animate-pulse" />
          <div className="h-5 w-16 rounded-full bg-surface-2 animate-pulse" />
        </div>
      </div>

      <div className="h-px bg-border" />

      <div className="flex flex-col gap-2">
        <div className="h-4 w-full rounded bg-surface-2 animate-pulse" />
        <div className="h-4 w-2/3 rounded bg-surface-2 animate-pulse" />
        <div className="h-4 w-1/2 rounded bg-surface-2 animate-pulse" />
      </div>

      <div className="h-3 w-32 rounded bg-surface-2 animate-pulse mt-auto pt-2 border-t border-border" />
    </div>
  )
}

export default function FacultyLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Navbar />
      <main className="flex-1">

        {/* Hero skeleton */}
        <section className="bg-surface border-b border-border py-10 md:py-20 px-6 md:px-12">
          <div className="max-w-4xl mx-auto flex flex-col items-center gap-4">
            <div className="h-6 w-28 rounded-full bg-surface-2 animate-pulse" />
            <div className="h-10 w-64 rounded bg-surface-2 animate-pulse" />
            <div className="h-4 w-96 rounded bg-surface-2 animate-pulse" />
            <div className="h-4 w-80 rounded bg-surface-2 animate-pulse" />
            <div className="flex items-center gap-10 mt-6 pt-6 border-t border-border w-full justify-center flex-wrap">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="h-8 w-12 rounded bg-surface-2 animate-pulse" />
                  <div className="h-3 w-24 rounded bg-surface-2 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Leadership skeleton */}
        <section className="py-10 md:py-20 px-6 md:px-12 bg-bg">
          <div className="max-w-5xl mx-auto flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <div className="h-6 w-24 rounded-full bg-surface-2 animate-pulse" />
              <div className="h-7 w-48 rounded bg-surface-2 animate-pulse" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <FacultyCardSkeleton key={i} />)}
            </div>
          </div>
        </section>

        {/* Teaching staff skeleton */}
        <section className="py-10 md:py-20 px-6 md:px-12 bg-surface border-t border-border">
          <div className="max-w-5xl mx-auto flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <div className="h-6 w-28 rounded-full bg-surface-2 animate-pulse" />
              <div className="h-7 w-36 rounded bg-surface-2 animate-pulse" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => <FacultyCardSkeleton key={i} />)}
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  )
}
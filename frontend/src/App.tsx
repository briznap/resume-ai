import type { ReactNode } from 'react'
import { Nav } from './components/layout/Nav'
import { Hero } from './components/layout/Hero'
import { useResume } from './hooks/useResume'

export default function App() {
  const { data, loading, error } = useResume()

  if (loading) {
    return <FullScreenMessage>Loading…</FullScreenMessage>
  }

  if (error || !data) {
    return (
      <FullScreenMessage>
        Couldn’t load resume data{error ? ` — ${error}` : ''}.
      </FullScreenMessage>
    )
  }

  return (
    <>
      <Nav resume={data} />
      <main>
        <Hero resume={data} />
        <div className="section-separator" />
        {/* Content sections (Experience, Skills, Projects, Education,
            UnderTheHood) are added in step 5. */}
      </main>
    </>
  )
}

function FullScreenMessage({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center px-6 text-center text-sm text-text-secondary">
      {children}
    </div>
  )
}

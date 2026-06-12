import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="container flex max-w-4xl flex-col items-center gap-8 px-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          OHh-Finance
        </h1>
        <p className="text-lg text-muted-foreground sm:text-xl">
          Household budgeting and financial tracking made simple
        </p>
        <div className="flex gap-4">
          <Button asChild size="lg">
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/register">Get Started</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

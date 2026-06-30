import Navbar from './Navbar'
import Hero from './Hero'
import Features from './Features'
import HowItWorks from './HowItWorks'
import Benefits from './Benefits'
import Testimonials from './Testimonials'
import CTA from './CTA'
import Footer from './Footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Benefits />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}

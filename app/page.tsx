'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Phone, BarChart3, Users, Shield, Workflow, Database, ArrowRight } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null)
  const heroContentRef = useRef<HTMLDivElement>(null)
  const heroImageRef = useRef<HTMLDivElement>(null)
  const featuresTitleRef = useRef<HTMLDivElement>(null)
  const featuresCardsRef = useRef<HTMLDivElement>(null)
  const stepsRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Hero animations
    if (heroContentRef.current && heroImageRef.current) {
      gsap.fromTo(
        heroContentRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
        }
      )
      gsap.fromTo(
        heroImageRef.current,
        { opacity: 0, scale: 0.9 },
        {
          opacity: 1,
          scale: 1,
          duration: 1,
          delay: 0.2,
          ease: 'power3.out',
        }
      )
    }

    // Features section
    if (featuresTitleRef.current) {
      gsap.fromTo(
        featuresTitleRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          scrollTrigger: {
            trigger: featuresTitleRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        }
      )
    }

    if (featuresCardsRef.current) {
      const cards = featuresCardsRef.current.children
      gsap.fromTo(
        cards,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: featuresCardsRef.current,
            start: 'top 75%',
            toggleActions: 'play none none none',
          },
        }
      )
    }

    // Steps section
    if (stepsRef.current) {
      const steps = stepsRef.current.children
      gsap.fromTo(
        steps,
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.7,
          stagger: 0.15,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: stepsRef.current,
            start: 'top 75%',
            toggleActions: 'play none none none',
          },
        }
      )
    }

    // CTA section
    if (ctaRef.current) {
      gsap.fromTo(
        ctaRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          scrollTrigger: {
            trigger: ctaRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        }
      )
    }

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
    }
  }, [])

  return (
    <div className="min-h-screen">
      {/* Simple Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="text-xl font-semibold">
              CONNEXT AI
            </Link>
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main>
      {/* Hero Section */}
      <section className="relative border-b border-border/40">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/30" />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-20 lg:gap-24 py-24 lg:py-32">
            {/* Left: Content */}
            <div ref={heroContentRef} className="flex-1 w-full lg:w-1/2 space-y-8">
              <div className="space-y-6">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground">
                  Headless CRM &<br />
                  <span className="text-primary">AI Agent Builder</span>
                </h1>
                <p className="text-xl sm:text-2xl text-muted-foreground leading-relaxed max-w-2xl">
                  Enterprise-grade voice AI infrastructure that bridges intelligent automation with your business data.
                </p>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
                Deploy sophisticated voice agents in minutes. Automate call handling, lead qualification, and data collection. 
                All conversations, insights, and leads flow directly into your unified dashboard.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button asChild size="lg" className="h-12 px-8 text-base font-medium">
                  <Link href="/signup">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base font-medium">
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
            </div>

            {/* Right: Image */}
            <div className="flex-1 w-full lg:w-1/2">
              <div ref={heroImageRef} className="relative w-full aspect-square max-w-xl mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl" />
                <Image
                  src="/image-connext.png"
                  alt="CONNEXT AI Platform"
                  fill
                  className="object-contain relative z-10"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 lg:py-32 border-b border-border/40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div ref={featuresTitleRef} className="max-w-3xl mx-auto text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
              Enterprise-Ready Infrastructure
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Built for scale, designed for simplicity. Everything you need to deploy and manage AI voice agents at enterprise scale.
            </p>
          </div>

          <div ref={featuresCardsRef} className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            <Card className="border-border/50 hover:border-border transition-colors">
              <CardContent className="pt-8 pb-8">
                <div className="mb-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 tracking-tight">24/7 Call Handling</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Intelligent voice agents handle inbound calls around the clock. Never miss a lead, regardless of timezone or business hours.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:border-border transition-colors">
              <CardContent className="pt-8 pb-8">
                <div className="mb-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Database className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 tracking-tight">Automated Data Collection</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Structured data extraction from every conversation. Names, contact information, requirements, and custom fields captured automatically.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:border-border transition-colors">
              <CardContent className="pt-8 pb-8">
                <div className="mb-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 tracking-tight">Real-Time Dashboard</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Unified view of all conversations, leads, and performance metrics. Real-time updates with full call recordings and transcripts.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:border-border transition-colors">
              <CardContent className="pt-8 pb-8">
                <div className="mb-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Workflow className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 tracking-tight">Workflow Automation</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Pre-built n8n blueprints for seamless integration. Automate lead routing, notifications, and data synchronization with your existing tools.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:border-border transition-colors">
              <CardContent className="pt-8 pb-8">
                <div className="mb-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 tracking-tight">No-Code Configuration</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Deploy production-ready agents through an intuitive interface. No engineering resources required for setup or maintenance.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:border-border transition-colors">
              <CardContent className="pt-8 pb-8">
                <div className="mb-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 tracking-tight">Data Ownership & Security</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Complete data sovereignty. All conversations and leads stored in your infrastructure with enterprise-grade security and compliance.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 lg:py-32 border-b border-border/40 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
              Deployment in Minutes
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Three-step process from configuration to production deployment
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div ref={stepsRef} className="grid md:grid-cols-3 gap-12">
              <div className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full border-2 border-primary bg-primary/5 flex items-center justify-center text-lg font-semibold text-primary mb-6">
                    01
                  </div>
                  <h3 className="text-xl font-semibold mb-4 tracking-tight">Configure Agent</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Define your business context, conversation flow, and data requirements through our guided configuration interface.
                  </p>
                </div>
                <div className="hidden md:block absolute top-7 left-full w-full h-0.5 bg-border/50 translate-x-6" />
              </div>

              <div className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full border-2 border-primary bg-primary/5 flex items-center justify-center text-lg font-semibold text-primary mb-6">
                    02
                  </div>
                  <h3 className="text-xl font-semibold mb-4 tracking-tight">Provision Infrastructure</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Automated provisioning of phone numbers, voice infrastructure, and integration endpoints. Ready for production traffic.
                  </p>
                </div>
                <div className="hidden md:block absolute top-7 left-full w-full h-0.5 bg-border/50 translate-x-6" />
              </div>

              <div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full border-2 border-primary bg-primary/5 flex items-center justify-center text-lg font-semibold text-primary mb-6">
                    03
                  </div>
                  <h3 className="text-xl font-semibold mb-4 tracking-tight">Monitor & Optimize</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Real-time analytics, call recordings, and lead management. Continuously optimize performance through data-driven insights.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div ref={ctaRef} className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-6">
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
                Ready to Deploy?
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                Start building your voice AI infrastructure today. Enterprise features available from day one.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button asChild size="lg" className="h-12 px-8 text-base font-medium">
                <Link href="/signup">
                  Create Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base font-medium">
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      </main>
    </div>
  )
}


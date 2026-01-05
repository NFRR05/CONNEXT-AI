"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Menu,
  X,
  ArrowRight,
  ChevronRight,
  Mail,
  MapPin,
  Phone,
  Instagram,
  Twitter,
  Linkedin,
  Github,
  ArrowUpRight,
  Sparkles,
  Zap,
  Phone as PhoneIcon,
  Database,
  BarChart3,
  Workflow,
  Users,
  Shield,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { InfiniteGrid } from "@/components/ui/infinite-grid-integration"

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemFadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
}

export function ConnextLandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <div className="flex min-h-screen flex-col relative">
      {/* Infinite Grid Background */}
      <InfiniteGrid />
      
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={`sticky top-0 z-50 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-background/0 ${scrollY > 50 ? "shadow-md" : ""}`}
      >
        <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center space-x-3">
              <span className="font-bold text-xl tracking-tight">CONNEXT AI</span>
            </Link>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="#services" className="text-sm font-medium transition-colors hover:text-primary">
              Services
            </Link>
            <Link href="#about" className="text-sm font-medium transition-colors hover:text-primary">
              How It Works
            </Link>
            <Link href="#contact" className="text-sm font-medium transition-colors hover:text-primary">
              Contact
            </Link>
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
          <button className="flex md:hidden" onClick={toggleMenu}>
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </button>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 md:hidden"
        >
          <div className="container flex h-16 items-center justify-between px-4">
            <Link href="/" className="flex items-center space-x-3">
              <span className="font-bold text-xl tracking-tight">CONNEXT AI</span>
            </Link>
            <button onClick={toggleMenu}>
              <X className="h-6 w-6" />
              <span className="sr-only">Close menu</span>
            </button>
          </div>
          <motion.nav
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="container grid gap-3 px-4 pb-8 pt-6"
          >
            {[
              { label: "Services", href: "#services" },
              { label: "How It Works", href: "#about" },
              { label: "Contact", href: "#contact" }
            ].map((item, index) => (
              <motion.div key={index} variants={itemFadeIn}>
                <Link
                  href={item.href}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-lg font-medium hover:bg-accent"
                  onClick={toggleMenu}
                >
                  {item.label}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </motion.div>
            ))}
            <motion.div variants={itemFadeIn} className="flex flex-col gap-3 pt-4">
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild className="w-full">
                <Link href="/signup">Get Started</Link>
              </Button>
            </motion.div>
          </motion.nav>
        </motion.div>
      )}

      <main className="flex-1 relative z-10">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 overflow-hidden">
          <div className="container px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false }}
                variants={fadeIn}
                className="flex flex-col justify-center space-y-6 text-center"
              >
                <div className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center rounded-full bg-muted px-4 py-2 text-sm"
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    Enterprise AI Infrastructure Platform
                  </motion.div>
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="text-4xl font-bold tracking-tight sm:text-5xl xl:text-6xl/none"
                  >
                    Headless CRM &{" "}
                    <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                      AI Agent Builder
                    </span>
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.4 }}
                    className="max-w-3xl mx-auto text-xl text-muted-foreground leading-relaxed"
                  >
                    Enterprise-grade AI infrastructure service that bridges intelligent automation with your business data.
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.5 }}
                    className="max-w-3xl mx-auto text-lg text-muted-foreground leading-relaxed"
                  >
                    Deploy sophisticated voice agents with custom infrastructure. Automate call handling, lead qualification, and data collection. 
                    All conversations, insights, and leads flow directly into your unified dashboard.
                  </motion.p>
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.6 }}
                  className="flex flex-col gap-4 sm:flex-row justify-center"
                >
                  <Button asChild size="lg" className="h-12 px-8 text-base font-medium group">
                    <Link href="/signup">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base font-medium">
                    <Link href="/login">Sign In</Link>
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="w-full py-12 md:py-24 lg:py-32 border-t border-border/40">
          <div className="container px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: false }}
                  transition={{ duration: 0.5 }}
                  className="inline-block rounded-full bg-muted px-4 py-2 text-sm"
                >
                  Services
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
                >
                  Enterprise-Ready Infrastructure
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="mx-auto max-w-[900px] text-xl text-muted-foreground leading-relaxed"
                >
                  Custom AI infrastructure built for scale. Enterprise-grade solutions to deploy and manage voice AI agents at scale.
                </motion.p>
              </div>
            </div>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false }}
              className="mx-auto grid max-w-7xl items-center gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {[
                {
                  icon: <PhoneIcon className="h-10 w-10 text-primary" />,
                  title: "24/7 Call Handling",
                  description:
                    "Intelligent voice agents handle inbound calls around the clock. Never miss a lead, regardless of timezone or business hours.",
                },
                {
                  icon: <Database className="h-10 w-10 text-primary" />,
                  title: "Automated Data Collection",
                  description:
                    "Structured data extraction from every conversation. Names, contact information, requirements, and custom fields captured automatically.",
                },
                {
                  icon: <BarChart3 className="h-10 w-10 text-primary" />,
                  title: "Real-Time Dashboard",
                  description:
                    "Unified view of all conversations, leads, and performance metrics. Real-time updates with full call recordings and transcripts.",
                },
                {
                  icon: <Workflow className="h-10 w-10 text-primary" />,
                  title: "Workflow Automation",
                  description:
                    "Custom n8n blueprints for seamless integration. Automate lead routing, notifications, and data synchronization with your existing tools.",
                },
                {
                  icon: <Users className="h-10 w-10 text-primary" />,
                  title: "No-Code Configuration",
                  description: "Deploy production-ready agents through an intuitive interface. No engineering resources required for setup or maintenance.",
                },
                {
                  icon: <Shield className="h-10 w-10 text-primary" />,
                  title: "Data Ownership & Security",
                  description:
                    "Complete data sovereignty. All conversations and leads stored in your infrastructure with enterprise-grade security and compliance.",
                },
              ].map((service, index) => (
                <motion.div
                  key={index}
                  variants={itemFadeIn}
                  whileHover={{ y: -10, transition: { duration: 0.3 } }}
                  className="group relative overflow-hidden rounded-2xl border border-border/50 p-6 shadow-sm transition-all hover:shadow-md bg-background/80"
                >
                  <div className="relative space-y-4">
                    <div className="mb-4">{service.icon}</div>
                    <h3 className="text-xl font-semibold tracking-tight">{service.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{service.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="about" className="w-full py-12 md:py-24 lg:py-32 border-t border-border/40 bg-muted/20">
          <div className="container px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: false }}
                  transition={{ duration: 0.5 }}
                  className="inline-block rounded-full bg-muted px-4 py-2 text-sm"
                >
                  How It Works
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
                >
                  Deployment in Minutes
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="mx-auto max-w-[900px] text-xl text-muted-foreground leading-relaxed"
                >
                  Three-step process from configuration to production deployment
                </motion.p>
              </div>
            </div>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false }}
              className="mx-auto grid max-w-5xl gap-12 md:grid-cols-3"
            >
              {[
                {
                  number: "01",
                  title: "Configure Agent",
                  description:
                    "Define your business context, conversation flow, and data requirements through our guided configuration interface.",
                },
                {
                  number: "02",
                  title: "Provision Infrastructure",
                  description:
                    "Automated provisioning of phone numbers, voice infrastructure, and integration endpoints. Ready for production traffic.",
                },
                {
                  number: "03",
                  title: "Monitor & Optimize",
                  description:
                    "Real-time analytics, call recordings, and lead management. Continuously optimize performance through data-driven insights.",
                },
              ].map((step, index) => (
                <motion.div
                  key={index}
                  variants={itemFadeIn}
                  className="relative flex flex-col items-center text-center"
                >
                  <div className="w-14 h-14 rounded-full border-2 border-primary bg-primary/5 flex items-center justify-center text-lg font-semibold text-primary mb-6">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-semibold mb-4 tracking-tight">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 border-t border-border/40">
          <div className="container px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false }}
              variants={fadeIn}
              className="max-w-4xl mx-auto text-center space-y-8"
            >
              <div className="space-y-6">
                <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
                  Ready to Deploy?
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                  Start building your voice AI infrastructure today. Enterprise features available from day one.
                </p>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row justify-center pt-4">
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
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="contact" className="w-full border-t relative z-10">
        <div className="container grid gap-8 px-4 py-10 sm:px-6 lg:px-8 lg:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-3">
              <span className="font-bold text-xl tracking-tight">CONNEXT AI</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Enterprise-grade voice AI infrastructure that bridges intelligent automation with your business data.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div>
              <h3 className="text-lg font-semibold mb-4">Platform</h3>
              <nav className="flex flex-col space-y-2 text-sm">
                <Link href="#services" className="text-muted-foreground hover:text-foreground">
                  Services
                </Link>
                <Link href="#about" className="text-muted-foreground hover:text-foreground">
                  How It Works
                </Link>
                <Link href="/login" className="text-muted-foreground hover:text-foreground">
                  Sign In
                </Link>
                <Link href="/signup" className="text-muted-foreground hover:text-foreground">
                  Get Started
                </Link>
              </nav>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <nav className="flex flex-col space-y-2 text-sm">
                <Link href="#" className="text-muted-foreground hover:text-foreground">
                  Documentation
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground">
                  API Reference
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground">
                  Support
                </Link>
              </nav>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact</h3>
            <p className="text-sm text-muted-foreground">
              Ready to get started? Get in touch with our team.
            </p>
          </div>
        </div>
        <div className="border-t">
          <div className="container flex flex-col items-center justify-between gap-4 px-4 py-6 sm:px-6 lg:px-8 md:h-16 md:flex-row md:py-0">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} CONNEXT AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}


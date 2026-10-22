import CompanyLogo from "@/features/directory/components/CompanyLogo"
import Button from "@/components/ui/Button"
import { ENABLE_TRADE_CREDIT } from "@/features/trade-credit/feature"
import Icon from "@/components/ui/Icon"
import PublicShell from "@/components/layout/PublicShell"
import SectionTitle from "@/components/ui/SectionTitle"
import SectionAccent from "@/components/ui/SectionAccent"
import Tag from "@/components/ui/Tag"
import type { View } from "@/types/View"
import { heroSlides } from "@/features/public/data/heroSlides"
import { mandates } from "@/features/public/data/mandates"
import { sampleMembers } from "@/features/directory/data/sampleMembers"
import { useEffect, useState } from "react"

export default function Home({ go }: { go: (v: View) => void }) {
  const [slide, setSlide] = useState(0)
  const [paused, setPaused] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const changeSlide = (next: number) =>
    setSlide((next + heroSlides.length) % heroSlides.length)
  useEffect(() => {
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches
    if (paused || reduceMotion) return
    const timer = window.setInterval(
      () => setSlide((current) => (current + 1) % heroSlides.length),
      6000,
    )
    return () => window.clearInterval(timer)
  }, [paused])
  return (
    <PublicShell go={go}>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            Internet Service Providers Association of Uganda
          </span>
          <h1>A shared voice for Uganda’s internet providers.</h1>
          <p>
            ISPAU convenes the organisations building and operating Uganda’s
            internet—advancing practical collaboration, stronger networks and
            responsible industry growth.
          </p>
          <div className="button-row">
            <Button onClick={() => go("apply")} icon="arrow">
              Apply for Membership
            </Button>
            <Button kind="secondary" onClick={() => go("services")}>
              Explore Our Work
            </Button>
          </div>
          <button className="text-link" onClick={() => go("login")}>
            Already a member? Sign in <Icon name="arrow" size={16} />
          </button>
        </div>
        <div
          className="hero-carousel"
          role="region"
          aria-roledescription="carousel"
          aria-label="Internet infrastructure and industry photography"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") changeSlide(slide - 1)
            if (event.key === "ArrowRight") changeSlide(slide + 1)
          }}
          onTouchStart={(event) =>
            setTouchStart(event.changedTouches[0].clientX)
          }
          onTouchEnd={(event) => {
            if (touchStart === null) return
            const distance = event.changedTouches[0].clientX - touchStart
            if (Math.abs(distance) > 45) {
              changeSlide(distance > 0 ? slide - 1 : slide + 1)
            }
            setTouchStart(null)
          }}
        >
          <div className="carousel-frame">
            {heroSlides.map((item, index) => (
              <figure
                className={`carousel-slide ${index === slide ? "active" : ""}`}
                aria-hidden={index !== slide}
                key={item.src}
              >
                <img src={item.src} alt={index === slide ? item.alt : ""} />
                <figcaption>
                  {item.caption} <span>Photo: {item.credit}</span>
                </figcaption>
              </figure>
            ))}
            <button
              className="carousel-arrow previous"
              aria-label="Previous image"
              onClick={() => changeSlide(slide - 1)}
            >
              ←
            </button>
            <button
              className="carousel-arrow next"
              aria-label="Next image"
              onClick={() => changeSlide(slide + 1)}
            >
              →
            </button>
            <div className="carousel-controls">
              <div className="carousel-dots" aria-label="Choose image">
                {heroSlides.map((item, index) => (
                  <button
                    className={index === slide ? "active" : ""}
                    aria-label={`Show image ${index + 1}: ${item.caption}`}
                    aria-current={index === slide}
                    onClick={() => changeSlide(index)}
                    key={item.src}
                  />
                ))}
              </div>
              <button
                className="carousel-pause"
                aria-label={paused ? "Play carousel" : "Pause carousel"}
                onClick={() => setPaused(!paused)}
              >
                {paused ? "Play" : "Pause"}
              </button>
            </div>
          </div>
        </div>
      </section>
      <section className="section">
        <SectionTitle
          eyebrow="Our mandate"
          title="A shared voice. Practical value for members."
          text="From industry representation and technical knowledge to infrastructure collaboration, ISPAU helps members work together on the issues shaping Uganda’s digital future."
        />
        <div className="mandate-list">
          {mandates.map(([icon, title, text]) => (
            <article className="mandate-card" key={title}>
              <span className="mandate-number">
                {String(
                  mandates.findIndex((item) => item[1] === title) + 1,
                ).padStart(2, "0")}
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="split-feature section">
        <div>
          <SectionAccent />
          <span className="eyebrow">Membership</span>
          <h2>Find your place in Uganda’s digital ecosystem.</h2>
          <p>
            Explore membership options for operators, infrastructure providers,
            vendors, research organisations and other eligible participants.
          </p>
          <Button onClick={() => go("membership")}>Explore Membership</Button>
        </div>
        <div className="tier-stack">
          <div>
            <Tag tone="info">Platinum</Tag>
            <strong>Major operators & infrastructure owners</strong>
          </div>
          <div>
            <Tag tone="success">Silver</Tag>
            <strong>Emerging operators & wireless providers</strong>
          </div>
          <div>
            <Tag>Associate & Affiliate</Tag>
            <strong>Vendors, research & non-profits</strong>
          </div>
        </div>
      </section>
      {ENABLE_TRADE_CREDIT && (
        <section className="dark-feature">
          <div className="section dark-grid">
            <div>
              <SectionAccent light />
              <span className="eyebrow">Trade Credit & Payment Assurance</span>
              <h2>Clearer payment information. Better-informed decisions.</h2>
              <p>
                The Trade Credit and Payment Assurance Service helps
                participating members verify business payment records, resolve
                outstanding accounts and request confidential payment
                references.
              </p>
              <Button kind="secondary" onClick={() => go("trade")}>
                Explore the Service
              </Button>
            </div>
            <div className="flow-graphic">
              <div>
                <span>01</span>
                <strong>Verify</strong>
                <small>Review submitted business records</small>
              </div>
              <div>
                <span>02</span>
                <strong>Resolve</strong>
                <small>Notify, clarify and update outcomes</small>
              </div>
              <div>
                <span>03</span>
                <strong>Inform</strong>
                <small>Share eligible references securely</small>
              </div>
            </div>
          </div>
        </section>
      )}
      <section className="section">
        <SectionTitle
          eyebrow="Member representation"
          title="Our Member Community"
          text="Discover the organisations participating in ISPAU."
        />
        <div className="member-logo-rail">
          {sampleMembers.slice(0, 6).map((member) => (
            <div key={member.id}>
              <CompanyLogo member={member} />
              <small>{member.name}</small>
            </div>
          ))}
        </div>
        <div className="directory-link-row">
          <p>
            Sample profiles show the intended directory format. Publication
            requires confirmed eligibility, active status, approval and
            permission.
          </p>
          <Button kind="secondary" onClick={() => go("directory")}>
            Browse Our Members
          </Button>
        </div>
      </section>
      <section className="section activity-section">
        <SectionTitle
          eyebrow="Activities"
          title="Learning, collaboration and industry dialogue."
        />
        <div className="activity-ledger">
          {[
            "Cybersecurity Awareness and Resilience",
            "Internet Exchange and Peering Forum",
            "Technical Training and Skills Development",
          ].map((x, i) => (
            <article className="activity-card" key={x}>
              <span className="activity-no">0{i + 1}</span>
              <h3>{x}</h3>
              <p>Programme details to be confirmed</p>
              <button className="text-link">
                Learn more <Icon name="arrow" size={16} />
              </button>
            </article>
          ))}
        </div>
      </section>
    </PublicShell>
  )
}

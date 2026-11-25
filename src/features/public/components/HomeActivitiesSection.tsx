import { useEffect, useRef, useState } from "react"
import type { KeyboardEvent, TouchEvent } from "react"
import SectionAccent from "@/components/ui/SectionAccent"
import { activityStatus, useActivities } from "../data/activities"
import { ActivityCardGrid } from "./ActivitiesSection"

type ActivityTab = "current" | "quarterly" | "upcoming"

const tabs: { id: ActivityTab; label: string }[] = [
  { id: "quarterly", label: "Quarterly activities" },
  { id: "current", label: "Current / Ongoing" },
  { id: "upcoming", label: "Upcoming activities" },
]

export default function HomeActivitiesSection() {
  const { activities, loading, error, refresh } = useActivities()
  const [selectedTab, setSelectedTab] = useState<ActivityTab>("quarterly")
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const currentActivities = activities.filter(
    (activity) => activityStatus(activity) === "Happening now",
  )
  const upcomingActivities = activities.filter(
    (activity) => activityStatus(activity) === "Upcoming",
  )
  const counts = {
    quarterly: 0,
    current: currentActivities.length,
    upcoming: upcomingActivities.length,
  }
  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) => {
    const nextIndex =
      event.key === "ArrowRight"
        ? (currentIndex + 1) % tabs.length
        : event.key === "ArrowLeft"
          ? (currentIndex - 1 + tabs.length) % tabs.length
          : -1
    if (nextIndex < 0) return
    event.preventDefault()
    const nextTab = tabs[nextIndex]
    setSelectedTab(nextTab.id)
    tabRefs.current[nextIndex]?.focus()
  }

  const eventContent =
    selectedTab === "current" ? currentActivities : upcomingActivities
  const emptyMessage =
    selectedTab === "current"
      ? "No activities are happening now."
      : "No upcoming activities at the moment."

  return (
    <section
      className="section activity-section home-activities"
      id="activities"
      aria-label="Activities"
    >
      <div className="home-activities-heading">
        <SectionAccent />
        <h2 className="eyebrow">Activities</h2>
      </div>
      <div className="activity-tabs" role="tablist" aria-label="Activities">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            id={`home-activities-tab-${tab.id}`}
            ref={(element) => {
              tabRefs.current[index] = element
            }}
            className="activity-tab"
            type="button"
            role="tab"
            aria-selected={selectedTab === tab.id}
            aria-controls="home-activities-panel"
            tabIndex={selectedTab === tab.id ? 0 : -1}
            onClick={() => setSelectedTab(tab.id)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
          >
            {tab.label}
            {counts[tab.id] > 0 && (
              <span className="activity-tab-count">{counts[tab.id]}</span>
            )}
          </button>
        ))}
      </div>
      <div
        className="home-activities-panel"
        id="home-activities-panel"
        role="tabpanel"
        aria-labelledby={`home-activities-tab-${selectedTab}`}
        tabIndex={0}
      >
        {selectedTab === "quarterly" ? (
          <QuarterlyActivities />
        ) : loading ? (
          <p role="status">Loading activities…</p>
        ) : error ? (
          <p role="alert">
            Activities are temporarily unavailable.{" "}
            <button type="button" onClick={() => void refresh()}>
              Retry
            </button>
          </p>
        ) : eventContent.length ? (
          <>
            <p className="sr-only" role="status">
              {eventContent.length} {selectedTab} activities shown
            </p>
            <ActivityCardGrid activities={eventContent} />
          </>
        ) : (
          <p className="events-empty">{emptyMessage}</p>
        )}
      </div>
    </section>
  )
}

type Slide = { index: number; direction: "next" | "previous" }

function QuarterlyActivities() {
  const [slides, setSlides] = useState<Slide[]>(() =>
    quarterlyActivities.map(() => ({ index: 0, direction: "next" })),
  )
  const [lastInteraction, setLastInteraction] = useState<number | null>(null)
  const touchStart = useRef<{ quarterIndex: number; x: number } | null>(null)

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const timer = setTimeout(
      () => {
        const next = lastInteraction === null ? slides[0].index + 1 : 0
        setSlides(
          quarterlyActivities.map((quarter) => ({
            index: next % quarter.months.length,
            direction: "next",
          })),
        )
        setLastInteraction(null)
      },
      lastInteraction === null ? 8000 : 20000,
    )
    return () => clearTimeout(timer)
  }, [slides, lastInteraction])

  const moveMonth = (quarterIndex: number, step: number) => {
    setLastInteraction(Date.now())
    setSlides((current) =>
      current.map((slide, index) => {
        if (index !== quarterIndex) return slide
        const count = quarterlyActivities[index].months.length
        return {
          index: (slide.index + step + count) % count,
          direction: step > 0 ? "next" : "previous",
        }
      }),
    )
  }

  const handleTouchStart = (
    quarterIndex: number,
    event: TouchEvent<HTMLElement>,
  ) => {
    touchStart.current = {
      quarterIndex,
      x: event.changedTouches[0]?.clientX ?? 0,
    }
  }

  const handleTouchEnd = (
    quarterIndex: number,
    event: TouchEvent<HTMLElement>,
  ) => {
    const start = touchStart.current
    touchStart.current = null
    if (!start || start.quarterIndex !== quarterIndex) return
    const delta = (event.changedTouches[0]?.clientX ?? start.x) - start.x
    if (Math.abs(delta) >= 48) moveMonth(quarterIndex, delta < 0 ? 1 : -1)
  }

  return (
    <div className="quarterly-grid">
      {quarterlyActivities.map((quarter, quarterIndex) => {
        const slide = slides[quarterIndex]
        const month = quarter.months[slide.index]
        return (
          <article
            className="quarter-card"
            key={quarter.quarter}
            aria-label={`${quarter.quarter}: ${quarter.period}`}
            onTouchStart={(event) => handleTouchStart(quarterIndex, event)}
            onTouchEnd={(event) => handleTouchEnd(quarterIndex, event)}
          >
            <header className="quarter-heading">
              <div>
                <span className="quarter-label">{quarter.quarter}</span>
                <h3>{quarter.period}</h3>
              </div>
              <span className="quarter-count-label">3 months</span>
            </header>
            <p className="quarter-theme">{quarter.theme}</p>
            <div
              className="quarter-month-content"
              key={`${slide.index}-${slide.direction}`}
              data-direction={slide.direction}
            >
              <span className="quarter-month-name">{month.name}</span>
              <h4>{month.title}</h4>
              <ul>
                {month.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            </div>
            <div className="quarter-navigation">
              <button
                type="button"
                aria-label={`Previous month in ${quarter.quarter}`}
                onClick={() => moveMonth(quarterIndex, -1)}
              >
                <span aria-hidden="true">&lsaquo;</span>
              </button>
              <button
                type="button"
                aria-label={`Next month in ${quarter.quarter}`}
                onClick={() => moveMonth(quarterIndex, 1)}
              >
                <span aria-hidden="true">&rsaquo;</span>
              </button>
              <span className="quarter-counter" aria-live="polite">
                {slide.index + 1} / {quarter.months.length}
              </span>
            </div>
          </article>
        )
      })}
    </div>
  )
}

type QuarterlyMonth = {
  name: string
  title: string
  details: string[]
}

type QuarterlyActivity = {
  quarter: string
  period: string
  theme: string
  months: [QuarterlyMonth, QuarterlyMonth, QuarterlyMonth]
}

const quarterlyActivities: QuarterlyActivity[] = [
  {
    quarter: "Quarter 1",
    period: "January – March",
    theme:
      "Setting the agenda, hardening defences and getting compliance-ready for the year.",
    months: [
      {
        name: "January",
        title: "ISP Strategy & Planning Retreat",
        details: [
          "Industry-wide meeting to set priorities and surface challenges",
          "Alignment on the year's key objectives",
        ],
      },
      {
        name: "February",
        title: "Cybersecurity Awareness Month",
        details: [
          "ISP-led campaigns on cybersecurity best practice",
          "Webinars on data protection and DDoS mitigation",
          "Delivered in collaboration with NITA-U",
        ],
      },
      {
        name: "March",
        title: "Regulatory & Compliance Workshop",
        details: [
          "Training on new telecom and ICT regulations",
          "Engagement with UCC, NITA-U and CERT-UG",
          "Review of data privacy and spectrum licensing",
        ],
      },
    ],
  },
  {
    quarter: "Quarter 2",
    period: "April – June",
    theme:
      "Building the network: peering, fibre expansion and the partnerships behind them.",
    months: [
      {
        name: "April",
        title: "Internet Exchange Point & Peering Forum",
        details: [
          "ISPs, content providers and data centres improve local routing",
          "Peering policy, network efficiency and reduced latency",
        ],
      },
      {
        name: "May",
        title: "Fibre & Connectivity Conference",
        details: [
          "Panels on network expansion, rural broadband and 5G readiness",
          "Vendor exhibitions for network equipment and fibre solutions",
        ],
      },
      {
        name: "June",
        title: "ISP Community Networking & Social Event",
        details: [
          "Informal gathering for ISPs, vendors and government officials",
          "Focus on innovation, digital inclusion and knowledge sharing",
        ],
      },
    ],
  },
  {
    quarter: "Quarter 3",
    period: "July – September",
    theme:
      "Deepening skills, opening the SME market and shaping national policy.",
    months: [
      {
        name: "July",
        title: "Technical Training & Certification Week",
        details: [
          "Hands-on network automation, IPv6 and cloud services",
          "Delivered with Cisco, Juniper, Huawei and MikroTik trainers",
        ],
      },
      {
        name: "August",
        title: "SME Digital Transformation Expo",
        details: [
          "Helping SMEs adopt ISP-driven cloud and hosting solutions",
          "Workshops on colocation, SaaS and managed IT services",
        ],
      },
      {
        name: "September",
        title: "Internet Governance & Policy Dialogue",
        details: [
          "Debate on fair competition, net neutrality and spectrum",
          "Government, civil society and operators at the same table",
        ],
      },
    ],
  },
  {
    quarter: "Quarter 4",
    period: "October – December",
    theme:
      "Recognising performance, backing new ideas and planning the year ahead.",
    months: [
      {
        name: "October",
        title: "National ISP Awards & Recognition Night",
        details: [
          "Honouring customer service, innovation and coverage expansion",
          "Categories include best SME ISP and rural internet champion",
        ],
      },
      {
        name: "November",
        title: "Hackathon & Innovation Challenge",
        details: [
          "ISP-driven solutions in cybersecurity, AI and automation",
          "Startup engagement and mentorship from industry leaders",
        ],
      },
      {
        name: "December",
        title: "End-of-Year Summit & Planning Forum",
        details: [
          "Review of industry performance, challenges and trends",
          "Planning growth, regulatory change and investment",
        ],
      },
    ],
  },
]

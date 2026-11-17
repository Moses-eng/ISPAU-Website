import { useEffect, useState } from "react"
import type { SiteSlide } from "@/features/site-content/model"
export default function HeroSlider({
  slides,
  className = "",
}: {
  slides: SiteSlide[]
  className?: string
}) {
  const [index, setIndex] = useState(0),
    [paused, setPaused] = useState(false),
    [touch, setTouch] = useState<number | null>(null)
  const current = Math.min(index, Math.max(0, slides.length - 1))
  const move = (offset: number) =>
    setIndex((current + offset + slides.length) % slides.length)
  useEffect(() => {
    setIndex((i) => Math.min(i, Math.max(0, slides.length - 1)))
  }, [slides.length])
  useEffect(() => {
    if (
      paused ||
      slides.length < 2 ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % slides.length),
      6000,
    )
    return () => clearInterval(timer)
  }, [paused, slides.length])
  if (!slides.length) return null
  return (
    <div
      className={`hero-carousel ${className}`}
      role="region"
      aria-roledescription="carousel"
      aria-label="ISPAU image gallery"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault()
          move(-1)
        }
        if (e.key === "ArrowRight") {
          e.preventDefault()
          move(1)
        }
      }}
      onTouchStart={(e) => setTouch(e.changedTouches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch !== null) {
          const distance = e.changedTouches[0].clientX - touch
          if (Math.abs(distance) > 45) move(distance > 0 ? -1 : 1)
        }
        setTouch(null)
      }}
    >
      <div className="carousel-frame">
        {slides.map((s, i) => (
          <figure
            key={s.id}
            className={`carousel-slide ${i === current ? "active" : ""}`}
            aria-hidden={i !== current}
          >
            <img src={s.image} alt={i === current ? s.name : ""} />
            <figcaption>
              <strong>{s.description}</strong>
              {s.caption !== s.description && <span>{s.caption}</span>}
              <span>Photo: {s.credit}</span>
            </figcaption>
          </figure>
        ))}
        {slides.length > 1 && (
          <>
            <button
              className="carousel-arrow previous"
              aria-label="Previous image"
              onClick={() => move(-1)}
            >
              ←
            </button>
            <button
              className="carousel-arrow next"
              aria-label="Next image"
              onClick={() => move(1)}
            >
              →
            </button>
          </>
        )}
        <div className="carousel-controls">
          <button
            className="carousel-counter"
            aria-label={`${paused ? "Play" : "Pause"} carousel, image ${current + 1} of ${slides.length}`}
            title={paused ? "Play carousel" : "Pause carousel"}
            onClick={() => setPaused(!paused)}
          >
            {current + 1}/{slides.length}
          </button>
        </div>
      </div>
    </div>
  )
}

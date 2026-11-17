// src/components/ui/PageHero.tsx
import { useEffect, useState, type ReactNode } from "react"
import HeroSlider from "./HeroSlider"
import bannerService, { resolveBannerImageUrl } from "@/apiServices/bannerService"
import type { BannerPage, SiteSlide } from "@/features/site-content/model"

export default function PageHero({
  eyebrow,
  title,
  text,
  children,
  image,
  pageName,
}: {
  eyebrow: string
  title: string
  text: string
  children?: ReactNode
  pageName?: BannerPage | string
  image?: {
    src: string
    alt: string
    caption: string
    credit: string
  }
}) {
  const [slides, setSlides] = useState<SiteSlide[]>([])
  const [loading, setLoading] = useState(Boolean(pageName))

  useEffect(() => {
    if (!pageName) return

    let isMounted = true
    setLoading(true)

    void bannerService.listPublic(pageName).then((res) => {
      if (!isMounted) return

      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const mappedSlides: SiteSlide[] = res.data.map((banner) => ({
          id: banner.id,
          name: banner.name,
          image: resolveBannerImageUrl(banner.image),
          description: banner.description || banner.name,
          caption: banner.description || banner.name,
          credit: "",
          page_name: (banner.page_name || pageName) as BannerPage,
          status: "active",
        }))
        setSlides(mappedSlides)
      } else {
        setSlides([])
      }

      setLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [pageName])

  const hasSlides = slides.length > 0
  const hasImage = hasSlides || Boolean(image)

  return (
    <section className={`page-hero ${hasImage ? "has-image" : ""}`}>
      <div className="page-hero-content">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{text}</p>
        {children && <div className="button-row">{children}</div>}
      </div>

      {hasSlides ? (
        <HeroSlider
          slides={slides}
          className="page-hero-media page-hero-carousel"
        />
      ) : image ? (
        <figure className="page-hero-media">
          <img src={image.src} alt={image.alt} />
          <figcaption>
            {/* {image.caption} <span>Photo: {image.credit}</span> */}
            {image.caption}
          </figcaption>
        </figure>
      ) : loading ? (
        <div
          className="page-hero-media"
          style={{ minHeight: "220px", display: "grid", placeItems: "center" }}
        >
          <span style={{ color: "var(--muted)", fontSize: "13px" }}>
            Loading media…
          </span>
        </div>
      ) : null}
    </section>
  )
}


import type { ReactNode } from "react"

export default function PageHero({
  eyebrow,
  title,
  text,
  children,
  image,
}: {
  eyebrow: string
  title: string
  text: string
  children?: ReactNode
  image?: {
    src: string
    alt: string
    caption: string
    credit: string
  }
}) {
  return (
    <section className={`page-hero ${image ? "has-image" : ""}`}>
      <div className="page-hero-content">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{text}</p>
        {children && <div className="button-row">{children}</div>}
      </div>
      {image && (
        <figure className="page-hero-media">
          <img src={image.src} alt={image.alt} />
          <figcaption>
            {image.caption} <span>Photo: {image.credit}</span>
          </figcaption>
        </figure>
      )}
    </section>
  )
}

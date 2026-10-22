type LogoProps = {
  light?: boolean
  onClick?: () => void
}

export default function Logo({ light = false, onClick }: LogoProps) {
  return (
    <button
      type="button"
      className={`logo ${light ? "logo-light" : ""}`}
      aria-label="ISPAU home"
      onClick={
        onClick ??
        (() => {
          location.hash = "home"
        })
      }
    >
      <img
        src="/ispau-logo.png"
        alt="Internet Service Providers Association of Uganda"
      />
    </button>
  )
}

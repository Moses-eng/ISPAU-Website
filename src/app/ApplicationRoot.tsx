import { useEffect, useState } from "react"
import App from "./App"
import DashboardApp from "./DashboardApp"
import { staffAliases, portalAliases } from "./navigation"
export default function ApplicationRoot() {
  const [url, setUrl] = useState(location.pathname + location.hash)
  useEffect(() => {
    const update = () => setUrl(location.pathname + location.hash)
    addEventListener("popstate", update)
    addEventListener("hashchange", update)
    return () => {
      removeEventListener("popstate", update)
      removeEventListener("hashchange", update)
    }
  }, [])
  const hash = location.hash.replace(/^#\/?/, "")
  const alias =
    location.pathname === "/" &&
    (staffAliases[hash]
      ? `/staff#/${staffAliases[hash]}`
      : portalAliases[hash]
        ? `/portal#/${portalAliases[hash]}`
        : null)
  useEffect(() => {
    if (alias) {
      history.replaceState(null, "", alias)
      dispatchEvent(new PopStateEvent("popstate"))
    }
  }, [alias])
  if (alias)
    return (
      <div role="status" className="workspace-demo-login">
        Opening your membership workspace…
      </div>
    )
  return /^\/(staff|portal)(\/|$)/.test(location.pathname) ? (
    <DashboardApp url={url} />
  ) : (
    <App />
  )
}

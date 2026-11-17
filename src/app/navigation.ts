export function navigateTo(path: string) {
  history.pushState(null, "", path)
  window.dispatchEvent(new PopStateEvent("popstate"))
  window.scrollTo({ top: 0, behavior: "instant" })
}

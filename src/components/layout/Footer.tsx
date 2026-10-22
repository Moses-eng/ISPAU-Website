import { ENABLE_TRADE_CREDIT } from "@/features/trade-credit/feature"
import Logo from "@/components/layout/Logo"
import type { View } from "@/types/View"

export default function Footer({ go }: { go: (view: View) => void }) {
  return (
    <footer>
      <div className="footer-grid">
        <div>
          <Logo light />
          <p>
            Strengthening Uganda’s internet industry through collaboration,
            shared expertise and practical member services.
          </p>
        </div>
        <div>
          <h4>Explore</h4>
          <button onClick={() => go("about")}>About ISPAU</button>
          <button onClick={() => go("directory")}>Our Members</button>
          <button onClick={() => go("membership")}>Membership</button>
          <button onClick={() => go("services")}>Services & Activities</button>
          {ENABLE_TRADE_CREDIT && (
            <button onClick={() => go("trade")}>Trade Credit</button>
          )}
        </div>
        <div>
          <h4>Contact the Secretariat</h4>
          <a href="mailto:info@ispau.ug">info@ispau.ug</a>
          <a href="mailto:membership@ispau.ug">membership@ispau.ug</a>
          <a href="tel:+256781492412">+256 781 492 412</a>
          <button onClick={() => go("privacy")}>Privacy notice</button>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 ISPAU.</span>
        <span>Privacy · Responsible information use</span>
      </div>
    </footer>
  )
}

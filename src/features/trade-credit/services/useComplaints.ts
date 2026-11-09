import { useEffect, useState, useCallback, useRef } from "react"
import { complaintRequest, type ComplaintSnapshot } from "./complaintApi"
import { canReviewComplaints, type CreditActor } from "./complaints"
const empty: ComplaintSnapshot = { records: [], notices: [], searches: [] }
export default function useComplaints(actor: CreditActor | null) {
  const [snapshot, setSnapshot] = useState({ key: "", data: empty })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const key = actor ? JSON.stringify(actor) : ""
  const activeKey = useRef(key)
  activeKey.current = key
  const refresh = useCallback(async () => {
    const current: CreditActor | null = key ? JSON.parse(key) : null
    if (!current || !canReviewComplaints(current)) {
      setSnapshot({ key, data: empty })
      return
    }
    try {
      const data = await complaintRequest<ComplaintSnapshot>(
        current,
        false,
        "/complaints",
      )
      if (activeKey.current !== key) return
      setSnapshot({ key, data })
      setError("")
    } catch (e) {
      if (activeKey.current !== key) return
      setSnapshot({ key, data: empty })
      setError((e as Error).message)
    }
  }, [key])
  useEffect(() => {
    setSnapshot({ key, data: empty })
    setLoading(true)
    void refresh().finally(() => setLoading(false))
    const timer = setInterval(() => {
      void refresh()
    }, 5000)
    return () => clearInterval(timer)
  }, [refresh])
  return {
    snapshot: snapshot.key === key ? snapshot.data : empty,
    error,
    loading,
    refresh,
  }
}

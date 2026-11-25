import { useCallback, useSyncExternalStore } from "react"
import authStore from "@/apiServices/authStore"
import notificationService, {
  type ApplicantNotification,
} from "@/apiServices/applicantNotificationService"
import type { LiveApplication } from "@/apiServices/webAplicatService"
import type {
  Activity,
  FileRecord,
  Values,
} from "@/features/membership/types/workspace"

const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
const text = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value) : ""
const array = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed
    } catch {
      /* Not a JSON array. */
    }
  }
  return []
}
const first = (source: Record<string, unknown>, ...keys: string[]) =>
  keys
    .map((key) => source[key])
    .find((value) => value !== undefined && value !== null && value !== "")
export type PortalInvoice = {
  id: string
  total: string
  currency: string
  period: string
  payment: string
  pdf: string
  notificationIds: number[]
}

// Display adapter only: no payload, API service, authentication or workflow changes.
export function applicationAnswers(application: LiveApplication) {
  const raw = record(application),
    values: Values = {}
  for (const [key, value] of Object.entries({
    ...raw,
    ...record(raw.values),
  })) {
    const name = key.replace(/_([a-z0-9])/g, (_, letter: string) =>
      letter.toUpperCase(),
    )
    if (
      typeof value === "boolean" ||
      typeof value === "string" ||
      typeof value === "number"
    )
      values[name] = typeof value === "number" ? String(value) : value
    else if (
      Array.isArray(value) &&
      value.every((item) => typeof item === "string")
    )
      values[name] = value.join(", ")
  }
  for (const name of [
    "sameRepresentative",
    "authorityConfirmed",
    "accuracyDeclaration",
    "authorityDeclaration",
    "rulesDeclaration",
    "restrictionsDeclaration",
    "privacyDeclaration",
    "directoryConsent",
    "promotionalConsent",
  ]) {
    if (values[name] === "1") values[name] = true
    else if (values[name] === "0") values[name] = false
  }
  if (values.postOfficeBoxNumber && !values.ugandaAddress)
    values.ugandaAddress = values.postOfficeBoxNumber
  const evidence: FileRecord[] = []
  for (const [index, attachment] of [
    ...array(raw.evidence),
    ...array(raw.attachments),
  ].entries()) {
    const file = record(attachment),
      source = text(
        first(file, "name", "original_name", "filename", "path", "url") ||
          attachment,
      )
    if (!source) continue
    const name = source.split(/[?#]/)[0].split("/").pop() || source
    evidence.push({
      id: text(file.id) || `${application.id}-document-${index}`,
      name,
      category:
        text(first(file, "category", "document_type")) || "supportingEvidence",
      size: Number(file.size) || 0,
      type:
        text(first(file, "type", "mime_type")) || "application/octet-stream",
    })
  }
  return { values, evidence }
}
export function applicationHistory(application: LiveApplication): Activity[] {
  const raw = record(application)
  const entries = array(
    first(raw, "status_history", "statusHistory", "activity", "history"),
  )
  const history = entries.flatMap((value, index) => {
    const event = record(value),
      date = text(first(event, "created_at", "date", "changed_at", "timestamp"))
    if (!date || !Number.isFinite(Date.parse(date))) return []
    const status = text(
        first(event, "status", "stage", "to_status", "new_status"),
      ),
      description = text(
        first(event, "text", "description", "message", "action"),
      )
    const actor =
      text(first(record(event.actor || event.user || event.admin), "name")) ||
      text(first(event, "actor_name", "admin_name", "reviewer_name", "actor"))
    return [
      {
        id: text(event.id) || `${application.id}-history-${index}`,
        date,
        actor: actor || "Application record",
        text:
          [status, description !== status ? description : ""]
            .filter(Boolean)
            .join(" — ") || "Application updated",
      },
    ]
  })
  // Never manufacture past reviews or approvals when the server supplies no journal.
  if (
    !history.length &&
    raw.created_at &&
    Number.isFinite(Date.parse(text(raw.created_at)))
  )
    history.push({
      id: `${application.id}-created`,
      date: text(raw.created_at),
      actor: "Application record",
      text: "Application record created",
    })
  return history.sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
}
export function decisionReason(application: LiveApplication) {
  const raw = record(application)
  const decisions = array(raw.decisions)
    .map(record)
    .sort(
      (a, b) =>
        Date.parse(text(first(b, "date", "created_at"))) -
        Date.parse(text(first(a, "date", "created_at"))),
    )
  const decision = record(
    first(raw, "latest_decision", "decision") || decisions[0],
  )
  return {
    reason: text(
      first(
        raw,
        "decision_reason",
        "decisionReason",
        "status_reason",
        "statusReason",
        "rejection_reason",
        "deferred_reason",
        "decline_reason",
        "reason",
      ) || decision.reason,
    ),
    date: text(first(decision, "date", "created_at")),
    id: text(decision.id),
  }
}
export function profileInvoices(
  application: LiveApplication | null,
  owner: string,
): PortalInvoice[] {
  if (!application) return []
  const raw = record(application)
  // INVOICE CONNECTION POINT: use the applicant-scoped invoices returned with the
  // existing profile. No invoice URL or endpoint is invented. If these are returned
  // by a separate service, supply its records here through the existing data adapter.
  const invoices = array(raw.invoices).length
    ? array(raw.invoices)
    : raw.invoice
      ? [raw.invoice]
      : []
  return invoices
    .map(record)
    .filter((invoice) => {
      const applicant = text(invoice.applicant_id),
        applicationId = text(invoice.application_id)
      return (
        (!applicant || applicant === owner || applicant === application.id) &&
        (!applicationId || applicationId === application.id) &&
        invoice.active !== false &&
        !/^(not active|inactive|0)$/i.test(text(invoice.status)) &&
        invoice.status !== false &&
        invoice.status !== 0
      )
    })
    .flatMap((invoice) => {
      const id = text(first(invoice, "id", "invoice_id"))
      if (!id) return []
      const start = text(
          first(invoice, "period_start", "starts_at", "periodStart"),
        ),
        end = text(first(invoice, "period_end", "ends_at", "periodEnd"))
      const notificationIds = [
        invoice.notification_id,
        ...array(invoice.notification_ids),
      ]
        .map(Number)
        .filter((id) => Number.isSafeInteger(id) && id > 0)
      return [
        {
          id,
          total: text(first(invoice, "total", "amount")),
          currency: text(invoice.currency),
          period:
            text(first(invoice, "membership_period", "period")) ||
            [start, end].filter(Boolean).join(" – "),
          payment:
            text(first(invoice, "payment_status", "paymentStatus")) ||
            "Pending",
          pdf: text(first(invoice, "invoice_pdf", "pdf_url", "invoiceUrl")),
          notificationIds,
        },
      ]
    })
}

type Snapshot = {
  application: LiveApplication | null
  items: ApplicantNotification[]
  loading: boolean
  error: string
  read: string[]
}
type Entry = {
  snapshot: Snapshot
  listeners: Set<() => void>
  pending?: Promise<void>
  timer?: ReturnType<typeof setInterval>
  marking: Map<number, Promise<void>>
}
const entries = new Map<string, Entry>()
function entry(owner: string) {
  if (!entries.has(owner)) {
    let read: string[] = []
    try {
      const value: unknown = JSON.parse(
        localStorage.getItem(`ispau-portal-opened:${owner}`) || "[]",
      )
      if (Array.isArray(value))
        read = value.filter((id): id is string => typeof id === "string")
    } catch {
      /* Session-only fallback. */
    }
    entries.set(owner, {
      snapshot: {
        application: null,
        items: [],
        loading: !!owner,
        error: "",
        read,
      },
      listeners: new Set(),
      marking: new Map(),
    })
  }
  return entries.get(owner)!
}
function update(owner: string, patch: Partial<Snapshot>) {
  if (authStore.getUserId() !== owner) return
  const current = entry(owner)
  current.snapshot = { ...current.snapshot, ...patch }
  current.listeners.forEach((listener) => listener())
}
export function publishPortalApplication(
  owner: string,
  application: LiveApplication,
  profileData?: unknown,
) {
  update(owner, { application: { ...record(profileData), ...application } })
}
export function syncPortalNotices(
  owner: string,
  patch: {
    readIds?: number[]
    allRead?: boolean
    removeIds?: number[]
    items?: ApplicantNotification[]
  },
) {
  const current = entry(owner).snapshot
  const merged = new Map(current.items.map((item) => [item.id, item]))
  for (const item of patch.items || [])
    if (item.applicant_id === owner) merged.set(item.id, item)
  const items = [...merged.values()]
    .filter((item) => !patch.removeIds?.includes(item.id))
    .map((item) =>
      patch.allRead || patch.readIds?.includes(item.id)
        ? { ...item, is_read: true }
        : item,
    )
  update(owner, { items })
}
export function refreshPortalNotices(owner: string): Promise<void> {
  if (!owner || authStore.getUserId() !== owner || !authStore.isAuthenticated())
    return Promise.resolve()
  const current = entry(owner)
  if (current.pending) return current.pending
  current.pending = (async () => {
    try {
      let items: ApplicantNotification[] = [],
        page = 1,
        last = 1
      do {
        const response = await notificationService.list(owner, {
          per_page: 100,
          page,
        })
        if (!response.success) throw Error(response.message)
        items = [
          ...items,
          ...response.data.items.filter((item) => item.applicant_id === owner),
        ]
        const pagination = response.data.pagination
        last = pagination?.last_page || 1
        if (page > 1 && pagination && pagination.current_page !== page)
          throw Error("Notices could not be fully loaded. Please refresh.")
        page++
      } while (page <= last && page <= 100)
      if (page <= last)
        throw Error(
          "There are too many notices to load at once. Open Notifications to review them.",
        )
      update(owner, {
        items: [...new Map(items.map((item) => [item.id, item])).values()],
        loading: false,
        error: "",
      })
    } catch (error) {
      update(owner, {
        loading: false,
        error:
          (error as Error).message || "Could not load organisation notices.",
      })
    } finally {
      current.pending = undefined
    }
  })()
  return current.pending
}
export function markPortalNotice(owner: string, id: number): Promise<void> {
  const current = entry(owner),
    notice = current.snapshot.items.find(
      (item) => item.id === id && item.applicant_id === owner,
    )
  if (!notice || notice.is_read || authStore.getUserId() !== owner)
    return Promise.resolve()
  const pending = current.marking.get(id)
  if (pending) return pending
  const operation = (async () => {
    const response = await notificationService.markAsRead(id)
    if (!response.success)
      throw Error(response.message || "Could not mark the notice as read.")
    syncPortalNotices(owner, { readIds: [id] })
  })().finally(() => current.marking.delete(id))
  current.marking.set(id, operation)
  return operation
}
function markOpened(owner: string, ids: string[]) {
  const previous = entry(owner).snapshot.read,
    read = [...new Set([...previous, ...ids])]
  if (read.length === previous.length) return
  try {
    localStorage.setItem(`ispau-portal-opened:${owner}`, JSON.stringify(read))
  } catch {
    /* Keep the current session usable. */
  }
  update(owner, { read })
}
export type PortalNotice = {
  key: string
  serverId?: number
  title: string
  body: string
  date: string
  unread: boolean
}
function linkedNoticeIds(
  invoice: PortalInvoice,
  items: ApplicantNotification[],
) {
  return [
    ...new Set([
      ...invoice.notificationIds,
      ...items
        .filter((item) => text(record(item).invoice_id) === invoice.id)
        .map((item) => item.id),
    ]),
  ]
}
export function useApplicantPortal(enabled = true) {
  const owner = enabled ? authStore.getUserId() || "" : ""
  const subscribe = useCallback(
    (listener: () => void) => {
      const current = entry(owner)
      current.listeners.add(listener)
      if (owner && current.listeners.size === 1) {
        void refreshPortalNotices(owner)
        current.timer = setInterval(
          () => void refreshPortalNotices(owner),
          30000,
        )
      }
      return () => {
        current.listeners.delete(listener)
        if (!current.listeners.size) clearInterval(current.timer)
      }
    },
    [owner],
  )
  const snapshot = useSyncExternalStore(subscribe, () => entry(owner).snapshot)
  const invoices = profileInvoices(snapshot.application, owner)
  const linked = new Set(
    invoices.flatMap((invoice) => linkedNoticeIds(invoice, snapshot.items)),
  )
  const notices: PortalNotice[] = snapshot.items
    .filter((item) => !linked.has(item.id))
    .map((item) => ({
      key: `notice:${item.id}`,
      serverId: item.id,
      title: item.title,
      body: item.message,
      date: item.created_at || "",
      unread: !item.is_read,
    }))
  if (
    snapshot.application &&
    !snapshot.loading &&
    ["Deferred", "Declined"].includes(snapshot.application.status)
  ) {
    const decision = decisionReason(snapshot.application)
    const key = `decision:${snapshot.application.id}:${decision.id || decision.date || snapshot.application.status}`
    if (
      decision.reason &&
      !snapshot.items.some((item) => item.message.includes(decision.reason))
    )
      notices.unshift({
        key,
        title: `Application ${snapshot.application.status.toLowerCase()}`,
        body: decision.reason,
        date: decision.date,
        unread: !snapshot.read.includes(key),
      })
  }
  const invoiceUnread = (invoice: PortalInvoice) => {
    const ids = linkedNoticeIds(invoice, snapshot.items)
    const linked = snapshot.items.filter((item) => ids.includes(item.id))
    return linked.length
      ? linked.some((item) => !item.is_read)
      : !snapshot.read.includes(`invoice:${invoice.id}`)
  }
  return {
    ...snapshot,
    owner,
    invoices,
    notices,
    invoiceUnread,
    unreadInvoices: invoices.filter(invoiceUnread).length,
    unreadNotices: notices.filter((notice) => notice.unread).length,
    refresh: () => refreshPortalNotices(owner),
    openNotice: async (notice: PortalNotice) => {
      if (notice.serverId !== undefined)
        await markPortalNotice(owner, notice.serverId)
      else markOpened(owner, [notice.key])
    },
    openInvoice: async (invoice: PortalInvoice) => {
      await Promise.all(
        linkedNoticeIds(invoice, snapshot.items).map((id) =>
          markPortalNotice(owner, id),
        ),
      )
      markOpened(owner, [`invoice:${invoice.id}`])
    },
  }
}

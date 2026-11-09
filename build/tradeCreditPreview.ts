import type { Plugin } from "vite"
import {
  submitComplaint,
  reviewComplaint,
  requestReference,
  visibleComplaints,
  canReviewComplaints,
  type CreditActor,
  type ComplaintStore,
} from "../src/features/trade-credit/services/complaints.ts"

// Development only: shared, memory-only preview for the two local apps. Never mounted in a production build.
export function tradeCreditPreview(): Plugin {
  const store: ComplaintStore = { records: [], searches: [] }
  const files = new Map<
    string,
    { organisationId: string; name: string; type: string; bytes: Buffer }
  >()
  return {
    name: "trade-credit-preview",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/api/trade-credit", async (req, res) => {
        res.setHeader("Cache-Control", "no-store")
        res.setHeader("X-Content-Type-Options", "nosniff")
        const send = (value: unknown, code = 200) => {
          res.statusCode = code
          res.setHeader("Content-Type", "application/json")
          res.end(JSON.stringify(value))
        }
        try {
          const actor: CreditActor = JSON.parse(
            decodeURIComponent(
              String(req.headers["x-preview-actor"] || "null"),
            ),
          )
          if (!actor?.id) return send({ message: "Sign in to continue." }, 401)
          const eligible = req.headers["x-preview-eligible"] === "true"
          const url = new URL(req.url || "/", "http://localhost")
          let body: any = {}
          if (req.method === "POST") {
            const chunks: Buffer[] = []
            let size = 0
            for await (const chunk of req) {
              size += chunk.length
              if (size > 145000000)
                throw Error("Attachments exceed the preview limit.")
              chunks.push(Buffer.from(chunk))
            }
            body = JSON.parse(Buffer.concat(chunks).toString("utf8"))
          }
          if (req.method === "GET" && url.pathname === "/complaints")
            return send({
              records: visibleComplaints(store, actor, eligible),
              notices: canReviewComplaints(actor)
                ? []
                : store.records
                    .filter((r) => r.approved)
                    .map(({ id, status, updatedAt }) => ({
                      id,
                      status,
                      updatedAt,
                    })),
              searches: store.searches.filter(
                (s) =>
                  canReviewComplaints(actor) ||
                  s.organisationId === actor.organisationId,
              ),
            })
          if (req.method === "POST" && url.pathname === "/complaints") {
            // Validate bytes before committing the complaint; never leave a partial submission.
            for (const f of body.evidence || []) {
              const bytes = Buffer.from(
                String(body.attachments?.[f.id] || ""),
                "base64",
              )
              if (!bytes.length || bytes.length !== f.size)
                throw Error(`Reattach ${f.name || "the supporting evidence"}.`)
            }
            const record = submitComplaint(store, actor, eligible, body)
            for (const f of record.evidence)
              files.set(`${record.id}/${f.id}`, {
                organisationId: record.organisationId,
                name: f.name,
                type: f.type,
                bytes: Buffer.from(body.attachments[f.id], "base64"),
              })
            return send(record, 201)
          }
          const review = url.pathname.match(/^\/complaints\/([^/]+)\/review$/)
          if (req.method === "POST" && review)
            return send(reviewComplaint(store, actor, review[1], body))
          const update = url.pathname.match(/^\/complaints\/([^/]+)\/update$/)
          if (req.method === "POST" && update) {
            const r = visibleComplaints(store, actor, eligible).find(
              (r) => r.id === update[1],
            )
            if (
              !r ||
              actor.kind !== "organisation" ||
              r.organisationId !== actor.organisationId
            )
              throw Error("Complaint unavailable.")
            if (
              !body.history?.trim() ||
              !Number.isFinite(body.balance) ||
              body.balance < 0
            )
              throw Error("Enter the payment update and a valid balance.")
            r.history = body.history.trim()
            r.balance = body.balance
            r.approved = false
            r.reviewOutcome = undefined
            r.verification = undefined
            r.verifiedBy = undefined
            r.status = "under verification"
            r.updatedAt = new Date().toISOString()
            r.activity.unshift({
              id: crypto.randomUUID(),
              actor: actor.name,
              date: r.updatedAt,
              text: "Payment update submitted for fresh verification.",
            })
            return send(r)
          }
          const dispute = url.pathname.match(/^\/complaints\/([^/]+)\/dispute$/)
          if (req.method === "POST" && dispute) {
            const r = visibleComplaints(store, actor, eligible).find(
              (r) => r.id === dispute[1],
            )
            if (
              !r ||
              actor.kind !== "organisation" ||
              r.organisationId !== actor.organisationId
            )
              throw Error("Complaint unavailable.")
            if (!body.reason?.trim()) throw Error("Enter the dispute reason.")
            r.status = "disputed"
            r.approved = false
            r.reviewOutcome = undefined
            r.updatedAt = new Date().toISOString()
            r.activity.unshift({
              id: crypto.randomUUID(),
              actor: actor.name,
              date: r.updatedAt,
              text: `Dispute raised: ${body.reason.trim()}. Independent review required.`,
            })
            return send(r)
          }
          if (req.method === "POST" && url.pathname === "/references")
            return send(requestReference(store, actor, eligible, body))
          const evidence = url.pathname.match(
            /^\/complaints\/([^/]+)\/evidence\/([^/]+)$/,
          )
          if (req.method === "GET" && evidence) {
            if (
              !visibleComplaints(store, actor, eligible).some(
                (r) => r.id === evidence[1],
              )
            )
              throw Error("Evidence unavailable.")
            const f = files.get(`${evidence[1]}/${evidence[2]}`)
            if (!f)
              return send(
                {
                  message: "Evidence unavailable. Ask the ISP to reattach it.",
                },
                404,
              )
            res.setHeader("Content-Type", f.type)
            res.setHeader(
              "Content-Disposition",
              `attachment; filename*=UTF-8''${encodeURIComponent(f.name)}`,
            )
            res.end(f.bytes)
            return
          }
          return send({ message: "Preview endpoint unavailable." }, 404)
        } catch (error) {
          send(
            {
              message:
                error instanceof Error
                  ? error.message
                  : "Unable to process this request.",
            },
            400,
          )
        }
      })
    },
  }
}

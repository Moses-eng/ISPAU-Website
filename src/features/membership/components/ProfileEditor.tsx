import { useState } from "react"
import type { Actor, Application } from "../types/workspace"
import { membershipService } from "@/services/membershipService"
import { published } from "../services/workflow"
import Button from "@/components/ui/Button"
import FormField from "@/components/dashboard/FormField"
import StatusBadge from "@/components/dashboard/StatusBadge"
import { acceptFile, getLocalUrl } from "../services/files"
export default function ProfileEditor({
  application: a,
  actor,
  feedback,
}: {
  application: Application
  actor: Actor
  feedback: (message: string, error?: boolean) => void
}) {
  const profile = a.proposedProfile || a.profile
  const [preview, setPreview] = useState(profile)
  const fields = [
    ["name", "Public organisation name"],
    ["description", "Short description"],
    ["services", "Services"],
    ["coverage", "Coverage / location"],
    ["website", "Website"],
    ["contact", "Public business contact"],
  ] as const
  return (
    <>
      <div className="workspace-note">
        Only approved public profile information appears in the member
        directory. Supporting documents, personal representative details,
        billing information and internal notes remain private.
      </div>
      <div className="workspace-review-grid">
        <section className="workspace-panel">
          <h2>
            {actor.kind === "staff"
              ? "Edit directory entry"
              : "Propose profile corrections"}
          </h2>
          <StatusBadge status={published(a) ? "Published" : "Not published"} />
          {a.proposedProfile && (
            <p>
              Proposed changes await review. The currently approved profile
              remains separate.
            </p>
          )}
          <form
            key={a.updatedAt}
            className="workspace-form"
            onChange={(e) => {
              const form = e.currentTarget
              const data = new FormData(form)
              setPreview({
                ...profile,
                ...Object.fromEntries(
                  fields.map(([name]) => [name, String(data.get(name) || "")]),
                ),
              })
            }}
            onSubmit={(e) => {
              e.preventDefault()
              try {
                const data = new FormData(e.currentTarget)
                const next = {
                  ...profile,
                  ...Object.fromEntries(
                    fields.map(([name]) => [
                      name,
                      String(data.get(name) || ""),
                    ]),
                  ),
                }
                const website = next.website
                if (website && !/^https?:\/\//.test(website))
                  throw Error("Use an http:// or https:// website address.")
                const logo = data.get("logo") as File
                if (logo?.size) {
                  if (!logo.type.startsWith("image/"))
                    throw Error("Choose a JPG or PNG logo.")
                  const uploaded = acceptFile(logo, "publicLogo")
                  next.logo = `local:${uploaded.id}`
                  setPreview(next)
                  feedback("Logo selected for this session.")
                }
                membershipService.dispatch(
                  actor,
                  actor.kind === "staff"
                    ? { type: "staff-profile", id: a.id, profile: next }
                    : {
                        type: "profile",
                        id: a.id,
                        profile: next,
                        consent: data.get("consent") === "on",
                      },
                )
                feedback(
                  actor.kind === "staff"
                    ? "Approved public entry updated."
                    : "Proposed profile saved for staff review.",
                )
              } catch (error) {
                feedback((error as Error).message, true)
              }
            }}
          >
            {fields.map(([name, label]) => (
              <FormField
                key={name}
                name={name}
                label={label}
                required={name === "name" || name === "description"}
                multiline={name === "description"}
                value={profile[name]}
              />
            ))}
            <label className="field">
              Public logo (optional)
              <input type="file" name="logo" accept=".jpg,.jpeg,.png" />
              <small>
                10 MB maximum. Your logo remains private until approved.
              </small>
            </label>
            {actor.kind === "organisation" && (
              <label className="checkbox">
                <input
                  type="checkbox"
                  name="consent"
                  defaultChecked={a.consent}
                />
                I permit publication of the eligible, approved profile. This is
                optional.
              </label>
            )}
            <Button type="submit">
              {actor.kind === "staff"
                ? "Save approved public fields"
                : "Submit proposed changes"}
            </Button>
          </form>
          {actor.kind === "organisation" && a.consent && (
            <Button
              kind="ghost"
              onClick={() => {
                membershipService.dispatch(actor, {
                  type: "withdraw",
                  id: a.id,
                })
                feedback(
                  "Publication permission withdrawn. The profile is no longer public.",
                )
              }}
            >
              Withdraw publication permission
            </Button>
          )}
        </section>
        <section className="workspace-panel">
          <span className="eyebrow">Proposed profile preview</span>
          {getLocalUrl(preview.logo) && (
            <img
              src={getLocalUrl(preview.logo)}
              className="h-20 w-32 object-contain"
              alt={`${preview.name} logo preview`}
            />
          )}
          <h2>{preview.name}</h2>
          <p>{preview.description}</p>
          <dl className="workspace-record">
            <div>
              <dt>Services</dt>
              <dd>{preview.services}</dd>
            </div>
            <div>
              <dt>Coverage</dt>
              <dd>{preview.coverage}</dd>
            </div>
            <div>
              <dt>Website</dt>
              <dd>{preview.website}</dd>
            </div>
            <div>
              <dt>Public business contact</dt>
              <dd>{preview.contact}</dd>
            </div>
          </dl>
          <hr />
          <h3>Currently approved profile</h3>
          <p>{a.profile.name}</p>
          <p>{a.profile.description}</p>
          <p className="workspace-help">
            Membership standing: {a.standing}. Portal access:{" "}
            {a.portalAccess ? "Enabled" : "Restricted"}. Publication:{" "}
            {published(a) ? "Visible" : "Hidden"}. These are independent
            controls.
          </p>
          {actor.kind === "staff" && (
            <form
              key={a.updatedAt}
              onSubmit={(e) => {
                e.preventDefault()
                try {
                  membershipService.dispatch(actor, {
                    type: "approve-profile",
                    id: a.id,
                    eligible:
                      new FormData(e.currentTarget).get("eligible") === "on",
                  })
                  feedback(
                    "Profile reviewed. Eligibility, active status, consent and approval determine publication.",
                  )
                } catch (error) {
                  feedback((error as Error).message, true)
                }
              }}
            >
              <label className="checkbox">
                <input
                  type="checkbox"
                  name="eligible"
                  defaultChecked={a.eligible}
                />
                Eligibility for directory publication confirmed by reviewer
              </label>
              <Button type="submit" kind="secondary">
                Approve proposed public profile
              </Button>
            </form>
          )}
        </section>
      </div>
    </>
  )
}

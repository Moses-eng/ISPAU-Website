import LicenceEntries from "@/features/membership/components/LicenceEntries"
import Dialog from "@/components/dashboard/Dialog"
import ApplicationReviewSummary from "@/features/membership/components/ApplicationReviewSummary"

import type {
  Actor,
  Application,
  FileRecord,
} from "@/features/membership/types/workspace"
import { membershipService } from "@/services/membershipService"
import { acceptFile } from "@/features/membership/services/files"
import { validateApplication } from "@/features/membership/services/validation"
import ApplicationInput from "@/features/membership/components/ApplicationInput"
import Button from "@/components/ui/Button"
import Icon from "@/components/ui/Icon"
import Logo from "@/components/layout/Logo"
import type { MembershipApplicationValues } from "@/types/MembershipApplicationValues"
import RequiredText from "@/features/membership/components/RequiredText"
import Tag from "@/components/ui/Tag"
import type { View } from "@/types/View"
import { applicationSectionNames } from "@/features/membership/data/applicationSectionNames"
import { membershipFormSchema } from "@/features/membership/data/membershipFormSchema"
import { useRef } from "react"
import { useState } from "react"

export default function MembershipApplication({
  go,
  workspaceApplication,
  actor,
  onFeedback,
}: {
  go: (v: View) => void
  workspaceApplication?: Application
  actor?: Actor
  onFeedback?: (message: string, error?: boolean) => void
}) {
  const [step, setStep] = useState(0)
  const [saveState, setSaveState] = useState<
    "saved" | "saving" | "failed" | "unsaved"
  >("unsaved")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploads, setUploads] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      (workspaceApplication?.evidence || []).map((file) => [
        file.category,
        file.name,
      ]),
    ),
  )
  const [evidenceRecords, setEvidenceRecords] = useState<FileRecord[]>(
    workspaceApplication?.evidence || [],
  )
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const [licenceEntries, setLicenceEntries] = useState(
    Number(workspaceApplication?.values.licenceEntries || 1),
  )
  const errorSummary = useRef<HTMLDivElement>(null)
  const [values, setValues] = useState<MembershipApplicationValues>(() => {
    if (workspaceApplication)
      return {
        registrationCountry: "Uganda",
        directoryConsent: false,
        promotionalConsent: false,
        ...workspaceApplication.values,
      }
    const saved = localStorage.getItem("ispau-membership-draft")
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        // Ignore malformed local draft data.
      }
    }
    return {
      registrationCountry: "Uganda",
      sameRepresentative: false,
      authorityConfirmed: false,
      directoryConsent: false,
      promotionalConsent: false,
      accuracyDeclaration: false,
      rulesDeclaration: false,
      restrictionsDeclaration: false,
      privacyDeclaration: false,
    }
  })
  const setValue = (name: string, value: string | boolean) => {
    setValues((current) => {
      const next = { ...current, [name]: value }
      if (current.sameRepresentative && name.startsWith("applicant"))
        next[name.replace("applicant", "representative")] = value
      return next
    })
    setErrors((current) => ({ ...current, [name]: "" }))
    setSaveState("unsaved")
  }
  const required = (name: string) => {
    if (
      licenceEntries > 1 &&
      [
        "licenceType2",
        "licenceStatus2",
        "licenceHolder2",
        ...(values.licenceStatus2 !== "Pending" ? ["licenceNumber2"] : []),
      ].includes(name)
    ) {
      return true
    }
    const match = name.match(/^licence(Type|Status|Holder|Number)(\d+)$/)
    if (
      match &&
      values.licenceRelevant === "Yes" &&
      Number(match[2]) <= licenceEntries
    )
      return (
        match[1] !== "Number" ||
        values[`licenceStatus${match[2]}`] !== "Pending"
      )
    if (name === "licenceExplanation")
      return String(values.licenceRelevant || "").startsWith("No")
    const rule = membershipFormSchema.find((item) => item.name === name)
    return typeof rule?.required === "function"
      ? rule.required(values)
      : Boolean(rule?.required)
  }
  const stepFields: string[][] = [
    [
      "legalName",
      "entityType",
      "registrationCountry",
      "registrationReference",
      "registeredAddress",
      "ugandaAddress",
      "businessEmail",
      "businessPhone",
    ],
    ["category", "services", "operationalStatus", "regions", "requestedTier"],
    [
      "pdpoStatus",
      "pdpoExplanation",
      "licenceRelevant",
      "licenceType",
      "licenceStatus",
      "licenceNumber",
      "licenceHolder",
    ],
    [
      "applicantName",
      "applicantRole",
      "applicantEmail",
      "applicantPhone",
      "representativeName",
      "representativeRole",
      "representativeEmail",
      "representativePhone",
      "authorityConfirmed",
    ],
    [
      "billingEmail",
      "billingContact",
      "invoiceAddress",
      "customerFacing",
      "supportContact",
    ],
    ["registrationEvidence", "authorityEvidence"],
    [],
    [
      "accuracyDeclaration",
      "authorityDeclaration",
      "rulesDeclaration",
      "hasRestrictions",
      "restrictionDetails",
      "restrictionsDeclaration",
      "privacyDeclaration",
    ],
  ]
  if (values.licenceRelevant === "Yes") stepFields[5].push("licenceEvidence")
  if (values.licenceRelevant === "Yes" && licenceEntries > 1) {
    stepFields[2].push("licenceType2", "licenceStatus2", "licenceHolder2")
    if (values.licenceStatus2 !== "Pending") {
      stepFields[2].push("licenceNumber2")
    }
  }
  if (String(values.licenceRelevant || "").startsWith("No"))
    stepFields[2].push("licenceExplanation")
  if (values.licenceRelevant === "Yes")
    for (let index = 3; index <= licenceEntries; index++) {
      stepFields[2].push(
        `licenceType${index}`,
        `licenceStatus${index}`,
        `licenceHolder${index}`,
      )
      if (values[`licenceStatus${index}`] !== "Pending")
        stepFields[2].push(`licenceNumber${index}`)
    }
  if (values.pdpoStatus === "Registered") stepFields[5].push("pdpoEvidence")
  const validateFields = (names: string[]) => {
    const next: Record<string, string> = {}
    names.forEach((name) => {
      if (!required(name) && !name.endsWith("Evidence")) return
      const value = name.endsWith("Evidence") ? uploads[name] : values[name]
      if (!value) {
        const label =
          membershipFormSchema.find((item) => item.name === name)?.label ||
          name.replace(/([A-Z])/g, " $1")
        next[name] = `${label} is required.`
      }
    })
    setErrors(next)
    if (Object.keys(next).length) {
      requestAnimationFrame(() => {
        errorSummary.current?.focus()
        const first = document.getElementById(
          `application-${Object.keys(next)[0]}`,
        )
        first?.focus()
      })
      return false
    }
    return true
  }
  const saveDraft = () => {
    setSaveState("saving")
    try {
      if (workspaceApplication && actor)
        membershipService.dispatch(actor, {
          type: "save-draft",
          id: workspaceApplication.id,
          values: { ...values, licenceEntries: String(licenceEntries) },
          evidence: evidenceRecords,
        })
      else
        localStorage.setItem("ispau-membership-draft", JSON.stringify(values))
      window.setTimeout(() => setSaveState("saved"), 450)
    } catch {
      setSaveState("failed")
    }
  }
  const continueApplication = () => {
    if (!validateFields(stepFields[step])) return
    if (step < applicationSectionNames.length - 1) {
      setStep(step + 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }
  const submitApplication = () => {
    const allFields = stepFields.flat()
    if (!validateFields(allFields)) return
    const validation = validateApplication(
      { ...values, licenceEntries: String(licenceEntries) },
      evidenceRecords,
    )
    if (Object.keys(validation).length) {
      setErrors(validation)
      errorSummary.current?.focus()
      return
    }
    setConfirmSubmit(true)
  }
  const confirmApplicationSubmission = () => {
    if (workspaceApplication && actor) {
      try {
        membershipService.dispatch(actor, {
          type: "submit",
          id: workspaceApplication.id,
          values: { ...values, licenceEntries: String(licenceEntries) },
          evidence: evidenceRecords,
        })
        onFeedback?.("Application recorded. Acknowledgement prepared.")
      } catch (error) {
        setErrors({ submission: (error as Error).message })
        setConfirmSubmit(false)
        return
      }
    } else localStorage.removeItem("ispau-membership-draft")
    go("submitted")
  }
  const input = (
    name: string,
    label: string,
    options?: string[],
    optional = false,
    as: "input" | "select" | "textarea" = options ? "select" : "input",
  ) => (
    <ApplicationInput
      name={name}
      label={label}
      values={values}
      errors={errors}
      setValue={(field, value) => setValue(field, value)}
      required={required(name)}
      optional={optional}
      options={options}
      as={as}
    />
  )
  const declaration = (name: string, label: string, optional = false) => (
    <label className={`checkbox ${errors[name] ? "field-error" : ""}`}>
      <input
        id={`application-${name}`}
        type="checkbox"
        checked={Boolean(values[name])}
        onChange={(event) => setValue(name, event.target.checked)}
        required={!optional}
        aria-required={!optional}
      />
      <span>
        {label} {!optional && <b aria-hidden="true">*</b>}
        {optional && <em> (optional)</em>}
        {errors[name] && <small className="inline-error">{errors[name]}</small>}
      </span>
    </label>
  )
  return (
    <div className="form-page">
      <div className="form-topbar">
        <div onClick={() => go("home")}>
          <Logo />
        </div>
        <span>
          <Icon name="lock" size={16} /> Private application
        </span>
        <Button
          kind="ghost"
          onClick={() => {
            saveDraft()
            go("applicant")
          }}
        >
          Save and exit
        </Button>
      </div>
      <div className="form-layout application-layout">
        <aside className="stepper application-stepper">
          <button className="back-link" onClick={() => go("membership")}>
            ← Back to membership
          </button>
          <p>Application progress</p>
          <h2>Apply for ISPAU Membership</h2>
          <ol>
            {applicationSectionNames.map((name, index) => (
              <li
                className={
                  index === step ? "active" : index < step ? "done" : ""
                }
                key={name}
              >
                <span>
                  {index < step ? <Icon name="check" size={14} /> : index + 1}
                </span>
                {name}
              </li>
            ))}
          </ol>
          <div className={`save-state save-${saveState}`} aria-live="polite">
            <Icon
              name={saveState === "failed" ? "shield" : "check"}
              size={18}
            />
            <span>
              <strong>
                {saveState === "saving"
                  ? "Saving…"
                  : saveState === "saved"
                    ? "Draft saved"
                    : saveState === "failed"
                      ? "Save failed"
                      : "Unsaved changes"}
              </strong>
              <small>
                {saveState === "failed"
                  ? "Check your connection and retry."
                  : "Saved in this browser"}
              </small>
            </span>
          </div>
        </aside>
        <main className="form-main application-main">
          <div className="form-heading">
            <span>
              Section {step + 1} of {applicationSectionNames.length}
            </span>
            <h1>{applicationSectionNames[step]}</h1>
            <RequiredText />
          </div>
          {Object.keys(errors).length > 0 && (
            <div
              className="error-summary"
              ref={errorSummary}
              tabIndex={-1}
              role="alert"
            >
              <strong>Check the highlighted information.</strong>
              <p>
                Complete {Object.keys(errors).length} required{" "}
                {Object.keys(errors).length === 1 ? "item" : "items"} before
                continuing.
              </p>
            </div>
          )}
          {step === 0 && (
            <section className="form-section">
              <div className="field-grid">
                {input("legalName", "Organisation legal name")}
                {input("tradingName", "Trading name", undefined, true)}
                {input("entityType", "Entity type", [
                  "Private company limited by shares",
                  "Company limited by guarantee",
                  "Public body",
                  "Academic or research institution",
                  "Non-profit organisation",
                ])}
                {input("registrationCountry", "Registration country")}
                {input(
                  "registrationReference",
                  "Registration number or equivalent establishment reference",
                )}
                {input("businessEmail", "Main business email")}
                {input("registeredAddress", "Registered address")}
                {input("ugandaAddress", "Uganda operating address")}
                {input("businessPhone", "Main business phone")}
                {input("website", "Website", undefined, true)}
              </div>
              <p className="helper">
                A registration number and establishment reference are
                alternatives; provide the one that applies to your organisation.
              </p>
            </section>
          )}
          {step === 1 && (
            <section className="form-section">
              <div className="field-grid">
                {input("category", "Organisation category", [
                  "Internet service provider",
                  "Infrastructure provider",
                  "Vendor or equipment provider",
                  "Academic, research or non-profit organisation",
                ])}
                {input("operationalStatus", "Operational status", [
                  "Operational",
                  "Pre-operational",
                ])}
                {input("services", "Services", undefined, false, "textarea")}
                {input(
                  "regions",
                  values.operationalStatus === "Pre-operational"
                    ? "Planned districts or regions served"
                    : "Districts or regions served",
                )}
                {input("requestedTier", "Requested membership tier", [
                  "Platinum — USD 1,000",
                  "Silver — USD 500",
                  "Associate — USD 250",
                  "Affiliate — USD 150",
                ])}
                {input(
                  "parentGroup",
                  "Parent or group information",
                  undefined,
                  true,
                )}
              </div>
              <div className="notice">
                <Icon name="shield" />
                <p>
                  ISPAU confirms eligibility and the final membership tier
                  during review. A higher fee does not automatically grant
                  governance rights.
                </p>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="form-section">
              <div className="field-grid">
                {input("pdpoStatus", "PDPO registration status", [
                  "Registered",
                  "Pending",
                  "Not applicable",
                ])}
                {values.pdpoStatus === "Registered" &&
                  input("pdpoReference", "PDPO reference", undefined, true)}
                {values.pdpoStatus === "Registered" &&
                  input("pdpoValidity", "PDPO validity", undefined, true)}
                {["Pending", "Not applicable"].includes(
                  String(values.pdpoStatus),
                ) &&
                  input(
                    "pdpoExplanation",
                    "PDPO status explanation",
                    undefined,
                    false,
                    "textarea",
                  )}
                {input("licenceRelevant", "Telecom licence relevance", [
                  "Yes",
                  "No — not applicable to activities",
                ])}
                {String(values.licenceRelevant || "").startsWith("No") &&
                  input(
                    "licenceExplanation",
                    "Why a licence is not applicable",
                    undefined,
                    false,
                    "textarea",
                  )}
              </div>
              {values.licenceRelevant === "Yes" && (
                <LicenceEntries
                  values={values}
                  errors={errors}
                  onChange={setValue}
                  count={licenceEntries}
                  onCount={(next) => {
                    setLicenceEntries(next)
                    setValues((current) =>
                      Object.fromEntries(
                        Object.entries(current).filter(([key]) => {
                          const match = key.match(
                            /^licence(?:Type|Status|Holder|Number)(\d+)$/,
                          )
                          return !match || Number(match[1]) <= next
                        }),
                      ),
                    )
                    setSaveState("unsaved")
                  }}
                />
              )}
            </section>
          )}
          {step === 3 && (
            <section className="form-section">
              <h3>Applicant</h3>
              <div className="field-grid">
                {input("applicantName", "Applicant name")}
                {input("applicantRole", "Applicant role")}
                {input("applicantEmail", "Applicant work email")}
                {input("applicantPhone", "Applicant phone")}
              </div>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={Boolean(values.sameRepresentative)}
                  onChange={(event) => {
                    setValue("sameRepresentative", event.target.checked)
                    if (event.target.checked) {
                      setValues((current) => ({
                        ...current,
                        representativeName: current.applicantName || "",
                        representativeRole: current.applicantRole || "",
                        representativeEmail: current.applicantEmail || "",
                        representativePhone: current.applicantPhone || "",
                      }))
                    }
                  }}
                />
                <span>Authorised representative is the same as applicant</span>
              </label>
              <h3>Authorised membership representative</h3>
              <div className="field-grid">
                {input("representativeName", "Representative name")}
                {input("representativeRole", "Representative role")}
                {input("representativeEmail", "Representative work email")}
                {input("representativePhone", "Representative phone")}
                {input(
                  "alternateRepresentative",
                  "Alternate representative",
                  undefined,
                  true,
                )}
              </div>
              {declaration(
                "authorityConfirmed",
                "I confirm that the named applicant is authorised to submit this application.",
              )}
            </section>
          )}
          {step === 4 && (
            <section className="form-section">
              <div className="field-grid">
                {input("billingEmail", "Billing email")}
                {input(
                  "billingContact",
                  "Billing contact name or accounts role",
                )}
                {input("invoiceAddress", "Invoice address")}
                {input("tin", "TIN", undefined, true)}
                {input(
                  "purchaseOrder",
                  "Purchase-order or reference",
                  undefined,
                  true,
                )}
                {input("customerFacing", "Customer-facing provider", [
                  "Yes",
                  "No",
                ])}
                {values.customerFacing === "Yes" &&
                  input(
                    "supportContact",
                    "Support or complaints email / policy link",
                  )}
              </div>
            </section>
          )}
          {step === 5 && (
            <section className="form-section">
              <p className="helper">
                Private PDF, JPG or PNG files, up to 10 MB each. Do not upload
                national IDs, bank statements, shareholder registers, customer
                records or detailed network maps.
              </p>
              {[
                [
                  "registrationEvidence",
                  "Registration or establishment evidence",
                  true,
                ],
                [
                  "licenceEvidence",
                  "Relevant licence evidence",
                  values.licenceRelevant === "Yes",
                ],
                [
                  "authorityEvidence",
                  "Representative authority evidence",
                  true,
                ],
                [
                  "pdpoEvidence",
                  "PDPO evidence",
                  values.pdpoStatus === "Registered",
                ],
              ]
                .filter(([, , applicable]) => applicable)
                .map(([name, label]) => (
                  <div
                    className={`upload-control ${
                      errors[String(name)] ? "field-error" : ""
                    }`}
                    id={`application-${String(name)}`}
                    tabIndex={errors[String(name)] ? -1 : undefined}
                    key={String(name)}
                  >
                    <span>
                      <strong>
                        {label} <b aria-hidden="true">*</b>
                      </strong>
                      <small>PDF, JPG or PNG · Maximum 10 MB</small>
                    </span>
                    {uploads[String(name)] ? (
                      <>
                        <Tag tone="success">Selected · not verified</Tag>
                        <Button
                          kind="secondary"
                          onClick={() => {
                            setEvidenceRecords((current) =>
                              current.filter(
                                (file) => file.category !== String(name),
                              ),
                            )
                            setUploads((current) => ({
                              ...current,
                              [String(name)]: "",
                            }))
                            setSaveState("unsaved")
                          }}
                        >
                          Replace or remove
                        </Button>
                      </>
                    ) : (
                      <label className="field">
                        Choose private file *
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          aria-required="true"
                          aria-label={String(label)}
                          onChange={(event) => {
                            const file = event.target.files?.[0]
                            if (!file) return
                            try {
                              const record = acceptFile(file, String(name))
                              setSaveState("unsaved")
                              setEvidenceRecords((current) => [
                                ...current.filter(
                                  (item) => item.category !== String(name),
                                ),
                                record,
                              ])
                              setUploads((current) => ({
                                ...current,
                                [String(name)]: file.name,
                              }))
                              setErrors((current) => ({
                                ...current,
                                [String(name)]: "",
                              }))
                            } catch (error) {
                              setErrors((current) => ({
                                ...current,
                                [String(name)]: (error as Error).message,
                              }))
                              event.target.value = ""
                            }
                          }}
                        />
                      </label>
                    )}
                    {errors[String(name)] && (
                      <small className="inline-error">
                        {errors[String(name)]}
                      </small>
                    )}
                  </div>
                ))}
              <div className="upload-state-examples">
                <span>
                  <Tag tone="warning">Pending scan</Tag> Files are not treated
                  as verified evidence.
                </span>
                <span>
                  <Tag tone="danger">Example error</Tag> Unsupported files and
                  files over 10 MB are rejected without losing other answers.
                </span>
              </div>
            </section>
          )}
          {step === 6 && (
            <section className="form-section">
              <p>
                These answers are optional and do not block submission, approval
                or activation.
              </p>
              <div className="field-grid">
                {input(
                  "joiningReasons",
                  "Reasons for joining",
                  undefined,
                  true,
                  "textarea",
                )}
                {input(
                  "priorities",
                  "Top priorities",
                  undefined,
                  true,
                  "textarea",
                )}
                {input(
                  "workingGroups",
                  "Working-group interests",
                  undefined,
                  true,
                )}
                {input("publicName", "Public profile name", undefined, true)}
                {input(
                  "publicDescription",
                  "Public profile description",
                  undefined,
                  true,
                  "textarea",
                )}
                {input(
                  "publicServices",
                  "Public profile services",
                  undefined,
                  true,
                )}
                {input(
                  "publicCoverage",
                  "Public profile coverage",
                  undefined,
                  true,
                )}
                {input(
                  "publicWebsite",
                  "Public profile website",
                  undefined,
                  true,
                )}
                {input(
                  "publicContact",
                  "Public business contact",
                  undefined,
                  true,
                )}
              </div>
              <div className="upload-control">
                <span>
                  <strong>Public company logo (optional)</strong>
                  <small>Published only after separate profile approval</small>
                </span>
                {uploads.publicLogo && <Tag tone="success">Logo selected</Tag>}
                <label className="field">
                  Select public logo (optional)
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (!file) return
                      try {
                        if (!file.type.startsWith("image/"))
                          throw Error("Choose a JPG or PNG logo.")
                        const selectedLogo = acceptFile(file, "publicLogo")
                        setValue(
                          "publicLogoReference",
                          `local:${selectedLogo.id}`,
                        )
                        setUploads((current) => ({
                          ...current,
                          publicLogo: file.name,
                        }))
                      } catch (error) {
                        setErrors((current) => ({
                          ...current,
                          publicLogo: (error as Error).message,
                        }))
                      }
                    }}
                  />
                  {errors.publicLogo && (
                    <small role="alert">{errors.publicLogo}</small>
                  )}
                </label>
              </div>
              <Button kind="secondary" onClick={() => setStep(7)}>
                Complete public profile later
              </Button>
            </section>
          )}
          {step === 7 && (
            <>
              <ApplicationReviewSummary
                sections={applicationSectionNames}
                fields={stepFields}
                values={values}
                evidence={evidenceRecords}
                onEdit={setStep}
              />
              <section className="form-section declarations">
                <h3>Required declarations</h3>
                {declaration(
                  "accuracyDeclaration",
                  "I confirm that the information supplied is accurate.",
                )}
                {declaration(
                  "authorityDeclaration",
                  "I confirm that I am authorised to apply for this organisation.",
                )}
                {declaration(
                  "rulesDeclaration",
                  "I accept the approved membership rules, fees and code.",
                )}
                {input("hasRestrictions", "Relevant operating restrictions", [
                  "No",
                  "Yes",
                ])}
                {values.hasRestrictions === "Yes" &&
                  input(
                    "restrictionDetails",
                    "Restriction details",
                    undefined,
                    false,
                    "textarea",
                  )}
                {declaration(
                  "restrictionsDeclaration",
                  "I confirm that the operating-restriction response above is complete.",
                )}
                {declaration(
                  "privacyDeclaration",
                  "I acknowledge the privacy information provided with this application.",
                )}
                <hr />
                {declaration(
                  "directoryConsent",
                  "I permit publication of an eligible, separately approved directory profile.",
                  true,
                )}
                {declaration(
                  "promotionalConsent",
                  "I agree to receive optional promotional messages.",
                  true,
                )}
              </section>
            </>
          )}
          <div className="form-actions application-actions">
            <div>
              {step > 0 && (
                <Button kind="secondary" onClick={() => setStep(step - 1)}>
                  Back
                </Button>
              )}
              <Button kind="ghost" onClick={saveDraft}>
                Save draft
              </Button>
            </div>
            {step < 7 ? (
              <Button onClick={continueApplication}>Continue</Button>
            ) : (
              <Button onClick={submitApplication}>Submit application</Button>
            )}
          </div>
        </main>
      </div>
      {confirmSubmit && (
        <Dialog
          title="Submit membership application?"
          onClose={() => setConfirmSubmit(false)}
        >
          <p>
            Review your answers before confirming. Submitted versions are
            read-only unless the membership team requests clarification. Your
            application will be recorded for review.
          </p>
          <div className="button-row">
            <Button kind="secondary" onClick={() => setConfirmSubmit(false)}>
              Return to review
            </Button>
            <Button onClick={confirmApplicationSubmission}>
              Confirm Submission
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  )
}

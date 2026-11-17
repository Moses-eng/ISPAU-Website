import ApplicationInput, {
  type SelectOption,
} from "@/features/membership/components/ApplicationInput"
import Button from "@/components/ui/Button"
import Icon from "@/components/ui/Icon"
import Logo from "@/components/layout/Logo"
import type { MembershipApplicationValues } from "@/types/MembershipApplicationValues"
import RequiredText from "@/features/membership/components/RequiredText"
import Tag from "@/components/ui/Tag"
import type { View } from "@/types/View"
import { applicationSectionNames } from "@/features/membership/data/applicationSectionNames"
import { membershipFormSchema } from "@/features/membership/data/membershipFormSchema"
import webApplicationService, {
  type MembershipApplicationPayload,
} from "@/apiServices/webApplicationService"
import tierService, { type PublicTier } from "@/apiServices/tierService"
import { useEffect, useRef, useState } from "react"

const MAX_FILE_BYTES = 10 * 1024 * 1024

type UploadKey =
  | "registrationEvidence"
  | "licenceEvidence"
  | "authorityEvidence"
  | "pdpoEvidence"
  | "publicLogo"

const initialDefaultValues: MembershipApplicationValues = {
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

export default function MembershipApplication({
  go,
}: {
  go: (v: View) => void
}) {
  const [step, setStep] = useState(0)
  const [saveState, setSaveState] = useState<
    "saved" | "saving" | "failed" | "unsaved"
  >("unsaved")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploads, setUploads] = useState<Partial<Record<UploadKey, File>>>({})
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitFeedback, setSubmitFeedback] = useState<string | null>(null)
  const [licenceEntries, setLicenceEntries] = useState(1)
  const [tiers, setTiers] = useState<PublicTier[]>([])
  const errorSummary = useRef<HTMLDivElement>(null)

  const [values, setValues] = useState<MembershipApplicationValues>(() => {
    const saved = localStorage.getItem("ispau-membership-draft")
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        // Ignore malformed local draft data.
      }
    }
    return initialDefaultValues
  })

  // Fetch available tiers using tierService
  useEffect(() => {
    let isMounted = true
    const fetchTiers = async () => {
      const res = await tierService.listPublic()
      if (isMounted && res.success && res.data) {
        setTiers(res.data)
      }
    }
    fetchTiers()
    return () => {
      isMounted = false
    }
  }, [])

  const setValue = (name: string, value: string | boolean) => {
    setValues((current) => ({ ...current, [name]: value }))
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
    if (name === "password" || name === "passwordConfirmation" || name === "businessEmail") {
      return true
    }
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
      "businessEmail",
      "password",
      "passwordConfirmation",
      "registeredAddress",
      "ugandaAddress",
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
  if (values.pdpoStatus === "Registered") stepFields[5].push("pdpoEvidence")

  const validateFields = (names: string[]) => {
    const next: Record<string, string> = {}

    if (names.includes("businessEmail")) {
      const email = typeof values.businessEmail === "string" ? values.businessEmail.trim() : ""
      if (!email) {
        next["businessEmail"] = "Main business email is required."
      }
    }

    if (names.includes("password") || names.includes("passwordConfirmation")) {
      const pwd = typeof values.password === "string" ? values.password : ""
      const pwdConfirm =
        typeof values.passwordConfirmation === "string"
          ? values.passwordConfirmation
          : ""

      if (pwd && pwd.length < 8) {
        next["password"] = "Password must be at least 8 characters long."
      }
      if (pwd && pwdConfirm && pwd !== pwdConfirm) {
        next["passwordConfirmation"] = "Passwords do not match."
      }
    }

    setErrors((prev) => ({ ...prev, ...next }))
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

  const str = (val: unknown, fallback = ""): string =>
    typeof val === "string" ? val : fallback

  const strOrNull = (val: unknown): string | null =>
    typeof val === "string" && val.trim().length > 0 ? val : null

  const buildPayload = (): MembershipApplicationPayload => ({
    id: strOrNull(values.id),
    legalName: str(values.legalName),
    tradingName: strOrNull(values.tradingName),
    entityType: str(values.entityType),
    registrationCountry: str(values.registrationCountry, "Uganda"),
    registrationReference: str(values.registrationReference),
    businessEmail: str(values.businessEmail),
    businessPhone: str(values.businessPhone),
    website: strOrNull(values.website),
    registeredAddress: str(values.registeredAddress),
    ugandaAddress: str(values.ugandaAddress),

    password: "user",
    password_confirmation: "user",

    category: str(values.category),
    operationalStatus: str(values.operationalStatus),
    requestedTier: str(values.requestedTier),
    ...( { requested_tier: str(values.requestedTier) } as any ),
    customerFacing: values.customerFacing === "Yes" ? "Yes" : "No",
    services: strOrNull(values.services),
    regions: strOrNull(values.regions),
    parentGroup: strOrNull(values.parentGroup),

    pdpoStatus: str(values.pdpoStatus),
    pdpoReference: strOrNull(values.pdpoReference),
    pdpoValidity: strOrNull(values.pdpoValidity),
    pdpoExplanation: strOrNull(values.pdpoExplanation),
    licenceRelevant: str(values.licenceRelevant),
    licenceType: strOrNull(values.licenceType),
    licenceStatus: strOrNull(values.licenceStatus),
    licenceNumber: strOrNull(values.licenceNumber),
    licenceHolder: strOrNull(values.licenceHolder),
    licenceValidity: strOrNull(values.licenceValidity),
    licenceType2: strOrNull(values.licenceType2),
    licenceStatus2: strOrNull(values.licenceStatus2),
    licenceNumber2: strOrNull(values.licenceNumber2),
    licenceHolder2: strOrNull(values.licenceHolder2),

    applicantName: str(values.applicantName),
    applicantRole: str(values.applicantRole),
    applicantEmail: str(values.applicantEmail),
    applicantPhone: str(values.applicantPhone),
    representativeName: str(values.representativeName),
    representativeRole: str(values.representativeRole),
    representativeEmail: str(values.representativeEmail),
    representativePhone: str(values.representativePhone),
    alternateRepresentative: strOrNull(values.alternateRepresentative),
    sameRepresentative: Boolean(values.sameRepresentative),
    authorityConfirmed: Boolean(values.authorityConfirmed),

    billingEmail: str(values.billingEmail),
    billingContact: str(values.billingContact),
    invoiceAddress: str(values.invoiceAddress),
    tin: strOrNull(values.tin),
    purchaseOrder: strOrNull(values.purchaseOrder),
    supportContact: strOrNull(values.supportContact),

    joiningReasons: strOrNull(values.joiningReasons),
    priorities: strOrNull(values.priorities),
    workingGroups: strOrNull(values.workingGroups),
    publicName: strOrNull(values.publicName),
    publicDescription: strOrNull(values.publicDescription),
    publicServices: strOrNull(values.publicServices),
    publicCoverage: strOrNull(values.publicCoverage),
    publicWebsite: strOrNull(values.publicWebsite),
    publicContact: strOrNull(values.publicContact),

    hasRestrictions: values.hasRestrictions === "Yes" ? "Yes" : "No",
    restrictionDetails: strOrNull(values.restrictionDetails),

    accuracyDeclaration: Boolean(values.accuracyDeclaration),
    authorityDeclaration: Boolean(values.authorityDeclaration),
    rulesDeclaration: Boolean(values.rulesDeclaration),
    restrictionsDeclaration: Boolean(values.restrictionsDeclaration),
    privacyDeclaration: Boolean(values.privacyDeclaration),
    directoryConsent: Boolean(values.directoryConsent),
    promotionalConsent: Boolean(values.promotionalConsent),

    uploads: {
      registrationEvidence: uploads.registrationEvidence ?? null,
      licenceEvidence: uploads.licenceEvidence ?? null,
      authorityEvidence: uploads.authorityEvidence ?? null,
      pdpoEvidence: uploads.pdpoEvidence ?? null,
      publicLogo: uploads.publicLogo ?? null,
    },
  })

  const saveDraft = async (): Promise<boolean> => {
    const businessEmail = typeof values.businessEmail === "string" ? values.businessEmail.trim() : ""
    if (!businessEmail) {
      setErrors((current) => ({
        ...current,
        businessEmail: "Main business email is required to save a draft.",
      }))
      setSaveState("failed")
      return false
    }

    setSaveState("saving")
    try {
      const res = await webApplicationService.saveDraft(buildPayload())
      if (res.success && res.data?.application?.id) {
        setValue("id", String(res.data.application.id))
      }
      setSaveState("saved")
      return true
    } catch {
      setSaveState("failed")
      return false
    }
  }

  const handleSaveAndExit = async () => {
    const businessEmail = typeof values.businessEmail === "string" ? values.businessEmail.trim() : ""
    if (!businessEmail) {
      setErrors((current) => ({
        ...current,
        businessEmail: "Main business email is required before saving and exiting.",
      }))
      if (step !== 0) setStep(0)
      return
    }
    const saved = await saveDraft()
    if (saved) {
      go("applicant")
    }
  }

  const continueApplication = () => {
    const businessEmail = typeof values.businessEmail === "string" ? values.businessEmail.trim() : ""
    if (!businessEmail) {
      setErrors((current) => ({
        ...current,
        businessEmail: "Main business email is required before continuing.",
      }))
      if (step !== 0) setStep(0)
      return
    }

    if (!validateFields(stepFields[step])) return
    if (step < applicationSectionNames.length - 1) {
      setStep(step + 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const submitApplication = () => {
    const businessEmail = typeof values.businessEmail === "string" ? values.businessEmail.trim() : ""
    if (!businessEmail) {
      setErrors((current) => ({
        ...current,
        businessEmail: "Main business email is required.",
      }))
      setStep(0)
      return
    }

    const allFields = stepFields.flat()
    if (!validateFields(allFields)) return
    setSubmitError(null)
    setConfirmSubmit(true)
  }

  const confirmApplicationSubmission = async () => {
    if (submitting) return
    setSubmitting(true)
    setSubmitError(null)

    const result = await webApplicationService.submitApplication(buildPayload())
    setSubmitting(false)

    if (!result.success) {
      setSubmitError(result.message)
      if (result.fieldErrors) {
        setErrors(result.fieldErrors)
      }
      return
    }

    // 5- Clear all inputs and stored drafts
    localStorage.removeItem("ispau-membership-draft")
    setValues(initialDefaultValues)
    setUploads({})
    setErrors({})
    setLicenceEntries(1)

    // 6- Show feedback to the user
    setSubmitFeedback("Application submitted successfully! Redirecting to login...")

    // 4- Redirect to /#login after short display
    setTimeout(() => {
      window.location.href = "/#login"
    }, 2000)
  }

  const input = (
    name: string,
    label: string,
    options?: SelectOption[],
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
        checked={Boolean((values as any)[name])}
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

  const pickFile = (key: UploadKey, file: File | null) => {
    if (!file) return
    if (file.size > MAX_FILE_BYTES) {
      setErrors((current) => ({
        ...current,
        [key]: "File must be 10 MB or smaller.",
      }))
      return
    }
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
    if (file.type && !allowed.includes(file.type)) {
      setErrors((current) => ({
        ...current,
        [key]: "Only PDF, JPG or PNG files are accepted.",
      }))
      return
    }
    setUploads((current) => ({ ...current, [key]: file }))
    setErrors((current) => ({ ...current, [key]: "" }))
  }

  const removeFile = (key: UploadKey) => {
    setUploads((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  const filePicker = (key: UploadKey, label: string, hint: string) => {
    const current = uploads[key]
    const inputId = `application-${key}-file`
    return (
      <div
        className={`upload-control ${errors[key] ? "field-error" : ""}`}
        id={`application-${key}`}
        tabIndex={errors[key] ? -1 : undefined}
        key={key}
      >
        <span>
          <strong>
            {label} <b aria-hidden="true">*</b>
          </strong>
          <small>{hint}</small>
        </span>
        <input
          id={inputId}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          style={{ display: "none" }}
          onChange={(event) => {
            pickFile(key, event.target.files?.[0] ?? null)
            event.currentTarget.value = ""
          }}
        />
        {current ? (
          <>
            <Tag tone="success">{current.name}</Tag>
            <Button
              kind="secondary"
              onClick={() => document.getElementById(inputId)?.click()}
            >
              Replace
            </Button>
            <Button kind="secondary" onClick={() => removeFile(key)}>
              Remove
            </Button>
          </>
        ) : (
          <Button
            kind="secondary"
            onClick={() => document.getElementById(inputId)?.click()}
          >
            Choose file
          </Button>
        )}
        {errors[key] && <small className="inline-error">{errors[key]}</small>}
      </div>
    )
  }

  return (
    <div className="form-page">
      <div className="form-topbar">
        <div onClick={() => go("home")}>
          <Logo />
        </div>
        <span>
          <Icon name="lock" size={16} /> Private application
        </span>
        <Button kind="ghost" onClick={handleSaveAndExit}>
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
                  : "Saved to cloud & browser"}
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
                Your email will be used to log in and review your application status.
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
                {/* Requested membership tier styled identically using input() */}
                {input(
                  "requestedTier",
                  "Requested membership tier",
                  tiers.map((tier) => ({
                    value: tier.id,
                    label: `${tier.name} — USD ${tier.cost}`,
                  })),
                )}
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
                  during review.
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
                {(values.pdpoStatus === "Pending" ||
                  values.pdpoStatus === "Not applicable") &&
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
              </div>
              {values.licenceRelevant === "Yes" && (
                <div className="conditional-panel">
                  <div className="section-row">
                    <h3>Licence entry 1</h3>
                    <Button
                      kind="secondary"
                      onClick={() => setLicenceEntries(2)}
                    >
                      Add another licence
                    </Button>
                  </div>
                  <div className="field-grid">
                    {input("licenceType", "Licence type")}
                    {input("licenceStatus", "Licence status", [
                      "Valid",
                      "Pending",
                      "Expired",
                    ])}
                    {values.licenceStatus !== "Pending" &&
                      input("licenceNumber", "Licence number")}
                    {input("licenceHolder", "Licence holder")}
                    {input(
                      "licenceValidity",
                      "Licence validity",
                      undefined,
                      true,
                    )}
                  </div>
                  {licenceEntries > 1 && (
                    <div className="additional-licence">
                      <div className="section-row">
                        <h3>Licence entry 2</h3>
                        <button
                          className="text-link"
                          onClick={() => setLicenceEntries(1)}
                        >
                          Remove entry
                        </button>
                      </div>
                      <div className="field-grid">
                        <ApplicationInput
                          name="licenceType2"
                          label="Licence type"
                          values={values}
                          errors={errors}
                          setValue={(name, value) => setValue(name, value)}
                          required
                        />
                        <ApplicationInput
                          name="licenceStatus2"
                          label="Licence status"
                          values={values}
                          errors={errors}
                          setValue={(name, value) => setValue(name, value)}
                          required
                          as="select"
                          options={["Valid", "Pending", "Expired"]}
                        />
                        <ApplicationInput
                          name="licenceHolder2"
                          label="Licence holder"
                          values={values}
                          errors={errors}
                          setValue={(name, value) => setValue(name, value)}
                          required
                        />
                        <ApplicationInput
                          name="licenceNumber2"
                          label="Licence number"
                          values={values}
                          errors={errors}
                          setValue={(name, value) => setValue(name, value)}
                          required={values.licenceStatus2 !== "Pending"}
                          optional={values.licenceStatus2 === "Pending"}
                        />
                      </div>
                    </div>
                  )}
                </div>
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
                Private PDF, JPG or PNG files, up to 10 MB each.
              </p>
              {filePicker(
                "registrationEvidence",
                "Registration or establishment evidence",
                "PDF, JPG or PNG · Maximum 10 MB",
              )}
              {values.licenceRelevant === "Yes" &&
                filePicker(
                  "licenceEvidence",
                  "Relevant licence evidence",
                  "PDF, JPG or PNG · Maximum 10 MB",
                )}
              {filePicker(
                "authorityEvidence",
                "One authority document or confirmed officer approval",
                "PDF, JPG or PNG · Maximum 10 MB",
              )}
              {values.pdpoStatus === "Registered" &&
                filePicker(
                  "pdpoEvidence",
                  "PDPO evidence",
                  "PDF, JPG or PNG · Maximum 10 MB",
                )}
            </section>
          )}

          {step === 6 && (
            <section className="form-section">
              <p>
                These answers are optional and do not block submission.
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
              <div
                className={`upload-control ${
                  errors.publicLogo ? "field-error" : ""
                }`}
                id="application-publicLogo"
              >
                <span>
                  <strong>Public company logo (optional)</strong>
                  <small>Published only after separate profile approval</small>
                </span>
                <input
                  id="application-publicLogo-file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  style={{ display: "none" }}
                  onChange={(event) => {
                    pickFile("publicLogo", event.target.files?.[0] ?? null)
                    event.currentTarget.value = ""
                  }}
                />
                {uploads.publicLogo && (
                  <Tag tone="success">{uploads.publicLogo.name}</Tag>
                )}
                <Button
                  kind="secondary"
                  onClick={() =>
                    document
                      .getElementById("application-publicLogo-file")
                      ?.click()
                  }
                >
                  {uploads.publicLogo ? "Replace logo" : "Choose logo"}
                </Button>
                {uploads.publicLogo && (
                  <Button
                    kind="secondary"
                    onClick={() => removeFile("publicLogo")}
                  >
                    Remove
                  </Button>
                )}
                {errors.publicLogo && (
                  <small className="inline-error">{errors.publicLogo}</small>
                )}
              </div>
              <Button kind="secondary" onClick={() => setStep(7)}>
                Complete public profile later
              </Button>
            </section>
          )}

          {step === 7 && (
            <>
              <section className="review-sections">
                {applicationSectionNames.slice(0, 7).map((name, index) => (
                  <div className="review-row" key={name}>
                    <span>
                      <strong>{name}</strong>
                      <small>
                        {index === 6 && !values.publicName
                          ? "Optional details omitted — complete later"
                          : "Review completed answers"}
                      </small>
                    </span>
                    <button onClick={() => setStep(index)}>Edit</button>
                  </div>
                ))}
              </section>
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
                  "I acknowledge the approved privacy notice (version 4.0).",
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
        <div className="confirmation-panel" role="dialog" aria-modal="true">
          <div>
            {submitFeedback ? (
              <div style={{ textAlign: "center", padding: "1.5rem" }}>
                <Icon name="check" size={36} />
                <h2 style={{ marginTop: "1rem" }}>Application Submitted!</h2>
                <p style={{ marginTop: "0.5rem" }}>{submitFeedback}</p>
              </div>
            ) : (
              <>
                <h2>Submit membership application?</h2>
                <p>
                  You can no longer edit the submitted version unless the membership
                  team requests clarification.
                </p>
                {submitError && (
                  <div className="error-summary" role="alert">
                    <strong>Submission failed.</strong>
                    <p>{submitError}</p>
                  </div>
                )}
                <div className="button-row">
                  <Button
                    kind="secondary"
                    onClick={() => {
                      if (submitting) return
                      setConfirmSubmit(false)
                      setSubmitError(null)
                    }}
                    disabled={submitting}
                  >
                    Return to review
                  </Button>
                  <Button
                    onClick={confirmApplicationSubmission}
                    disabled={submitting}
                  >
                    {submitting ? "Submitting…" : "Confirm Submission"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

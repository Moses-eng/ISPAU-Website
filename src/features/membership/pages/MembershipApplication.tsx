import ApplicationReviewSummary from "@/features/membership/components/ApplicationReviewSummary"
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
import { BASE_URL } from "@/apiServices/env"

const MAX_FILE_BYTES = 10 * 1024 * 1024

const progressKey = (id: string) => `ispau.application-progress:${id}`
const readProgress = () => {
  try {
    const draft = JSON.parse(sessionStorage.getItem("ispau.draft_application") || "null")
    const progress = draft?.id ? JSON.parse(sessionStorage.getItem(progressKey(String(draft.id))) || "null") : null
    if (Number.isInteger(progress?.step) && Number.isInteger(progress?.furthest) && progress.step >= 0 && progress.step <= progress.furthest && progress.furthest < applicationSectionNames.length) return progress as { step: number; furthest: number }
  } catch { /* The form remains usable without browser storage. */ }
  return { step: 0, furthest: 0 }
}

const getFileUrl = (path: string): string => {
  if (!path) return ""
  return `${BASE_URL}/${path}`
}

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

// Convert any snake_case backend errors into camelCase so the form inputs pick them up
const normalizeFieldErrors = (
  fieldErrors?: Record<string, string> | null,
): Record<string, string> => {
  if (!fieldErrors) return {}
  const normalized: Record<string, string> = {}
  for (const [key, msg] of Object.entries(fieldErrors)) {
    normalized[key] = msg
    const camelKey = key.replace(/_([a-z])/g, (_, g) => g.toUpperCase())
    normalized[camelKey] = msg
  }
  return normalized
}

function mapApplicationToValues(
  app: any,
  prevValues?: MembershipApplicationValues,
): MembershipApplicationValues {
  if (!app) return prevValues || initialDefaultValues

  const org = app.organisation_details || app.organisationDetails || {}
  const comp = app.compliance_details || app.complianceDetails || {}
  const applicant = app.applicant_details || app.applicantDetails || {}
  const billing = app.billing_details || app.billingDetails || {}
  const profile = app.profile_optional || app.profileOptional || {}
  const restrictions = app.restrictions || {}
  const declarations = app.declarations || {}

  return {
    ...(prevValues || initialDefaultValues),
    id: app.id || prevValues?.id || "",
    legalName: app.legal_name ?? app.legalName ?? prevValues?.legalName ?? "",
    tradingName: app.trading_name ?? app.tradingName ?? prevValues?.tradingName ?? "",
    entityType: app.entity_type ?? app.entityType ?? prevValues?.entityType ?? "",
    registrationCountry:
      app.registration_country ?? app.registrationCountry ?? prevValues?.registrationCountry ?? "Uganda",
    registrationReference:
      app.registration_reference ?? app.registrationReference ?? prevValues?.registrationReference ?? "",
    businessEmail: app.business_email ?? app.businessEmail ?? prevValues?.businessEmail ?? "",
    businessPhone: app.business_phone ?? app.businessPhone ?? prevValues?.businessPhone ?? "",
    website: app.website ?? prevValues?.website ?? "",
    registeredAddress:
      app.registered_address ?? app.registeredAddress ?? prevValues?.registeredAddress ?? "",
    ugandaAddress: app.uganda_address ?? app.ugandaAddress ?? prevValues?.ugandaAddress ?? "",

    category: app.category ?? prevValues?.category ?? "",
    operationalStatus:
      app.operational_status ?? app.operationalStatus ?? prevValues?.operationalStatus ?? "",
    requestedTier: app.requested_tier ?? app.requestedTier ?? prevValues?.requestedTier ?? "",
    customerFacing:
      (app.customer_facing ?? app.customerFacing) === "Yes"
        ? "Yes"
        : (app.customer_facing ?? app.customerFacing) === "No"
          ? "No"
          : prevValues?.customerFacing ?? "",
    services: org.services ?? app.services ?? prevValues?.services ?? "",
    regions: org.regions ?? app.regions ?? prevValues?.regions ?? "",
    parentGroup: org.parent_group ?? org.parentGroup ?? app.parentGroup ?? prevValues?.parentGroup ?? "",

    pdpoStatus: app.pdpo_status ?? app.pdpoStatus ?? prevValues?.pdpoStatus ?? "",
    pdpoReference:
      comp.pdpo_reference ?? comp.pdpoReference ?? app.pdpoReference ?? prevValues?.pdpoReference ?? "",
    pdpoValidity:
      comp.pdpo_validity ?? comp.pdpoValidity ?? app.pdpoValidity ?? prevValues?.pdpoValidity ?? "",
    pdpoExplanation:
      comp.pdpo_explanation ?? comp.pdpoExplanation ?? app.pdpoExplanation ?? prevValues?.pdpoExplanation ?? "",

    licenceRelevant: app.licence_relevant ?? app.licenceRelevant ?? prevValues?.licenceRelevant ?? "",
    licenceType: comp.licence_type ?? comp.licenceType ?? app.licenceType ?? prevValues?.licenceType ?? "",
    licenceStatus: comp.licence_status ?? comp.licenceStatus ?? app.licenceStatus ?? prevValues?.licenceStatus ?? "",
    licenceNumber: comp.licence_number ?? comp.licenceNumber ?? app.licenceNumber ?? prevValues?.licenceNumber ?? "",
    licenceHolder: comp.licence_holder ?? comp.licenceHolder ?? app.licenceHolder ?? prevValues?.licenceHolder ?? "",
    licenceValidity:
      comp.licence_validity ?? comp.licenceValidity ?? app.licenceValidity ?? prevValues?.licenceValidity ?? "",
    licenceType2: comp.licence_type_2 ?? comp.licenceType2 ?? app.licenceType2 ?? prevValues?.licenceType2 ?? "",
    licenceStatus2:
      comp.licence_status_2 ?? comp.licenceStatus2 ?? app.licenceStatus2 ?? prevValues?.licenceStatus2 ?? "",
    licenceNumber2:
      comp.licence_number_2 ?? comp.licenceNumber2 ?? app.licenceNumber2 ?? prevValues?.licenceNumber2 ?? "",
    licenceHolder2:
      comp.licence_holder_2 ?? comp.licenceHolder2 ?? app.licenceHolder2 ?? prevValues?.licenceHolder2 ?? "",

    applicantName: app.applicant_name ?? app.applicantName ?? prevValues?.applicantName ?? "",
    applicantRole: app.applicant_role ?? app.applicantRole ?? prevValues?.applicantRole ?? "",
    applicantEmail: app.applicant_email ?? app.applicantEmail ?? prevValues?.applicantEmail ?? "",
    applicantPhone: app.applicant_phone ?? app.applicantPhone ?? prevValues?.applicantPhone ?? "",
    representativeName:
      app.representative_name ?? app.representativeName ?? prevValues?.representativeName ?? "",
    representativeRole:
      app.representative_role ?? app.representativeRole ?? prevValues?.representativeRole ?? "",
    representativeEmail:
      app.representative_email ?? app.representativeEmail ?? prevValues?.representativeEmail ?? "",
    representativePhone:
      app.representative_phone ?? app.representativePhone ?? prevValues?.representativePhone ?? "",
    alternateRepresentative:
      applicant.alternate_representative ??
      applicant.alternateRepresentative ??
      app.alternateRepresentative ??
      prevValues?.alternateRepresentative ??
      "",
    sameRepresentative:
      applicant.same_representative !== undefined
        ? Boolean(applicant.same_representative)
        : applicant.sameRepresentative !== undefined
          ? Boolean(applicant.sameRepresentative)
          : Boolean(prevValues?.sameRepresentative),
    authorityConfirmed:
      applicant.authority_confirmed !== undefined
        ? Boolean(applicant.authority_confirmed)
        : applicant.authorityConfirmed !== undefined
          ? Boolean(applicant.authorityConfirmed)
          : Boolean(prevValues?.authorityConfirmed),

    billingEmail: app.billing_email ?? app.billingEmail ?? prevValues?.billingEmail ?? "",
    billingContact: app.billing_contact ?? app.billingContact ?? prevValues?.billingContact ?? "",
    invoiceAddress: app.invoice_address ?? app.invoiceAddress ?? prevValues?.invoiceAddress ?? "",
    tin: billing.tin ?? app.tin ?? prevValues?.tin ?? "",
    purchaseOrder:
      billing.purchase_order ?? billing.purchaseOrder ?? app.purchaseOrder ?? prevValues?.purchaseOrder ?? "",
    supportContact:
      billing.support_contact ?? billing.supportContact ?? app.supportContact ?? prevValues?.supportContact ?? "",

    joiningReasons:
      profile.joining_reasons ?? profile.joiningReasons ?? app.joiningReasons ?? prevValues?.joiningReasons ?? "",
    priorities: profile.priorities ?? app.priorities ?? prevValues?.priorities ?? "",
    workingGroups:
      profile.working_groups ?? profile.workingGroups ?? app.workingGroups ?? prevValues?.workingGroups ?? "",
    publicName: profile.public_name ?? profile.publicName ?? app.publicName ?? prevValues?.publicName ?? "",
    publicDescription:
      profile.public_description ??
      profile.publicDescription ??
      app.publicDescription ??
      prevValues?.publicDescription ??
      "",
    publicServices:
      profile.public_services ?? profile.publicServices ?? app.publicServices ?? prevValues?.publicServices ?? "",
    publicCoverage:
      profile.public_coverage ?? profile.publicCoverage ?? app.publicCoverage ?? prevValues?.publicCoverage ?? "",
    publicWebsite:
      profile.public_website ?? profile.publicWebsite ?? app.publicWebsite ?? prevValues?.publicWebsite ?? "",
    publicContact:
      profile.public_contact ?? profile.publicContact ?? app.publicContact ?? prevValues?.publicContact ?? "",

    hasRestrictions:
      restrictions.has_restrictions ?? restrictions.hasRestrictions ?? app.hasRestrictions ?? prevValues?.hasRestrictions ?? "No",
    restrictionDetails:
      restrictions.restriction_details ??
      restrictions.restrictionDetails ??
      app.restrictionDetails ??
      prevValues?.restrictionDetails ??
      "",

    accuracyDeclaration:
      declarations.accuracy !== undefined
        ? Boolean(declarations.accuracy)
        : Boolean(prevValues?.accuracyDeclaration),
    authorityDeclaration:
      declarations.authority !== undefined
        ? Boolean(declarations.authority)
        : Boolean(prevValues?.authorityDeclaration),
    rulesDeclaration:
      declarations.rules !== undefined
        ? Boolean(declarations.rules)
        : Boolean(prevValues?.rulesDeclaration),
    restrictionsDeclaration:
      declarations.restrictions !== undefined
        ? Boolean(declarations.restrictions)
        : Boolean(prevValues?.restrictionsDeclaration),
    privacyDeclaration:
      declarations.privacy !== undefined
        ? Boolean(declarations.privacy)
        : Boolean(prevValues?.privacyDeclaration),
    directoryConsent:
      declarations.directory !== undefined
        ? Boolean(declarations.directory)
        : Boolean(prevValues?.directoryConsent),
    promotionalConsent:
      declarations.promotional !== undefined
        ? Boolean(declarations.promotional)
        : Boolean(prevValues?.promotionalConsent),
  }
}

export default function MembershipApplication({
  go,
}: {
  go: (v: View) => void
}) {
  const [step, setStep] = useState(() => readProgress().step)
  const [furthestStep, setFurthestStep] = useState(() => readProgress().furthest)
  const [saveState, setSaveState] = useState<
    "saved" | "saving" | "failed" | "unsaved"
  >("unsaved")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [draftFeedback, setDraftFeedback] = useState<string | null>(null)
  const [uploads, setUploads] = useState<Partial<Record<UploadKey, File>>>({})

  // Multiple files per evidence category
  const [evidenceFiles, setEvidenceFiles] = useState<
    Partial<Record<Exclude<UploadKey, "publicLogo">, File[]>>
  >({})

  // Multiple documents per category are supported now
  const checkEvidenceConnection = () => true

  // Initialize existing attachments (single path or array of paths)
  const [existingAttachments, setExistingAttachments] = useState<
    Partial<Record<UploadKey, string | string[]>>
  >(() => {
    const raw = sessionStorage.getItem("ispau.draft_application")
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (parsed?.attachments && typeof parsed.attachments === "object") {
          return parsed.attachments
        }
      } catch {}
    }
    return {}
  })

  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitFeedback, setSubmitFeedback] = useState<string | null>(null)

  // Initialize licenceEntries based on draft application
  const [licenceEntries, setLicenceEntries] = useState(() => {
    const raw = sessionStorage.getItem("ispau.draft_application")
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (
          parsed?.compliance_details?.licence_type_2 ||
          parsed?.compliance_details?.licence_number_2 ||
          parsed?.licence_type_2
        ) {
          return 2
        }
      } catch {}
    }
    return 1
  })

  const [tiers, setTiers] = useState<PublicTier[]>([])
  const errorSummary = useRef<HTMLDivElement>(null)

  // Initialize values directly from ispau.draft_application
  const [values, setValues] = useState<MembershipApplicationValues>(() => {
    const rawDraft = sessionStorage.getItem("ispau.draft_application")
    if (rawDraft) {
      try {
        const parsed = JSON.parse(rawDraft)
        if (parsed) {
          return mapApplicationToValues(parsed, initialDefaultValues)
        }
      } catch {}
    }

    const saved = sessionStorage.getItem("ispau-membership-draft")
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {}
    }
    return initialDefaultValues
  })

  useEffect(() => {
    if (!values.id) return
    try { sessionStorage.setItem(progressKey(String(values.id)), JSON.stringify({ step, furthest: furthestStep })) } catch { /* Navigation still works in memory. */ }
  }, [step, furthestStep, values.id])

  const selectSection = (index: number) => {
    if (index > furthestStep) return
    setStep(index)
    setErrors({})
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Populate application data from sessionStorage "ispau.draft_application"
  useEffect(() => {
    const rawDraft = sessionStorage.getItem("ispau.draft_application")
    if (!rawDraft) return

    try {
      const draftApp = JSON.parse(rawDraft)
      if (draftApp) {
        const mapped = mapApplicationToValues(draftApp)
        setValues(mapped)
        if (
          mapped.licenceType2 ||
          draftApp.compliance_details?.licence_type_2 ||
          draftApp.licence_type_2
        ) {
          setLicenceEntries(2)
        }
        if (draftApp.attachments && typeof draftApp.attachments === "object") {
          setExistingAttachments(draftApp.attachments)
        }
      }
    } catch {}
  }, [])

  // Fetch available tiers
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
    setErrors((current) => {
      const next = { ...current }
      delete next[name]
      const snakeKey = name.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
      delete next[snakeKey]
      return next
    })
    setSaveState("unsaved")
    setServerError(null)
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
    if (name === "businessEmail") {
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
      "tin",
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

  const fieldErrors = (names: string[]) => {
    const next: Record<string, string> = {}
    for (const name of names) {
      if (name.endsWith("Evidence")) {
        const hasEvidence =
          (evidenceFiles[name as Exclude<UploadKey, "publicLogo">]?.length ?? 0) > 0 ||
          Boolean(uploads[name as UploadKey])
        const existing = existingAttachments[name as UploadKey]
        const hasExisting = Array.isArray(existing) ? existing.length > 0 : Boolean(existing)

        if (!hasEvidence && !hasExisting) {
          next[name] = "Select the required private evidence."
        }
        continue
      }
      if (required(name) && (values[name] === false || !String(values[name] ?? "").trim())) {
        const label = membershipFormSchema.find(rule => rule.name === name)?.label || name
        next[name] = `${label} is required.`
      }
      if (values[name] && name.toLowerCase().includes("email") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(values[name]))) next[name] = "Enter a valid work email address."
    }
    if (names.includes("ugandaAddress") && values.ugandaAddress && !/^[0-9]+$/.test(String(values.ugandaAddress))) next.ugandaAddress = "Enter the box number using digits only."
    return next
  }
  const sectionComplete = stepFields.map((names, index) => index <= furthestStep && (names.length > 0 || index < furthestStep) && !Object.keys(fieldErrors(names)).length)
  const validateFields = (names: string[]) => {
    const next = fieldErrors(names)
    setErrors(next)
    if (Object.keys(next).length) {
      requestAnimationFrame(() => {
        errorSummary.current?.focus()
        document.getElementById(`application-${Object.keys(next)[0]}`)?.focus()
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
    ...({ requested_tier: str(values.requestedTier) } as any),
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
      registrationEvidence: evidenceFiles.registrationEvidence?.length
        ? evidenceFiles.registrationEvidence
        : (uploads.registrationEvidence ?? null),
      licenceEvidence: evidenceFiles.licenceEvidence?.length
        ? evidenceFiles.licenceEvidence
        : (uploads.licenceEvidence ?? null),
      authorityEvidence: evidenceFiles.authorityEvidence?.length
        ? evidenceFiles.authorityEvidence
        : (uploads.authorityEvidence ?? null),
      pdpoEvidence: evidenceFiles.pdpoEvidence?.length
        ? evidenceFiles.pdpoEvidence
        : (uploads.pdpoEvidence ?? null),
      publicLogo: uploads.publicLogo ?? null,
    },
  })

  const saveDraft = async (): Promise<boolean> => {
    if (!checkEvidenceConnection()) return false
    const businessEmail =
      typeof values.businessEmail === "string"
        ? values.businessEmail.trim()
        : ""
    if (!businessEmail) {
      setErrors((current) => ({
        ...current,
        businessEmail: "Main business email is required to save a draft.",
      }))
      setServerError("Main business email is required to save a draft.")
      setSaveState("failed")
      return false
    }

    setSaveState("saving")
    setServerError(null)
    setDraftFeedback(null)

    try {
      const res = await webApplicationService.saveDraft(buildPayload())

      if (!res.success) {
        setSaveState("failed")
        const normalized = normalizeFieldErrors(res.fieldErrors)
        setErrors((current) => ({ ...current, ...normalized }))
        setServerError(res.message || "Failed to save draft to server.")
        requestAnimationFrame(() => {
          errorSummary.current?.focus()
        })
        return false
      }

      // Sync updated draft and application ID returned from backend
      const appData = res.data?.application
      if (appData) {
        sessionStorage.setItem("ispau.draft_application", JSON.stringify(appData))
        if (appData.id) {
          setValue("id", String(appData.id))
        }
        if (appData.attachments && typeof appData.attachments === "object") {
          setExistingAttachments(appData.attachments)
        }
      }

      setSaveState("saved")
      setDraftFeedback(res.message || "Draft saved to server successfully.")
      setServerError(null)
      return true
    } catch (err: any) {
      setSaveState("failed")
      setServerError(
        err?.message || "An unexpected error occurred while saving the draft.",
      )
      return false
    }
  }

  const handleSaveAndExit = async () => {
    const businessEmail =
      typeof values.businessEmail === "string"
        ? values.businessEmail.trim()
        : ""
    if (!businessEmail) {
      setErrors((current) => ({
        ...current,
        businessEmail:
          "Main business email is required before saving and exiting.",
      }))
      setServerError("Main business email is required before saving and exiting.")
      if (step !== 0) setStep(0)
      return
    }
    const saved = await saveDraft()
    if (saved) {
      go("applicant")
    }
  }

  const continueApplication = () => {
    const businessEmail =
      typeof values.businessEmail === "string"
        ? values.businessEmail.trim()
        : ""
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
      setFurthestStep(current => Math.max(current, step + 1))
      setStep(step + 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const submitApplication = () => {
    if (!checkEvidenceConnection()) return
    const businessEmail =
      typeof values.businessEmail === "string"
        ? values.businessEmail.trim()
        : ""
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
    if (submitting || !checkEvidenceConnection()) return
    setSubmitting(true)
    setSubmitError(null)

    const result = await webApplicationService.submitApplication(buildPayload())
    setSubmitting(false)

    if (!result.success) {
      setSubmitError(result.message)
      if (result.fieldErrors) {
        const normalized = normalizeFieldErrors(result.fieldErrors)
        setErrors((prev) => ({ ...prev, ...normalized }))
      }
      return
    }

    if (values.id) sessionStorage.removeItem(progressKey(String(values.id)))
    sessionStorage.removeItem("ispau.draft_application")
    sessionStorage.removeItem("ispau-membership-draft")
    setValues(initialDefaultValues)
    setUploads({})
    setEvidenceFiles({})
    setExistingAttachments({})
    setErrors({})
    setLicenceEntries(1)

    setSubmitFeedback(
      result.message || "Application submitted successfully! Redirecting to login...",
    )

    setTimeout(() => {
      window.location.href = "/#login"
    }, 2000)
  }

  const fieldHints: Record<string, string> = {
    ugandaAddress: "Enter only the Post Office Box number associated with your registered address. Do not include P.O. Box or the town name.",
    tin: "Your organisation's Tax Identification Number, used for billing records.",
    purchaseOrder:
      "Your organisation's internal purchase-order number or billing reference, if Accounts requires one. Otherwise leave blank.",
    customerFacing:
      "Select Yes if your organisation supplies services directly to customers. This determines whether a support or complaints contact is needed.",
    supportContact:
      "Enter the email customers use for support or complaints, or a link to your complaints policy.",
    joiningReasons:
      "Tell ISPAU what you hope to gain from membership. This is for the membership team, not the public directory.",
    priorities:
      "List the main issues you would like ISPAU to focus on, such as infrastructure access, policy or skills development.",
    workingGroups:
      "Name topics or working groups you would like to participate in, if any.",
    publicName:
      "The organisation or trading name you want displayed in the public member directory.",
    publicDescription:
      "A short, customer-friendly introduction to your organisation and what it does.",
    publicServices:
      "Services customers can obtain from you, for example business internet, fibre connectivity or hosting.",
    publicCoverage:
      "The areas where you provide services, for example Kampala, Wakiso and Mukono. Enter locations, not network maps or customer addresses.",
    publicWebsite:
      "Your organisation's public website, for example https://example.com.",
    publicContact:
      "A public business email or phone number that customers may contact. Avoid a private personal contact.",
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
      hint={fieldHints[name]}
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

  const removeExistingItem = (key: UploadKey, index: number) => {
    setExistingAttachments((current) => {
      const next = { ...current }
      const item = next[key]
      if (Array.isArray(item)) {
        const updated = item.filter((_, i) => i !== index)
        if (updated.length) next[key] = updated
        else delete next[key]
      } else {
        delete next[key]
      }
      return next
    })
  }

  const removeExistingFile = (key: UploadKey) => {
    setExistingAttachments((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  const updateEvidence = (key: Exclude<UploadKey, "publicLogo">, files: File[]) => {
    setEvidenceFiles(current => ({ ...current, [key]: files }))
    setUploads(current => {
      const next = { ...current }
      if (files.length) next[key] = files[0]
      else delete next[key]
      return next
    })
    setErrors(current => ({ ...current, [key]: "" }))
    setSaveState("unsaved")
    setServerError(null)
  }

  const addEvidence = (key: Exclude<UploadKey, "publicLogo">, selected: File[]) => {
    if (!selected.length) return
    if (selected.some(file => file.size > MAX_FILE_BYTES || !/\.(pdf|jpe?g|png)$/i.test(file.name) || (file.type && !["application/pdf", "image/jpeg", "image/png", "image/jpg"].includes(file.type)))) {
      setErrors(current => ({ ...current, [key]: "Choose PDF, JPG or PNG documents, each 10 MB or smaller." }))
      return
    }
    const files = [...(evidenceFiles[key] || [])]
    for (const file of selected) if (!files.some(existing => existing.name === file.name && existing.size === file.size && existing.type === file.type && existing.lastModified === file.lastModified)) files.push(file)
    updateEvidence(key, files)
  }

  const filePicker = (key: Exclude<UploadKey, "publicLogo">, label: string, hint: string) => {
    const current = evidenceFiles[key] || []
    const rawExisting = existingAttachments[key]
    const existingList: string[] = Array.isArray(rawExisting)
      ? rawExisting
      : rawExisting
        ? [rawExisting]
        : []
    const inputId = `application-${key}-file`

    return (
      <div
        className={`upload-control evidence-upload ${errors[key] ? "field-error" : ""}`}
        id={`application-${key}`}
        tabIndex={errors[key] ? -1 : undefined}
        key={key}
      >
        <span>
          <strong>
            {label} <b aria-hidden="true">*</b>
          </strong>
          <small>{hint}</small>
          <small id={`${inputId}-hint`}>Select one or more documents. You can add more files or remove them individually.</small>
        </span>
        <input
          id={inputId}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          multiple
          aria-label={`Add documents: ${label}`}
          aria-describedby={`${inputId}-hint`}
          style={{ display: "none" }}
          onChange={(event) => {
            addEvidence(key, Array.from(event.target.files || []))
            event.currentTarget.value = ""
          }}
        />
        {current.length ? (
          <div className="evidence-selection">
            <p className="evidence-count" role="status">{current.length} {current.length === 1 ? "document" : "documents"} selected</p>
            <ul className="evidence-document-list" aria-label={`Selected documents: ${label}`}>
              {current.map((file, index) => (
                <li key={`${file.name}-${file.size}-${file.lastModified}`}>
                  <span><strong>{file.name}</strong><small>{file.size < 1048576 ? Math.max(1, Math.ceil(file.size / 1024)) + " KB" : (file.size / 1048576).toFixed(1) + " MB"}</small></span>
                  <Button kind="ghost" aria-label={`Remove ${file.name}`} onClick={() => updateEvidence(key, current.filter((_, i) => i !== index))}>Remove</Button>
                </li>
              ))}
            </ul>
            <Button kind="secondary" onClick={() => document.getElementById(inputId)?.click()}>Add more documents</Button>
          </div>
        ) : existingList.length === 1 ? (
          <>
            <Tag tone="success">{existingList[0].split("/").pop() || "Uploaded document"}</Tag>
            <Button
              kind="secondary"
              type="button"
              onClick={() => window.open(getFileUrl(existingList[0]), "_blank")}
            >
              View
            </Button>
            <Button
              kind="secondary"
              type="button"
              onClick={() => {
                const a = document.createElement("a")
                a.href = getFileUrl(existingList[0])
                a.download = existingList[0].split("/").pop() || "document"
                a.target = "_blank"
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
              }}
            >
              Download
            </Button>
            <Button
              kind="secondary"
              type="button"
              onClick={() => document.getElementById(inputId)?.click()}
            >
              Replace
            </Button>
            <Button
              kind="secondary"
              type="button"
              onClick={() => removeExistingFile(key)}
            >
              Remove
            </Button>
          </>
        ) : existingList.length > 1 ? (
          <div className="evidence-selection">
            <p className="evidence-count" role="status">
              {existingList.length} saved documents
            </p>
            <ul className="evidence-document-list" aria-label={`Saved documents: ${label}`}>
              {existingList.map((filePath, index) => {
                const fileName = filePath.split("/").pop() || `Document ${index + 1}`
                return (
                  <li key={filePath}>
                    <span>
                      <Tag tone="success">{fileName}</Tag>
                    </span>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <Button
                        kind="ghost"
                        type="button"
                        onClick={() => window.open(getFileUrl(filePath), "_blank")}
                      >
                        View
                      </Button>
                      <Button
                        kind="ghost"
                        type="button"
                        onClick={() => {
                          const a = document.createElement("a")
                          a.href = getFileUrl(filePath)
                          a.download = fileName
                          a.target = "_blank"
                          document.body.appendChild(a)
                          a.click()
                          document.body.removeChild(a)
                        }}
                      >
                        Download
                      </Button>
                      <Button
                        kind="ghost"
                        type="button"
                        onClick={() => removeExistingItem(key, index)}
                      >
                        Remove
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
              <Button
                kind="secondary"
                type="button"
                onClick={() => document.getElementById(inputId)?.click()}
              >
                Upload new documents
              </Button>
              <Button
                kind="secondary"
                type="button"
                onClick={() => removeExistingFile(key)}
              >
                Remove all
              </Button>
            </div>
          </div>
        ) : (
          <Button
            kind="secondary"
            onClick={() => document.getElementById(inputId)?.click()}
          >
            Choose documents
          </Button>
        )}
        {errors[key] && <small className="inline-error">{errors[key]}</small>}
      </div>
    )
  }

  // Filter out empty string errors so the alert summary updates accurately
  const activeErrors = Object.entries(errors).filter(
    ([_, msg]) => Boolean(msg && msg.trim().length > 0),
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
                className={[
                  index === step ? "active" : "",
                  sectionComplete[index] ? "done" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={name}
              >
                <button
                  type="button"
                  disabled={index > furthestStep}
                  onClick={() => selectSection(index)}
                  aria-current={index === step ? "step" : undefined}
                  aria-label={`Section ${index + 1}: ${name}${sectionComplete[index] ? ", complete" : ""}`}
                  title={
                    index > furthestStep
                      ? "Complete the preceding sections to unlock this section."
                      : name
                  }
                >
                  <span aria-hidden="true">
                    {index + 1}
                    {sectionComplete[index] && <Icon name="check" size={11} />}
                  </span>
                  <strong>{name}</strong>
                </button>
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
                  ? serverError || "Check connection or highlighted fields."
                  : draftFeedback || "Saved to cloud & browser"}
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

          {/* Server Success Feedback */}
          {draftFeedback && (
            <div
              className="notice"
              style={{
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                color: "#166534",
                borderColor: "#bbf7d0",
                backgroundColor: "#f0fdf4",
              }}
              role="status"
            >
              <Icon name="check" size={18} />
              <p style={{ margin: 0, fontWeight: 500 }}>{draftFeedback}</p>
            </div>
          )}

          {/* Server & Validation Errors */}
          {(serverError || activeErrors.length > 0) && (
            <div
              className="error-summary"
              ref={errorSummary}
              tabIndex={-1}
              role="alert"
            >
              <strong>
                {serverError
                  ? "Please review the following:"
                  : "Check the highlighted information."}
              </strong>
              {serverError && <p>{serverError}</p>}
              {activeErrors.length > 0 && (
                <>
                  <p>
                    Complete {activeErrors.length} required{" "}
                    {activeErrors.length === 1 ? "item" : "items"} before
                    continuing:
                  </p>
                  <ul style={{ margin: "0.5rem 0 0 1.25rem", padding: 0 }}>
                    {activeErrors.map(([key, msg]) => (
                      <li key={key}>{msg}</li>
                    ))}
                  </ul>
                </>
              )}
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
                {input("ugandaAddress", "Post Office Box Number")}
                {input("businessPhone", "Main business phone")}
                {input("website", "Website", undefined, true)}
              </div>
              <p className="helper">
                Your email will be used to log in and review your application
                status.
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
                  input("pdpoValidity", "PDPO validity", [
                    ...Array.from({ length: 10 }, (_, index) => ({ value: String(index + 1), label: `${index + 1} ${index === 0 ? "year" : "years"}` })),
                    ...(values.pdpoValidity && !/^(?:[1-9]|10)$/.test(String(values.pdpoValidity)) ? [{ value: String(values.pdpoValidity), label: `${values.pdpoValidity} (saved value)` }] : []),
                  ], true)}
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
                {input("tin", "TIN")}
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
                "For example, a certificate of incorporation, registration certificate or official document establishing the organisation. PDF, JPG or PNG, up to 10 MB.",
              )}
              {values.licenceRelevant === "Yes" &&
                filePicker(
                  "licenceEvidence",
                  "Relevant licence evidence",
                  "A copy of the licence relevant to the services declared in section three. PDF, JPG or PNG, up to 10 MB.",
                )}
              {filePicker(
                "authorityEvidence",
                "Representative authority evidence",
                "For example, a signed authorisation letter or board resolution naming the applicant or membership representative and their authority to apply. PDF, JPG or PNG, up to 10 MB.",
              )}
              {values.pdpoStatus === "Registered" &&
                filePicker(
                  "pdpoEvidence",
                  "PDPO evidence",
                  "Your PDPO registration certificate or supporting document showing its current validity. PDF, JPG or PNG, up to 10 MB.",
                )}
            </section>
          )}

          {step === 6 && (
            <section className="form-section">
              <p>These answers are optional and do not block submission. Public profile details and your logo are published only with your consent and separate profile approval.</p>
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
                {uploads.publicLogo ? (
                  <>
                    <Tag tone="success">{uploads.publicLogo.name}</Tag>
                    <Button
                      kind="secondary"
                      onClick={() =>
                        document
                          .getElementById("application-publicLogo-file")
                          ?.click()
                      }
                    >
                      Replace logo
                    </Button>
                    <Button
                      kind="secondary"
                      onClick={() => removeFile("publicLogo")}
                    >
                      Remove
                    </Button>
                  </>
                ) : existingAttachments.publicLogo ? (
                  <>
                    <Tag tone="success">
                      {Array.isArray(existingAttachments.publicLogo)
                        ? existingAttachments.publicLogo[0]?.split("/").pop() || "Logo"
                        : existingAttachments.publicLogo.split("/").pop() || "Logo"}
                    </Tag>
                    <Button
                      kind="secondary"
                      type="button"
                      onClick={() =>
                        window.open(
                          getFileUrl(
                            Array.isArray(existingAttachments.publicLogo)
                              ? existingAttachments.publicLogo[0]
                              : existingAttachments.publicLogo!,
                          ),
                          "_blank",
                        )
                      }
                    >
                      View
                    </Button>
                    <Button
                      kind="secondary"
                      type="button"
                      onClick={() => {
                        const path = Array.isArray(existingAttachments.publicLogo)
                          ? existingAttachments.publicLogo[0]
                          : existingAttachments.publicLogo!
                        const a = document.createElement("a")
                        a.href = getFileUrl(path)
                        a.download = path.split("/").pop() || "logo"
                        a.target = "_blank"
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                      }}
                    >
                      Download
                    </Button>
                    <Button
                      kind="secondary"
                      type="button"
                      onClick={() =>
                        document
                          .getElementById("application-publicLogo-file")
                          ?.click()
                      }
                    >
                      Replace logo
                    </Button>
                    <Button
                      kind="secondary"
                      type="button"
                      onClick={() => removeExistingFile("publicLogo")}
                    >
                      Remove
                    </Button>
                  </>
                ) : (
                  <Button
                    kind="secondary"
                    onClick={() =>
                      document
                        .getElementById("application-publicLogo-file")
                        ?.click()
                    }
                  >
                    Choose logo
                  </Button>
                )}
                {errors.publicLogo && (
                  <small className="inline-error">{errors.publicLogo}</small>
                )}
              </div>
              <Button kind="secondary" onClick={() => { setFurthestStep(current => Math.max(current, 7)); setStep(7) }}>
                Complete public profile later
              </Button>
            </section>
          )}

          {step === 7 && (
            <>
              <ApplicationReviewSummary
                sections={applicationSectionNames}
                fields={stepFields}
                values={{ ...values, requestedTier: tiers.find(tier => tier.id === String(values.requestedTier))?.name || values.requestedTier || "" }}
                evidence={[
                  ...Object.entries(existingAttachments)
                    .filter(([category]) => !(evidenceFiles[category as Exclude<UploadKey, "publicLogo">]?.length) && !uploads[category as UploadKey])
                    .flatMap(([category, reference]) => {
                      if (Array.isArray(reference)) {
                        return reference.map((ref, idx) => ({
                          id: `saved-${category}-${idx}`,
                          category,
                          name: ref.split("/").pop() || "Uploaded document",
                          size: 0,
                          type: "",
                        }))
                      }
                      return reference
                        ? [
                            {
                              id: `saved-${category}`,
                              category,
                              name: reference.split("/").pop() || "Uploaded document",
                              size: 0,
                              type: "",
                            },
                          ]
                        : []
                    }),
                  ...Object.entries(evidenceFiles).flatMap(([category, files]) =>
                    (files || []).map((file, index) => ({
                      id: `selected-${category}-${index}`,
                      category,
                      name: file.name,
                      size: file.size,
                      type: file.type,
                    })),
                  ),
                  ...(uploads.publicLogo
                    ? [
                        {
                          id: "selected-logo",
                          category: "publicLogo",
                          name: uploads.publicLogo.name,
                          size: uploads.publicLogo.size,
                          type: uploads.publicLogo.type,
                        },
                      ]
                    : []),
                ]}
                onEdit={selectSection}
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
                  You can no longer edit the submitted version unless the
                  membership team requests clarification.
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

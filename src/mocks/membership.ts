import type {
  Application,
  Stage,
  WorkspaceState,
} from "../features/membership/types/workspace.ts"
const names = [
  "MTN",
  "Airtel",
  "StarLink",
  "LycaMobile",
  "Liquid Telecom",
  "Bunyoro Internet Ltd",
  "Lakeside Broadband Ltd",
  "Mawingu Research Network",
]
const statuses: Stage[] = [
  "Submitted",
  "Clarification needed",
  "Decision pending",
  "Approved awaiting payment",
  "Active",
  "Deferred",
  "Draft",
  "Active",
]
export function createDemoState(): WorkspaceState {
  const applications: Application[] = names.map((name, i) => {
    const stage = statuses[i]
    const date = `2026-10-${String(12 + i).padStart(2, "0")}T09:00:00.000Z`
    return {
      id: `APP-2026-${String(i + 101).padStart(4, "0")}`,
      organisationId: `org-${i + 1}`,
      organisation: name,
      requestedTier: i % 3 === 0 ? "Platinum" : "Silver",
      confirmedTier: ["Active", "Approved awaiting payment"].includes(stage)
        ? "Silver"
        : undefined,
      stage,
      submittedAt: stage === "Draft" ? undefined : date,
      updatedAt: date,
      reviewer: i % 2 ? "ISPAU Admin" : "Unassigned",
      values: {
        legalName: name,
        businessEmail: `office@company${i + 1}.example`,
        businessPhone: "+256 000 000 000",
        registeredAddress: "Example business park, Uganda",
        registrationCountry: "Uganda",
        applicantName: "Application contact",
        applicantEmail: `applicant@company${i + 1}.example`,
        representativeName: "Membership representative",
        representativeEmail: `representative@company${i + 1}.example`,
        directoryConsent: i === 4,
        promotionalConsent: false,
      },
      evidence:
        stage === "Draft"
          ? []
          : [
              {
                id: `e-${i}`,
                name: "registration-certificate.pdf",
                size: 120000,
                type: "application/pdf",
                category: "registrationEvidence",
              },
            ],
      verifications: [
        "Decision pending",
        "Active",
        "Approved awaiting payment",
      ].includes(stage)
        ? [
            "Organisation registration",
            "Representative authority",
            "Applicable regulatory evidence",
          ].map((label) => ({
            label,
            result: "Verified" as const,
            reviewer: "ISPAU Admin",
            date,
            note: "Sample verification record.",
          }))
        : [],
      clarifications:
        stage === "Clarification needed"
          ? [
              {
                id: "clarification-seed",
                items: [
                  "Clarify the licence holder name.",
                  "Provide representative authority confirmation.",
                ],
                requestedBy: "ISPAU Admin",
                date,
              },
            ]
          : [],
      decisions: ["Active", "Approved awaiting payment", "Deferred"].includes(
        stage,
      )
        ? [
            {
              outcome: stage === "Deferred" ? "Defer" : "Approve",
              reason:
                stage === "Deferred"
                  ? "The communicated representative authority needs further confirmation. Contact the Secretariat to discuss the next submission."
                  : "Sample admission decision following verification.",
              tier: "Silver",
              actor: "ISPAU Admin",
              date,
            },
          ]
        : [],
      activity: [
        {
          id: `activity-${i}`,
          date,
          actor: "Record creation",
          text:
            stage === "Draft"
              ? "Draft application created"
              : `Application recorded: ${stage}`,
        },
      ],
      eligible: stage === "Active",
      profileApproved: stage === "Active",
      consent: i === 4,
      profile: {
        name,
        description: "Internet connectivity and business network services.",
        services: "Fibre connectivity, Business internet",
        coverage: "Kampala, Western Uganda",
        website: `https://company${i + 1}.example`,
        contact: `public@company${i + 1}.example`,
      },
      standing: "Current",
      tradeCreditAccess:
        stage === "Active"
          ? {
              enabled: true,
              actor: "ISPAU Admin",
              date,
              reason:
                "Sample membership account provisioned for service access.",
            }
          : undefined,
      portalAccess: true,
      memberId: stage === "Active" ? `DEMO-ISPAU-00${i + 1}` : undefined,
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
    }
  })
  return {
    version: 1,
    applications,
    nextMemberNumber: 20,
    notices: [],
    invoices: applications
      .filter((a) => ["Active", "Approved awaiting payment"].includes(a.stage))
      .map((a, i) => ({
        id: `PF-DEMO-${101 + i}`,
        applicationId: a.id,
        amount: 500,
        currency: "USD",
        periodStart: a.periodStart,
        periodEnd: a.periodEnd,
        status: a.stage === "Active" ? "Confirmed" : "Awaiting payment",
        confirmedBy: a.stage === "Active" ? "ISPAU Admin" : undefined,
      })),
  }
}

// Update example labels while preserving edited records, IDs and workflow history.
export function refreshExampleRecords(state: WorkspaceState): WorkspaceState {
  const previousNames: Record<string, string[]> = {
    "org-1": ["Kijani Fibre Cooperative", "MTN (demo)"],
    "org-2": ["Rwenzori Connect Ltd", "Airtel (demo)"],
    "org-3": ["NileLink Networks", "StarLink (demo)"],
    "org-4": ["Savanna Wireless Ltd", "LycaMobile (demo)"],
    "org-5": [
      "Acacia Digital Cooperative",
      "MTN Uganda (demo)",
      "Example ISP Ltd (demo)",
      "Liquid Telecom (demo)",
    ],
  }
  const previousCopy: Record<string, string> = {
    "Demo business park, Uganda": "Example business park, Uganda",
    "Demo applicant": "Application contact",
    "Demo representative": "Membership representative",
    "fictional-registration.pdf": "registration-certificate.pdf",
    "Fictional verification for this demonstration.":
      "Sample verification record.",
    "Demonstration decision following recorded checks.":
      "Sample admission decision following verification.",
    "Demo setup": "Record creation",
    "A fictional connectivity organisation used to demonstrate the ISPAU member directory.":
      "Internet connectivity and business network services.",
    "Staff-provisioned fictional member account for the demonstration.":
      "Sample membership account provisioned for service access.",
    "Consolidated clarification requested; email simulated":
      "Clarification request recorded; notification prepared",
    "Membership activated and welcome notice simulated":
      "Membership activated; welcome notice prepared",
    "Application submitted; acknowledgement simulated":
      "Application recorded; acknowledgement prepared",
  }
  const clean = (value: string) =>
    previousCopy[value] ||
    value.replace(
      / simulated; no real email sent$/,
      " prepared; delivery pending",
    )
  return {
    ...state,
    applications: state.applications.map((application) => {
      const previous = previousNames[application.organisationId] || []
      const renamed = previous.includes(application.organisation)
      const name = renamed
        ? names[Number(application.organisationId.slice(4)) - 1]
        : application.organisation
      return {
        ...application,
        organisation: name,
        values: Object.fromEntries(
          Object.entries(application.values).map(([key, value]) => [
            key,
            typeof value === "string"
              ? key === "legalName" && renamed && previous.includes(value)
                ? name
                : clean(value)
              : value,
          ]),
        ),
        profile: {
          ...application.profile,
          name:
            renamed && previous.includes(application.profile.name)
              ? name
              : application.profile.name,
          description: clean(application.profile.description),
        },
        evidence: application.evidence.map((file) => ({
          ...file,
          name: clean(file.name),
        })),
        verifications: application.verifications.map((check) => ({
          ...check,
          note: clean(check.note),
        })),
        decisions: application.decisions.map((decision) => ({
          ...decision,
          reason: clean(decision.reason),
        })),
        activity: application.activity.map((item) => ({
          ...item,
          actor: clean(item.actor),
          text: clean(item.text),
        })),
        tradeCreditAccess: application.tradeCreditAccess
          ? {
              ...application.tradeCreditAccess,
              reason: clean(application.tradeCreditAccess.reason),
            }
          : undefined,
      }
    }),
  }
}

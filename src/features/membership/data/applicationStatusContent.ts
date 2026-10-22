import type { ApplicationStatus } from "@/types/ApplicationStatus"

export const applicationStatusContent: Record<
  ApplicationStatus,
  {
    tone: "neutral" | "info" | "warning" | "success" | "danger"
    title: string
    text: string
  }
> = {
  Draft: {
    tone: "neutral",
    title: "Your draft is ready to continue.",
    text: "Incomplete drafts can be saved without validating every required field.",
  },
  Submitted: {
    tone: "info",
    title: "Your application has been submitted.",
    text: "The membership team has received application ISPAU-APP-2026-0018.",
  },
  "Under review": {
    tone: "info",
    title: "The membership team is reviewing your application.",
    text: "You will be contacted if one consolidated clarification response is needed.",
  },
  "Clarification needed": {
    tone: "warning",
    title: "We need a little more information.",
    text: "Respond to the consolidated request. Your previous answers are preserved.",
  },
  "Decision pending": {
    tone: "warning",
    title: "Verification is complete and a decision is pending.",
    text: "An authorised decision maker will record the outcome and final tier.",
  },
  "Approved awaiting payment": {
    tone: "success",
    title: "Your application is approved. Payment is the next step.",
    text: "Membership becomes active only after Accounts confirms actual receipt.",
  },
  Active: {
    tone: "success",
    title: "Your membership is active.",
    text: "Member ID ISPAU-M-0018 remains stable through future renewals.",
  },
  Deferred: {
    tone: "warning",
    title: "A decision has been deferred.",
    text: "Recorded explanation: Additional operating-authorisation review is required before a final decision.",
  },
  Declined: {
    tone: "danger",
    title: "The application was declined.",
    text: "Recorded explanation: The submitted organisation category is not currently eligible under the approved membership rules.",
  },
}

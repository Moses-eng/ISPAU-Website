import type { Actor, Application } from "@/features/membership/types/workspace"
import PageHeader from "@/components/dashboard/PageHeader"
import SectionNavigation from "@/components/dashboard/SectionNavigation"
import OrganisationDetailsEditor from "./OrganisationDetailsEditor"
import ProfileEditor from "@/features/membership/components/ProfileEditor"
export default function MemberCompany({
  application,
  actor,
  section,
  navigate,
  feedback,
}: {
  application: Application
  actor: Actor
  section: string
  navigate: (route: string) => void
  feedback: (text: string, error?: boolean) => void
}) {
  const profile = section === "profile"
  return (
    <>
      <PageHeader
        title="Company"
        description="Manage your organisation, representatives and approved public directory profile."
      />
      <SectionNavigation
        label="Company sections"
        items={[
          { id: "company", label: "Company details" },
          { id: "profile", label: "Directory profile" },
        ]}
        current={profile ? "profile" : "company"}
        onSelect={navigate}
      />
      {profile ? (
        <ProfileEditor
          application={application}
          actor={actor}
          feedback={feedback}
        />
      ) : (
        <OrganisationDetailsEditor
          application={application}
          actor={actor}
          section="company"
          compact
          feedback={feedback}
        />
      )}
    </>
  )
}

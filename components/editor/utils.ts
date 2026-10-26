import type { Issue, SectionId } from "@/lib/audit/validation"

export function fieldIssue(
  issues: Issue[],
  section: SectionId,
  needle: string
): Issue | undefined {
  return issues.find(
    (issue) =>
      issue.section === section &&
      issue.level === "error" &&
      issue.message.toLowerCase().includes(needle.toLowerCase())
  )
}

export function issuesForFinding(issues: Issue[], key: string): Issue[] {
  return issues.filter((issue) => issue.findingId === key)
}

export function plural(count: number, singular: string, pluralForm?: string) {
  return `${count} ${count === 1 ? singular : (pluralForm ?? `${singular}s`)}`
}

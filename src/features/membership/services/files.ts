import type { FileRecord } from "../types/workspace"
const files = new Map<string, File>()
export function acceptFile(file: File, category: string): FileRecord {
  if (file.size > 10 * 1024 * 1024)
    throw Error("Each file must be 10 MB or smaller.")
  if (
    !/\.(pdf|jpe?g|png)$/i.test(file.name) ||
    !["application/pdf", "image/jpeg", "image/png"].includes(file.type)
  )
    throw Error("Use a PDF, JPG or PNG file.")
  const id = crypto.randomUUID()
  files.set(id, file)
  return { id, name: file.name, size: file.size, type: file.type, category }
}
export function getLocalFile(id: string) {
  return files.get(id)
}
const urls = new Map<string, string>()
export function getLocalUrl(reference?: string) {
  if (!reference?.startsWith("local:"))
    return reference && /^https?:\/\//.test(reference) ? reference : ""
  const id = reference.slice(6),
    file = files.get(id)
  if (!file) return ""
  if (!urls.has(id)) urls.set(id, URL.createObjectURL(file))
  return urls.get(id)!
}

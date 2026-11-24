import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from "react"
import PageHeader from "@/components/dashboard/PageHeader"
import DataTable from "@/components/dashboard/DataTable"
import Dialog from "@/components/dashboard/Dialog"
import FormField from "@/components/dashboard/FormField"
import Button from "@/components/ui/Button"
import systemUsersService from "@/apiServices/systemUsersService"
import heroSlideService, {
  type HeroSlide,
  type HeroSlideStatus,
} from "@/apiServices/heroSlideService"
import bannerService, {
  type Banner,
  type BannerStatus,
} from "@/apiServices/bannerService"
import tierService, {
  type Tier,
  type TierStatus,
} from "@/apiServices/tierService"
import { BASE_URL } from "@/apiServices/env"

type SettingTab = "home" | "banner" | "tiers"

// Helper to resolve backend image paths to absolute URLs
function resolveImageUrl(path: string): string {
  if (!path) return ""
  const base = BASE_URL+"/"+path
  return base
}

export default function Settings() {
  const currentUser = systemUsersService.getUser()
  const isSuperAdmin = currentUser?.role === "super_admin"

  const [tab, setTab] = useState<SettingTab>("home")
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState("")
  const [notice, setNotice] = useState("")

  // Live datasets
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [tiers, setTiers] = useState<Tier[]>([])

  // Modal editing state
  const [editingItem, setEditingItem] = useState<HeroSlide | Banner | Tier | null>(null)
  const [isNew, setIsNew] = useState(false)

  // Form image handling
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [previewImageUrl, setPreviewImageUrl] = useState<string>("")

  // ============================================================
  // FETCH ALL DATA FROM API
  // ============================================================
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setFailure("")

    try {
      const [slidesRes, bannersRes, tiersRes] = await Promise.all([
        heroSlideService.list(),
        bannerService.list(),
        tierService.list(),
      ])

      if (slidesRes.success) setHeroSlides(slidesRes.data)
      if (bannersRes.success) setBanners(bannersRes.data)
      if (tiersRes.success) setTiers(tiersRes.data)
    } catch (e) {
      setFailure("Failed to load settings from server. Please refresh.")
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  // Permission guard
  if (!isSuperAdmin) {
    return (
      <p className="workspace-feedback error" role="alert">
        Only Super Admin accounts can manage site settings.
      </p>
    )
  }

  // ============================================================
  // MODAL HANDLERS
  // ============================================================
  const openModal = (item?: HeroSlide | Banner | Tier) => {
    setFailure("")
    setNotice("")
    setSelectedImageFile(null)

    if (item) {
      setIsNew(false)
      setEditingItem(item)

      if ("src" in item) {
        setPreviewImageUrl(resolveImageUrl(item.src))
      } else if ("image" in item) {
        setPreviewImageUrl(resolveImageUrl(item.image))
      } else {
        setPreviewImageUrl("")
      }
    } else {
      setIsNew(true)
      setPreviewImageUrl("")

      if (tab === "home") {
        setEditingItem({
          id: "",
          src: "",
          caption: "",
          description: "",
          credit: "",
          sort_order: heroSlides.length,
          status: "active",
          created_at: null,
          updated_at: null,
        } as HeroSlide)
      } else if (tab === "banner") {
        setEditingItem({
          id: "",
          image: "",
          name: "",
          description: "",
          page_name: "about",
          status: "active",
          created_at: null,
          updated_at: null,
        } as Banner)
      } else {
        setEditingItem({
          id: "",
          name: "",
          cost: 0,
          description: "",
          status: "active",
          created_at: null,
          updated_at: null,
        } as Tier)
      }
    }
  }

  const closeModal = () => {
    if (busy) return
    setEditingItem(null)
    setSelectedImageFile(null)
    setPreviewImageUrl("")
    setFailure("")
  }

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5242880) {
      setFailure("Please select an image smaller than 5 MB.")
      return
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setFailure("Only JPG, PNG, and WebP images are supported.")
      return
    }

    setFailure("")
    setSelectedImageFile(file)
    setPreviewImageUrl(URL.createObjectURL(file))
  }

  // ============================================================
  // DELETE ACTIONS
  // ============================================================
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return
    setBusy(true)
    setFailure("")
    setNotice("")

    try {
      if (tab === "home") {
        const res = await heroSlideService.remove(id)
        if (res.success) {
          setNotice("Hero slide deleted successfully.")
          await fetchData(true)
        } else {
          setFailure(res.message || "Failed to delete slide.")
        }
      } else if (tab === "banner") {
        const res = await bannerService.remove(id)
        if (res.success) {
          setNotice("Banner deleted successfully.")
          await fetchData(true)
        } else {
          setFailure(res.message || "Failed to delete banner.")
        }
      } else {
        const res = await tierService.remove(id)
        if (res.success) {
          setNotice("Membership tier deleted successfully.")
          await fetchData(true)
        } else {
          setFailure(res.message || "Failed to delete tier.")
        }
      }
    } catch (e) {
      setFailure("An error occurred during deletion.")
    } finally {
      setBusy(false)
    }
  }

  // ============================================================
  // FORM SUBMIT (CREATE / UPDATE)
  // ============================================================
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingItem || busy) return

    const data = new FormData(event.currentTarget)
    const getText = (name: string) => String(data.get(name) || "").trim()

    setBusy(true)
    setFailure("")
    setNotice("")

    try {
      // 1. HOME SLIDERS
      if (tab === "home") {
        const caption = getText("caption")
        const description = getText("description")
        const credit = getText("credit") || null
        const sort_order = parseInt(getText("sort_order")) || 0
        const status = getText("status") as HeroSlideStatus

        if (isNew) {
          if (!selectedImageFile) {
            setFailure("Please select an image file for the new hero slide.")
            setBusy(false)
            return
          }

          const res = await heroSlideService.create({
            image: selectedImageFile,
            caption,
            description,
            credit,
            sort_order,
            status,
          })

          if (res.success) {
            setNotice("Hero slide added successfully.")
            closeModal()
            await fetchData(true)
          } else {
            setFailure(res.message || "Failed to create hero slide.")
          }
        } else {
          const res = await heroSlideService.update(editingItem.id, {
            caption,
            description,
            credit,
            sort_order,
            status,
            image: selectedImageFile || undefined,
          })

          if (res.success) {
            setNotice("Hero slide updated successfully.")
            closeModal()
            await fetchData(true)
          } else {
            setFailure(res.message || "Failed to update hero slide.")
          }
        }
      }

      // 2. BANNERS
      else if (tab === "banner") {
        const name = getText("name")
        const description = getText("description") || null
        const page_name = getText("page_name").toLowerCase()
        const status = getText("status") as BannerStatus

        if (isNew) {
          if (!selectedImageFile) {
            setFailure("Please select an image file for the banner.")
            setBusy(false)
            return
          }

          const res = await bannerService.create({
            image: selectedImageFile,
            name,
            description,
            page_name,
            status,
          })

          if (res.success) {
            setNotice("Banner added successfully.")
            closeModal()
            await fetchData(true)
          } else {
            setFailure(res.message || "Failed to create banner.")
          }
        } else {
          const res = await bannerService.update(editingItem.id, {
            name,
            description,
            page_name,
            status,
            image: selectedImageFile || undefined,
          })

          if (res.success) {
            setNotice("Banner updated successfully.")
            closeModal()
            await fetchData(true)
          } else {
            setFailure(res.message || "Failed to update banner.")
          }
        }
      }

      // 3. MEMBERSHIP TIERS
      else if (tab === "tiers") {
        const name = getText("name")
        const cost = parseFloat(getText("cost")) || 0
        const description = getText("description") || null
        const status = getText("status") as TierStatus

        if (isNew) {
          const res = await tierService.create({
            name,
            cost,
            description,
            status,
          })

          if (res.success) {
            setNotice("Membership tier created successfully.")
            closeModal()
            await fetchData(true)
          } else {
            setFailure(res.message || "Failed to create tier.")
          }
        } else {
          const res = await tierService.update(editingItem.id, {
            name,
            cost,
            description,
            status,
          })

          if (res.success) {
            setNotice("Membership tier updated successfully.")
            closeModal()
            await fetchData(true)
          } else {
            setFailure(res.message || "Failed to update tier.")
          }
        }
      }
    } catch (e) {
      setFailure("An unexpected error occurred while saving.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage live public website images, banners, and membership tiers."
      />

      {failure && (
        <p className="workspace-feedback error" role="alert">
          {failure}
        </p>
      )}

      {notice && (
        <p className="workspace-feedback" role="status">
          {notice}
        </p>
      )}

      {/* Navigation tabs */}
      <nav className="workspace-actions mb-5" aria-label="Site settings navigation">
        {[
          ["home", "Home slider"],
          ["banner", "Banner"],
          ["tiers", "Membership tiers"],
        ].map(([id, label]) => (
          <Button
            key={id}
            kind={tab === id ? "primary" : "secondary"}
            aria-pressed={tab === id}
            onClick={() => {
              setTab(id as SettingTab)
              setNotice("")
              setFailure("")
            }}
          >
            {label}
          </Button>
        ))}
      </nav>

      {/* Panel view */}
      <section className="workspace-panel">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <h2>
            {tab === "home"
              ? "Home slider images"
              : tab === "banner"
              ? "Page banners"
              : "Membership tiers"}
          </h2>
          <Button onClick={() => openModal()} disabled={loading || busy}>
            {tab === "tiers" ? "Add tier" : "Add image"}
          </Button>
        </div>

        {loading ? (
          <p style={{ padding: "32px 0", textAlign: "center", color: "var(--muted)" }}>
            Loading configuration data…
          </p>
        ) : tab === "tiers" ? (
          <DataTable
            rows={tiers}
            rowKey={(t) => t.id}
            label="Membership tier settings"
            columns={[
              { label: "Name", cell: (t) => <strong>{t.name}</strong> },
              {
                label: "Annual cost",
                cell: (t) => `USD ${Number(t.cost).toLocaleString()}`,
              },
              { label: "Description", cell: (t) => t.description || "—" },
              {
                label: "Status",
                cell: (t) => (
                  <span
                    className={`tag ${
                      t.status === "active"
                        ? "tag-success"
                        : t.status === "inactive"
                        ? "tag-warning"
                        : "tag-danger"
                    }`}
                  >
                    {t.status}
                  </span>
                ),
              },
              {
                label: "Actions",
                cell: (t) => (
                  <div className="workspace-actions" style={{ margin: 0, gap: "6px" }}>
                    <Button kind="secondary" onClick={() => openModal(t)}>
                      Edit
                    </Button>
                    <Button kind="danger" onClick={() => void handleDelete(t.id)}>
                      Delete
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        ) : tab === "banner" ? (
          <DataTable
            rows={banners}
            rowKey={(b) => b.id}
            label="Page banners"
            columns={[
              {
                label: "Image",
                cell: (b) => (
                  <img
                    src={resolveImageUrl(b.image)}
                    alt={b.name}
                    style={{
                      width: 100,
                      height: 64,
                      objectFit: "cover",
                      borderRadius: 6,
                      border: "1px solid var(--border)",
                    }}
                  />
                ),
              },
              {
                label: "Name / Route",
                cell: (b) => (
                  <>
                    <strong>{b.name}</strong>
                    <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)" }}>
                      Page: <code style={{ color: "var(--primary)" }}>{b.page_name}</code>
                    </p>
                  </>
                ),
              },
              { label: "Description", cell: (b) => b.description || "—" },
              {
                label: "Status",
                cell: (b) => (
                  <span
                    className={`tag ${
                      b.status === "active"
                        ? "tag-success"
                        : b.status === "inactive"
                        ? "tag-warning"
                        : "tag-danger"
                    }`}
                  >
                    {b.status}
                  </span>
                ),
              },
              {
                label: "Actions",
                cell: (b) => (
                  <div className="workspace-actions" style={{ margin: 0, gap: "6px" }}>
                    <Button kind="secondary" onClick={() => openModal(b)}>
                      Edit
                    </Button>
                    <Button kind="danger" onClick={() => void handleDelete(b.id)}>
                      Delete
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        ) : (
          <DataTable
            rows={heroSlides}
            rowKey={(s) => s.id}
            label="Home hero slider images"
            columns={[
              {
                label: "Image",
                cell: (s) => (
                  <img
                    src={resolveImageUrl(s.src)}
                    alt={s.caption}
                    style={{
                      width: 100,
                      height: 64,
                      objectFit: "cover",
                      borderRadius: 6,
                      border: "1px solid var(--border)",
                    }}
                  />
                ),
              },
              {
                label: "Caption / Credit",
                cell: (s) => (
                  <>
                    <strong>{s.caption}</strong>
                    <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)" }}>
                      {s.credit ? `Photo: ${s.credit}` : "No credit assigned"}
                    </p>
                  </>
                ),
              },
              { label: "Description", cell: (s) => s.description || "—" },
              { label: "Order", cell: (s) => s.sort_order },
              {
                label: "Status",
                cell: (s) => (
                  <span
                    className={`tag ${
                      s.status === "active"
                        ? "tag-success"
                        : s.status === "inactive"
                        ? "tag-warning"
                        : "tag-danger"
                    }`}
                  >
                    {s.status}
                  </span>
                ),
              },
              {
                label: "Actions",
                cell: (s) => (
                  <div className="workspace-actions" style={{ margin: 0, gap: "6px" }}>
                    <Button kind="secondary" onClick={() => openModal(s)}>
                      Edit
                    </Button>
                    <Button kind="danger" onClick={() => void handleDelete(s.id)}>
                      Delete
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </section>

      {/* Edit / Add Dialog */}
      {editingItem && (
        <Dialog
          title={
            tab === "tiers"
              ? isNew
                ? "New Membership Tier"
                : "Edit Membership Tier"
              : tab === "banner"
              ? isNew
                ? "New Banner"
                : "Edit Banner"
              : isNew
              ? "New Hero Slide"
              : "Edit Hero Slide"
          }
          onClose={closeModal}
        >
          <form key={editingItem.id || "new-item"} onSubmit={submit}>
            {failure && (
              <p className="workspace-feedback error" role="alert">
                {failure}
              </p>
            )}

            {/* TAB: MEMBERSHIP TIERS */}
            {tab === "tiers" && "cost" in editingItem ? (
              <>
                <FormField
                  name="name"
                  label="Tier name"
                  value={editingItem.name}
                  required
                />
                <label className="field">
                  <span>Annual cost (USD) *</span>
                  <input
                    name="cost"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    defaultValue={editingItem.cost}
                  />
                </label>
                <FormField
                  name="description"
                  label="Description"
                  value={editingItem.description || ""}
                  multiline
                />
              </>
            ) : tab === "banner" && "page_name" in editingItem ? (
              /* TAB: BANNERS */
              <>
                <FormField
                  name="name"
                  label="Banner Name / Label"
                  value={editingItem.name}
                  required
                />
                <FormField
                  name="page_name"
                  label="Target Page (e.g., about, home)"
                  value={editingItem.page_name}
                  required
                />
                <FormField
                  name="description"
                  label="Description / Caption"
                  value={editingItem.description || ""}
                  multiline
                />
                <label className="field">
                  <span>
                    Upload Image · JPG, PNG, WebP (up to 5 MB){" "}
                    {isNew && <strong style={{ color: "#d32f2f" }}>*</strong>}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    required={isNew}
                    disabled={busy}
                    onChange={handleImageChange}
                  />
                </label>

                {previewImageUrl && (
                  <div style={{ marginTop: "12px", marginBottom: "16px" }}>
                    <span style={{ fontSize: "12px", color: "var(--muted)" }}>Image Preview:</span>
                    <img
                      src={previewImageUrl}
                      alt="Banner Preview"
                      style={{
                        width: "100%",
                        maxHeight: 220,
                        objectFit: "cover",
                        borderRadius: 8,
                        marginTop: 4,
                        border: "1px solid var(--border)",
                      }}
                    />
                  </div>
                )}
              </>
            ) : (
              /* TAB: HERO SLIDER */
              <>
                <FormField
                  name="caption"
                  label="Slide Caption"
                  value={"caption" in editingItem ? editingItem.caption : ""}
                  required
                />
                <FormField
                  name="description"
                  label="Description / Alt text"
                  value={editingItem.description || ""}
                  multiline
                  required
                />
                <FormField
                  name="credit"
                  label="Photo Credit"
                  value={"credit" in editingItem ? editingItem.credit || "" : ""}
                />
                <label className="field">
                  <span>Display Sort Order</span>
                  <input
                    name="sort_order"
                    type="number"
                    min="0"
                    defaultValue={"sort_order" in editingItem ? editingItem.sort_order : 0}
                  />
                </label>

                <label className="field">
                  <span>
                    Upload Slide Image · JPG, PNG, WebP (up to 5 MB){" "}
                    {isNew && <strong style={{ color: "#d32f2f" }}>*</strong>}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    required={isNew}
                    disabled={busy}
                    onChange={handleImageChange}
                  />
                </label>

                {previewImageUrl && (
                  <div style={{ marginTop: "12px", marginBottom: "16px" }}>
                    <span style={{ fontSize: "12px", color: "var(--muted)" }}>Slide Preview:</span>
                    <img
                      src={previewImageUrl}
                      alt="Hero Slide Preview"
                      style={{
                        width: "100%",
                        maxHeight: 220,
                        objectFit: "cover",
                        borderRadius: 8,
                        marginTop: 4,
                        border: "1px solid var(--border)",
                      }}
                    />
                  </div>
                )}
              </>
            )}

            <FormField
              name="status"
              label="Status"
              options={["active", "inactive", "archived"]}
              value={editingItem.status}
              required
            />

            <div className="workspace-actions mt-5">
              <Button type="submit" disabled={busy}>
                {busy ? "Saving…" : isNew ? "Create" : "Save Changes"}
              </Button>
              <Button kind="secondary" disabled={busy} onClick={closeModal}>
                Cancel
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </>
  )
}

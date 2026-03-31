import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";

// ─── Constantes ───────────────────────────────────────────────
const CATEGORIES = ["Abaya", "Jiba", "Pyjama", "Robe", "Set", "Sac", "Manteau", "Kids", "MDB", "Écharpe"];
const TAILLES    = ["36", "38", "40", "42", "44", "46", "48", "50", "52"];
const STORAGE_BUCKET = "products";

const EMPTY_FORM = {
  name: "", category: CATEGORIES[0], description: "",
  price: "", stock: "", is_active: true,
  sizes: [], existingPhotos: [], newFiles: [],
};

// ─── Icônes ───────────────────────────────────────────────────
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);
const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const UploadIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polyline points="16 16 12 12 8 16"/>
    <line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);
const PackageIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────
const inp = (style) => ({
  width: "100%", padding: "10px 14px", boxSizing: "border-box",
  border: "1px solid #ddd", borderRadius: 6,
  fontFamily: "'Jost',sans-serif", fontSize: 13,
  outline: "none", color: "#2C2A20", background: "white",
  ...style,
});

async function uploadFile(file) {
  const ext  = file.name.split(".").pop();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function deleteFile(url) {
  try {
    const path = url.split(`/${STORAGE_BUCKET}/`)[1];
    if (path) await supabase.storage.from(STORAGE_BUCKET).remove([path]);
  } catch (_) { /* ignore */ }
}

// ─── Badge actif ──────────────────────────────────────────────
function ActiveBadge({ active }) {
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: 20,
      background: active ? "#E8F5E9" : "#F5F5F5",
      color: active ? "#2E7D32" : "#999",
      border: `1px solid ${active ? "#81C784" : "#ddd"}`,
      fontFamily: "'Jost',sans-serif", fontSize: 11, fontWeight: 600,
    }}>
      {active ? "Actif" : "Inactif"}
    </span>
  );
}

// ─── Badge hors stock ─────────────────────────────────────────
function HorsStockBadge() {
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: 20,
      background: "#FEECEC", color: "#C62828", border: "1px solid #EF9A9A",
      fontFamily: "'Jost',sans-serif", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
    }}>
      Hors stock
    </span>
  );
}

// ─── Formulaire produit (drawer) ──────────────────────────────
function ProductForm({ initial, onSave, onClose, isMobile }) {
  const [form, setForm] = useState(initial ?? EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [previews, setPreviews] = useState([]); // ObjectURL pour les newFiles
  const fileInputRef = useRef();
  const isEdit = !!initial?.id;

  // Générer les previews pour newFiles
  useEffect(() => {
    const urls = form.newFiles.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach(URL.revokeObjectURL);
  }, [form.newFiles]);

  const set = (k, v) => { setForm((p) => ({ ...p, [k]: v })); setErrors((p) => ({ ...p, [k]: "" })); };

  const toggleSize = (s) =>
    set("sizes", form.sizes.includes(s) ? form.sizes.filter((x) => x !== s) : [...form.sizes, s]);

  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    const total = form.existingPhotos.length + form.newFiles.length + files.length;
    if (total > 8) { setErrors((p) => ({ ...p, photos: "Maximum 8 photos" })); return; }
    set("newFiles", [...form.newFiles, ...files]);
    e.target.value = "";
  };

  const removeExisting = (idx) =>
    set("existingPhotos", form.existingPhotos.filter((_, i) => i !== idx));

  const removeNew = (idx) =>
    set("newFiles", form.newFiles.filter((_, i) => i !== idx));

  const validate = () => {
    const e = {};
    if (!form.name.trim())   e.name  = "Requis";
    if (!form.price)         e.price = "Requis";
    if (isNaN(Number(form.price)) || Number(form.price) < 0) e.price = "Prix invalide";
    if (form.sizes.length === 0) e.sizes = "Choisissez au moins une taille";
    const totalPhotos = form.existingPhotos.length + form.newFiles.length;
    if (totalPhotos === 0) e.photos = "Au moins une photo requise";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    setSaveError(null);

    try {
      // Upload des nouvelles photos
      const uploadedUrls = await Promise.all(form.newFiles.map(uploadFile));
      const images = [...form.existingPhotos, ...uploadedUrls];

      const payload = {
        name:        form.name.trim(),
        category:    form.category,
        description: form.description.trim(),
        price:       Number(form.price),
        sizes:       form.sizes,
        images,
        stock:       Number(form.stock) || 0,
        is_active:   form.is_active,
      };

      let result;
      if (isEdit) {
        result = await supabase.from("products").update(payload).eq("id", initial.id).select().single();
      } else {
        result = await supabase.from("products").insert(payload).select().single();
      }

      if (result.error) throw result.error;
      onSave(result.data);
    } catch (err) {
      setSaveError(err.message ?? "Erreur lors de la sauvegarde.");
      setSaving(false);
    }
  };

  const labelStyle = { display: "block", fontFamily: "'Jost',sans-serif", fontSize: 11, letterSpacing: "0.5px", color: "#666", marginBottom: 6 };
  const fieldWrap  = { marginBottom: 18 };

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(44,42,32,0.45)", zIndex: 200 }} />

      {/* Drawer */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 201,
        width: isMobile ? "100vw" : "min(560px, 94vw)",
        background: "#FAF9F6", overflowY: "auto",
        boxShadow: "-8px 0 40px rgba(0,0,0,0.15)",
        display: "flex", flexDirection: "column",
      }}>
        {/* En-tête drawer */}
        <div style={{
          background: "#2C2A20", padding: "0 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: 56, flexShrink: 0,
        }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 19, fontWeight: 500, color: "white", margin: 0 }}>
            {isEdit ? "Modifier le produit" : "Nouveau produit"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", padding: 4, display: "flex" }}>
            <CloseIcon />
          </button>
        </div>

        {/* Corps du formulaire */}
        <form onSubmit={handleSubmit} noValidate style={{ padding: "24px 20px", flex: 1 }}>

          {/* Nom */}
          <div style={fieldWrap}>
            <label style={labelStyle}>Nom du produit *</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)}
              placeholder="Ex : Abaya dorée" style={inp({ borderColor: errors.name ? "#e57373" : "#ddd" })}
              onFocus={(e) => (e.target.style.borderColor = "#C9A84C")}
              onBlur={(e) => (e.target.style.borderColor = errors.name ? "#e57373" : "#ddd")}
            />
            {errors.name && <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 11, color: "#e57373", marginTop: 4 }}>{errors.name}</p>}
          </div>

          {/* Catégorie */}
          <div style={fieldWrap}>
            <label style={labelStyle}>Catégorie *</label>
            <select value={form.category} onChange={(e) => set("category", e.target.value)}
              style={inp({ cursor: "pointer" })}
              onFocus={(e) => (e.target.style.borderColor = "#C9A84C")}
              onBlur={(e) => (e.target.style.borderColor = "#ddd")}
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Description */}
          <div style={fieldWrap}>
            <label style={labelStyle}>Description</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
              placeholder="Décrivez le produit..."
              rows={3}
              style={{ ...inp(), resize: "vertical", lineHeight: 1.6 }}
              onFocus={(e) => (e.target.style.borderColor = "#C9A84C")}
              onBlur={(e) => (e.target.style.borderColor = "#ddd")}
            />
          </div>

          {/* Prix + Stock (côte à côte) */}
          <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Prix (DT) *</label>
              <input type="number" min="0" step="0.001" value={form.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="0.000"
                style={inp({ borderColor: errors.price ? "#e57373" : "#ddd" })}
                onFocus={(e) => (e.target.style.borderColor = "#C9A84C")}
                onBlur={(e) => (e.target.style.borderColor = errors.price ? "#e57373" : "#ddd")}
              />
              {errors.price && <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 11, color: "#e57373", marginTop: 4 }}>{errors.price}</p>}
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Stock</label>
              <input type="number" min="0" value={form.stock}
                onChange={(e) => set("stock", e.target.value)}
                placeholder="0"
                style={inp()}
                onFocus={(e) => (e.target.style.borderColor = "#C9A84C")}
                onBlur={(e) => (e.target.style.borderColor = "#ddd")}
              />
            </div>
          </div>

          {/* Tailles */}
          <div style={fieldWrap}>
            <label style={labelStyle}>Tailles disponibles *</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {TAILLES.map((s) => {
                const active = form.sizes.includes(s);
                return (
                  <button key={s} type="button" onClick={() => toggleSize(s)} style={{
                    width: 44, height: 44, border: active ? "2px solid #C9A84C" : "1px solid #ddd",
                    background: active ? "#C9A84C" : "white",
                    color: active ? "white" : "#2C2A20",
                    fontFamily: "'Jost',sans-serif", fontSize: 13, fontWeight: 500,
                    cursor: "pointer", borderRadius: 6, transition: "all 0.15s",
                  }}>
                    {s}
                  </button>
                );
              })}
            </div>
            {errors.sizes && <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 11, color: "#e57373", marginTop: 6 }}>{errors.sizes}</p>}
          </div>

          {/* Photos */}
          <div style={fieldWrap}>
            <label style={labelStyle}>Photos * (max 8)</label>

            {/* Grille des photos existantes */}
            {(form.existingPhotos.length > 0 || form.newFiles.length > 0) && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 10 }}>
                {form.existingPhotos.map((url, i) => (
                  <div key={`ex-${i}`} style={{ position: "relative", aspectRatio: "3/4", borderRadius: 6, overflow: "hidden" }}>
                    <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button type="button" onClick={() => removeExisting(i)} style={{
                      position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%",
                      background: "rgba(0,0,0,0.6)", border: "none", color: "white",
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, lineHeight: 1,
                    }}>×</button>
                  </div>
                ))}
                {form.newFiles.map((_, i) => (
                  <div key={`nw-${i}`} style={{ position: "relative", aspectRatio: "3/4", borderRadius: 6, overflow: "hidden", border: "2px dashed #C9A84C" }}>
                    <img src={previews[i]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button type="button" onClick={() => removeNew(i)} style={{
                      position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%",
                      background: "rgba(0,0,0,0.6)", border: "none", color: "white",
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, lineHeight: 1,
                    }}>×</button>
                    <span style={{ position: "absolute", bottom: 4, left: 0, right: 0, textAlign: "center", fontFamily: "'Jost',sans-serif", fontSize: 9, color: "rgba(255,255,255,0.8)" }}>Nouveau</span>
                  </div>
                ))}
              </div>
            )}

            {/* Zone d'upload */}
            {(form.existingPhotos.length + form.newFiles.length) < 8 && (
              <>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: "none" }} />
                <button type="button" onClick={() => fileInputRef.current.click()} style={{
                  width: "100%", padding: "20px", border: `2px dashed ${errors.photos ? "#e57373" : "#ddd"}`,
                  borderRadius: 8, background: "white", cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                  transition: "border-color 0.2s",
                }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#C9A84C")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = errors.photos ? "#e57373" : "#ddd")}
                >
                  <span style={{ color: "#C9A84C" }}><UploadIcon /></span>
                  <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 12, color: "#999" }}>
                    Cliquer pour ajouter des photos
                  </span>
                </button>
              </>
            )}
            {errors.photos && <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 11, color: "#e57373", marginTop: 6 }}>{errors.photos}</p>}
          </div>

          {/* Statut actif */}
          <div style={{ ...fieldWrap, display: "flex", alignItems: "center", justifyContent: "space-between", background: "white", border: "1px solid #EDE8E0", borderRadius: 8, padding: "14px 16px" }}>
            <div>
              <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 13, fontWeight: 600, color: "#2C2A20", margin: "0 0 2px" }}>Produit actif</p>
              <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 11, color: "#999", margin: 0 }}>Visible sur le site boutique</p>
            </div>
            <button type="button" onClick={() => set("is_active", !form.is_active)} style={{
              width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", position: "relative",
              background: form.is_active ? "#C9A84C" : "#ddd", transition: "background 0.2s",
            }}>
              <span style={{
                position: "absolute", top: 3, width: 18, height: 18, borderRadius: "50%", background: "white",
                left: form.is_active ? "calc(100% - 21px)" : 3, transition: "left 0.2s",
                boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
              }} />
            </button>
          </div>

          {saveError && (
            <div style={{ background: "#FEECEC", border: "1px solid #EF9A9A", borderRadius: 6, padding: "10px 14px", marginBottom: 16 }}>
              <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 12, color: "#C62828", margin: 0 }}>{saveError}</p>
            </div>
          )}

          {/* Boutons */}
          <div style={{ display: "flex", gap: 10, paddingBottom: 24 }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: "13px", border: "1px solid #ddd", borderRadius: 6, background: "white",
              fontFamily: "'Jost',sans-serif", fontSize: 12, color: "#666", cursor: "pointer",
            }}>
              Annuler
            </button>
            <button type="submit" disabled={saving} style={{
              flex: 2, padding: "13px", border: "none", borderRadius: 6,
              background: saving ? "#ddd" : "#C9A84C", color: "white",
              fontFamily: "'Jost',sans-serif", fontSize: 12, letterSpacing: "1px",
              textTransform: "uppercase", cursor: saving ? "wait" : "pointer",
            }}>
              {saving ? "Enregistrement..." : isEdit ? "Enregistrer" : "Créer le produit"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ─── Confirmation suppression ─────────────────────────────────
function DeleteConfirm({ product, onConfirm, onCancel, deleting }) {
  return (
    <>
      <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(44,42,32,0.45)", zIndex: 300 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        zIndex: 301, background: "white", borderRadius: 10, padding: "28px 24px",
        width: "min(380px, 92vw)", boxShadow: "0 16px 60px rgba(0,0,0,0.2)",
      }}>
        <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 600, color: "#2C2A20", marginBottom: 10 }}>
          Supprimer ce produit ?
        </h3>
        <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 13, color: "#666", lineHeight: 1.6, marginBottom: 24 }}>
          <strong style={{ color: "#2C2A20" }}>"{product.name}"</strong> sera définitivement supprimé. Les commandes liées conserveront leur historique.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: "12px", border: "1px solid #ddd", borderRadius: 6, background: "white",
            fontFamily: "'Jost',sans-serif", fontSize: 12, color: "#666", cursor: "pointer",
          }}>
            Annuler
          </button>
          <button onClick={onConfirm} disabled={deleting} style={{
            flex: 1, padding: "12px", border: "none", borderRadius: 6,
            background: deleting ? "#ddd" : "#C62828", color: "white",
            fontFamily: "'Jost',sans-serif", fontSize: 12, cursor: deleting ? "wait" : "pointer",
          }}>
            {deleting ? "Suppression..." : "Supprimer"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Carte produit (mobile) ───────────────────────────────────
function ProductCard({ product, onEdit, onDelete }) {
  const photo = product.images?.[0] ?? null;
  return (
    <div style={{ background: "white", border: "1px solid #EDE8E0", borderRadius: 10, overflow: "hidden", display: "flex", gap: 0 }}>
      {/* Photo */}
      <div style={{ width: 80, flexShrink: 0, background: "#F0EBE4", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {photo
          ? <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span style={{ color: "#C9A84C", opacity: 0.4 }}><PackageIcon /></span>
        }
      </div>
      {/* Infos */}
      <div style={{ flex: 1, padding: "12px 14px", minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, fontWeight: 600, color: "#2C2A20", margin: 0, lineHeight: 1.2 }}>
              {product.name}
            </p>
            <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 11, color: "#999", margin: "3px 0 0" }}>{product.category}</p>
          </div>
          <ActiveBadge active={product.is_active} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 14, fontWeight: 700, color: "#C9A84C" }}>
              {Number(product.price).toFixed(3)} ت.د
            </span>
            {product.stock === 0
              ? <HorsStockBadge />
              : <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 12, color: "#999" }}>Stock : {product.stock}</span>
            }
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => onEdit(product)} style={actionBtn("#F0EBE4", "#C9A84C")}><EditIcon /></button>
            <button onClick={() => onDelete(product)} style={actionBtn("#FEECEC", "#C62828")}><TrashIcon /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

const actionBtn = (bg, color) => ({
  display: "flex", alignItems: "center", justifyContent: "center",
  width: 32, height: 32, borderRadius: 6, border: "none",
  background: bg, color, cursor: "pointer",
});

// ─── Ligne produit (tableau) ──────────────────────────────────
const tdS = { padding: "12px 14px", borderBottom: "1px solid #EDE8E0" };
const thS = {
  padding: "10px 14px", fontFamily: "'Jost',sans-serif", fontSize: 10,
  letterSpacing: "1.5px", textTransform: "uppercase", color: "#999", fontWeight: 600,
  textAlign: "left", borderBottom: "2px solid #EDE8E0", whiteSpace: "nowrap", background: "#FAF9F6",
};

function ProductRow({ product, onEdit, onDelete, index }) {
  const photo = product.images?.[0] ?? null;
  return (
    <tr style={{ background: index % 2 === 0 ? "white" : "#FDFCFA", verticalAlign: "middle" }}>
      <td style={tdS}>
        <div style={{ width: 48, height: 60, borderRadius: 4, overflow: "hidden", background: "#F0EBE4", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {photo ? <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ color: "#C9A84C", opacity: 0.4 }}><PackageIcon /></span>}
        </div>
      </td>
      <td style={tdS}>
        <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, fontWeight: 600, color: "#2C2A20" }}>{product.name}</span>
        <span style={{ display: "block", fontFamily: "'Jost',sans-serif", fontSize: 11, color: "#999", marginTop: 2 }}>{product.description?.slice(0, 50)}{product.description?.length > 50 ? "…" : ""}</span>
      </td>
      <td style={tdS}><span style={{ fontFamily: "'Jost',sans-serif", fontSize: 12, background: "#F0EBE4", padding: "3px 10px", borderRadius: 4, whiteSpace: "nowrap" }}>{product.category}</span></td>
      <td style={tdS}><span style={{ fontFamily: "'Jost',sans-serif", fontSize: 14, fontWeight: 700, color: "#C9A84C", whiteSpace: "nowrap" }}>{Number(product.price).toFixed(3)} ت.د</span></td>
      <td style={{ ...tdS, textAlign: "center" }}>
        {product.stock === 0
          ? <HorsStockBadge />
          : <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 14, fontWeight: 600 }}>{product.stock}</span>
        }
      </td>
      <td style={tdS}><div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{(product.sizes ?? []).map((s) => <span key={s} style={{ fontFamily: "'Jost',sans-serif", fontSize: 11, background: "#F5F5F5", border: "1px solid #EDE8E0", padding: "1px 7px", borderRadius: 4 }}>{s}</span>)}</div></td>
      <td style={tdS}><ActiveBadge active={product.is_active} /></td>
      <td style={tdS}>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => onEdit(product)} title="Modifier" style={actionBtn("#F0EBE4", "#C9A84C")}><EditIcon /></button>
          <button onClick={() => onDelete(product)} title="Supprimer" style={actionBtn("#FEECEC", "#C62828")}><TrashIcon /></button>
        </div>
      </td>
    </tr>
  );
}

// ─── Onglet Produits ──────────────────────────────────────────
export default function AdminProducts({ isMobile }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("toutes");
  const [formProduct, setFormProduct] = useState(null); // null=fermé, EMPTY_FORM=nouveau, product=édition
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setFetchError("Impossible de charger les produits.");
    else setProducts(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // ── CRUD callbacks ──
  const handleSave = (saved) => {
    setProducts((prev) => {
      const exists = prev.find((p) => p.id === saved.id);
      return exists ? prev.map((p) => p.id === saved.id ? saved : p) : [saved, ...prev];
    });
    setFormProduct(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    // Supprimer les photos du storage
    await Promise.all((deleteTarget.images ?? []).map(deleteFile));
    await supabase.from("products").delete().eq("id", deleteTarget.id);
    setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    setDeleteTarget(null);
    setDeleting(false);
  };

  // ── Filtrage ──
  const filtered = products.filter((p) => {
    const matchCat = filterCat === "toutes" || p.category === filterCat;
    const q = search.toLowerCase();
    return matchCat && (!q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  });

  return (
    <div>
      {/* ── Barre d'actions ── */}
      <div style={{
        display: "flex", flexDirection: isMobile ? "column" : "row",
        gap: 12, alignItems: isMobile ? "stretch" : "center",
        justifyContent: "space-between", marginBottom: 20,
      }}>
        <div style={{ display: "flex", gap: 10, flex: 1, flexDirection: isMobile ? "column" : "row" }}>
          <input
            type="text" placeholder="Rechercher un produit..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ ...inp(), flex: "1 1 200px" }}
            onFocus={(e) => (e.target.style.borderColor = "#C9A84C")}
            onBlur={(e) => (e.target.style.borderColor = "#ddd")}
          />
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
            style={{ ...inp({ cursor: "pointer" }), flex: "0 0 auto", minWidth: 160 }}
            onFocus={(e) => (e.target.style.borderColor = "#C9A84C")}
            onBlur={(e) => (e.target.style.borderColor = "#ddd")}
          >
            <option value="toutes">Toutes catégories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button
          onClick={() => setFormProduct({ ...EMPTY_FORM })}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "10px 20px", background: "#C9A84C", color: "white",
            border: "none", borderRadius: 6, cursor: "pointer",
            fontFamily: "'Jost',sans-serif", fontSize: 12, letterSpacing: "1px",
            textTransform: "uppercase", whiteSpace: "nowrap",
            width: isMobile ? "100%" : "auto",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#b8943e")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#C9A84C")}
        >
          <PlusIcon /> Ajouter un produit
        </button>
      </div>

      {/* ── Contenu ── */}
      {loading ? (
        <div style={{ background: "white", border: "1px solid #EDE8E0", borderRadius: 8, padding: "60px 20px", textAlign: "center" }}>
          <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 13, color: "#999" }}>Chargement des produits...</p>
        </div>
      ) : fetchError ? (
        <div style={{ background: "white", border: "1px solid #EDE8E0", borderRadius: 8, padding: "48px 20px", textAlign: "center" }}>
          <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 13, color: "#e57373" }}>{fetchError}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "white", border: "1px solid #EDE8E0", borderRadius: 8, padding: "60px 20px", textAlign: "center" }}>
          <div style={{ marginBottom: 12, color: "#C9A84C", opacity: 0.4 }}><PackageIcon /></div>
          <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 13, color: "#999" }}>
            {products.length === 0 ? "Aucun produit. Ajoutez votre premier produit !" : "Aucun résultat."}
          </p>
        </div>
      ) : isMobile ? (
        /* Cartes mobile */
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p}
              onEdit={(prod) => setFormProduct({ ...prod, existingPhotos: prod.images ?? [], newFiles: [] })}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      ) : (
        /* Tableau tablette/desktop */
        <div style={{ background: "white", border: "1px solid #EDE8E0", borderRadius: 8, overflow: "hidden", boxShadow: "0 2px 12px rgba(44,42,32,0.04)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
              <thead>
                <tr>
                  {["Photo", "Nom & Description", "Catégorie", "Prix", "Stock", "Tailles", "Statut", "Actions"].map((h) => (
                    <th key={h} style={{ ...thS, textAlign: h === "Stock" ? "center" : "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <ProductRow key={p.id} product={p} index={i}
                    onEdit={(prod) => setFormProduct({ ...prod, existingPhotos: prod.images ?? [], newFiles: [] })}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filtered.length > 0 && (
        <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 11, color: "#bbb", textAlign: "right", marginTop: 10 }}>
          {filtered.length} produit{filtered.length > 1 ? "s" : ""}
        </p>
      )}

      {/* ── Drawer formulaire ── */}
      {formProduct !== null && (
        <ProductForm
          initial={formProduct.id ? formProduct : null}
          onSave={handleSave}
          onClose={() => setFormProduct(null)}
          isMobile={isMobile}
        />
      )}

      {/* ── Confirmation suppression ── */}
      {deleteTarget && (
        <DeleteConfirm
          product={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
    </div>
  );
}

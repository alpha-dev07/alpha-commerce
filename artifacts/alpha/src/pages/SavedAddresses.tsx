import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { BottomNav } from "../components/BottomNav";
import {
  ChevronLeft,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Star,
  X,
  Loader2,
  Home,
  Briefcase,
} from "lucide-react";

interface Address {
  id: string;
  label: string;
  name: string;
  phone: string;
  addressLine: string;
  city: string;
  pincode: string;
  isDefault: boolean;
}

interface AddressForm {
  label: string;
  name: string;
  phone: string;
  addressLine: string;
  city: string;
  pincode: string;
  isDefault: boolean;
}

const EMPTY_FORM: AddressForm = {
  label: "Home",
  name: "",
  phone: "",
  addressLine: "",
  city: "",
  pincode: "",
  isDefault: false,
};

const LABEL_OPTIONS = ["Home", "Work", "Other"];

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

const inputCls =
  "w-full h-11 px-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm";

export function SavedAddresses() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<AddressForm>>({});

  const userDocRef = user ? doc(db, "users", user.uid) : null;

  useEffect(() => {
    if (!userDocRef) { setLoading(false); return; }
    getDoc(userDocRef).then((snap) => {
      if (snap.exists()) {
        setAddresses((snap.data().addresses as Address[]) ?? []);
      }
      setLoading(false);
    });
  }, [user?.uid]);

  const save = async (updated: Address[]) => {
    if (!userDocRef) return;
    await setDoc(userDocRef, { addresses: updated }, { merge: true });
    setAddresses(updated);
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (addr: Address) => {
    setEditingId(addr.id);
    setForm({
      label: addr.label,
      name: addr.name,
      phone: addr.phone,
      addressLine: addr.addressLine,
      city: addr.city,
      pincode: addr.pincode,
      isDefault: addr.isDefault,
    });
    setErrors({});
    setShowModal(true);
  };

  const setField = <K extends keyof AddressForm>(k: K) => (v: AddressForm[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const validate = () => {
    const e: Partial<AddressForm> = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) e.phone = "Enter a valid 10-digit mobile number";
    if (!form.addressLine.trim()) e.addressLine = "Address is required";
    if (!form.city.trim()) e.city = "City is required";
    if (!/^\d{6}$/.test(form.pincode.trim())) e.pincode = "Enter a valid 6-digit pincode";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      let updated: Address[];
      if (editingId) {
        updated = addresses.map((a) =>
          a.id === editingId
            ? { ...a, ...form }
            : form.isDefault ? { ...a, isDefault: false } : a
        );
      } else {
        const newAddr: Address = { id: genId(), ...form };
        if (newAddr.isDefault) {
          updated = [...addresses.map((a) => ({ ...a, isDefault: false })), newAddr];
        } else {
          updated = [...addresses, newAddr];
        }
      }
      // Ensure at least one default when adding first address
      if (updated.length === 1 && !updated[0].isDefault) {
        updated[0] = { ...updated[0], isDefault: true };
      }
      await save(updated);
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this address?")) return;
    let updated = addresses.filter((a) => a.id !== id);
    if (updated.length > 0 && !updated.some((a) => a.isDefault)) {
      updated[0] = { ...updated[0], isDefault: true };
    }
    await save(updated);
  };

  const handleSetDefault = async (id: string) => {
    const updated = addresses.map((a) => ({ ...a, isDefault: a.id === id }));
    await save(updated);
  };

  return (
    <>
      <div
        className="min-h-[100dvh] w-full bg-background pb-24 animate-in fade-in duration-300"
        data-testid="page-saved-addresses"
      >
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50">
          <div className="flex items-center gap-3 px-4 py-4">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center active:scale-90 transition-transform shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold flex-1">Saved Addresses</h1>
            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm active:scale-95 transition-transform"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 px-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : addresses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-20 h-20 rounded-full bg-card border border-border flex items-center justify-center">
                <MapPin className="w-9 h-9 text-muted-foreground/40" />
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <h2 className="text-lg font-bold">No saved addresses</h2>
                <p className="text-sm text-muted-foreground">Add a delivery address to get started</p>
              </div>
              <button
                onClick={openAdd}
                className="flex items-center gap-2 px-6 h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm active:scale-[0.97] transition-transform"
              >
                <Plus className="w-4 h-4" />
                Add Address
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`flex flex-col gap-2 p-4 rounded-2xl bg-card border transition-colors ${
                    addr.isDefault ? "border-primary/40 bg-primary/[0.03]" : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                        {addr.label === "Work" ? (
                          <Briefcase className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <Home className="w-3.5 h-3.5 text-primary" />
                        )}
                      </div>
                      <span className="text-sm font-bold">{addr.label}</span>
                      {addr.isDefault && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(addr)}
                        className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary active:scale-90 transition-transform"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(addr.id)}
                        className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive active:scale-90 transition-transform"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold">{addr.name}</span>
                    <span className="text-xs text-muted-foreground">{addr.addressLine}</span>
                    <span className="text-xs text-muted-foreground">
                      {addr.city} — {addr.pincode}
                    </span>
                    <span className="text-xs text-muted-foreground">📞 {addr.phone}</span>
                  </div>

                  {!addr.isDefault && (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="flex items-center gap-1.5 mt-1 text-xs font-medium text-primary active:opacity-70"
                    >
                      <Star className="w-3.5 h-3.5" />
                      Set as default
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <BottomNav />
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex flex-col">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative mt-auto w-full max-h-[92dvh] bg-background rounded-t-3xl border-t border-border flex flex-col">
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <h3 className="text-base font-bold">
                {editingId ? "Edit Address" : "Add New Address"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
              {/* Label */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Address Label</label>
                <div className="flex gap-2">
                  {LABEL_OPTIONS.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setField("label")(l)}
                      className={`h-9 px-4 rounded-xl text-sm font-medium border transition-all ${
                        form.label === l
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-muted-foreground border-border"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Full Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setField("name")(e.target.value)}
                  placeholder="Rahul Sharma"
                  className={inputCls}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Mobile Number *</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={form.phone}
                  onChange={(e) => setField("phone")(e.target.value.replace(/\D/g, ""))}
                  placeholder="9876543210"
                  className={inputCls}
                />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
              </div>

              {/* Address Line */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">House / Flat / Building *</label>
                <input
                  type="text"
                  value={form.addressLine}
                  onChange={(e) => setField("addressLine")(e.target.value)}
                  placeholder="Flat 4B, Green Heights, MG Road"
                  className={inputCls}
                />
                {errors.addressLine && <p className="text-xs text-destructive">{errors.addressLine}</p>}
              </div>

              {/* City + Pincode */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">City *</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setField("city")(e.target.value)}
                    placeholder="Mumbai"
                    className={inputCls}
                  />
                  {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Pincode *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={form.pincode}
                    onChange={(e) => setField("pincode")(e.target.value.replace(/\D/g, ""))}
                    placeholder="400001"
                    className={inputCls}
                  />
                  {errors.pincode && <p className="text-xs text-destructive">{errors.pincode}</p>}
                </div>
              </div>

              {/* Set Default */}
              <div className="flex items-center justify-between px-4 py-3.5 rounded-2xl bg-card border border-border">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">Set as default address</span>
                  <span className="text-xs text-muted-foreground">Used automatically at checkout</span>
                </div>
                <button
                  type="button"
                  onClick={() => setField("isDefault")(!form.isDefault)}
                  className={`w-11 h-6 rounded-full transition-colors shrink-0 relative ${
                    form.isDefault ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
                      form.isDefault ? "left-[calc(100%-22px)]" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              <div className="h-2" />
            </div>

            <div className="px-4 py-3 border-t border-border shrink-0">
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingId ? "Update Address" : "Save Address"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

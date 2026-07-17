import { useEffect, useRef, useState } from "react";
import {
  collection,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../firebase";
import { formatINR } from "../../lib/currency";
import type { Product } from "../../types/product";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  ImagePlus,
  Search,
  Package,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const CATEGORIES = [
  { value: "groceries", label: "Groceries" },
  { value: "fruits", label: "Fruits" },
  { value: "dairy", label: "Dairy" },
  { value: "snacks", label: "Snacks" },
  { value: "beverages", label: "Beverages" },
  { value: "personal-care", label: "Personal Care" },
  { value: "electronics", label: "Electronics" },
  { value: "fashion", label: "Fashion" },
];

const COLOR_PRESETS = [
  "#22c55e", "#3b82f6", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316",
];

interface ProductForm {
  name: string;
  category: string;
  price: string;
  originalPrice: string;
  unit: string;
  stock: string;
  description: string;
  imageColor: string;
  inStock: boolean;
  featured: boolean;
  bestSeller: boolean;
}

const EMPTY_FORM: ProductForm = {
  name: "",
  category: "groceries",
  price: "",
  originalPrice: "",
  unit: "",
  stock: "0",
  description: "",
  imageColor: "#22c55e",
  inStock: true,
  featured: false,
  bestSeller: false,
};

const inputCls =
  "w-full h-11 px-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm";
const selectCls =
  "w-full h-11 px-3 rounded-xl bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm appearance-none";

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [formErrors, setFormErrors] = useState<Partial<ProductForm>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snap) => {
      const items = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Product))
        .sort((a, b) => a.name.localeCompare(b.name));
      setProducts(items);
      setLoading(false);
    });
    return unsub;
  }, []);

  const filtered = products.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  const setField =
    <K extends keyof ProductForm>(key: K) =>
    (value: ProductForm[K]) => {
      setForm((f) => ({ ...f, [key]: value }));
      if (formErrors[key]) setFormErrors((e) => ({ ...e, [key]: undefined }));
    };

  const openAdd = () => {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview("");
    setSaveError("");
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      originalPrice: product.originalPrice > product.price ? String(product.originalPrice) : "",
      unit: product.unit,
      stock: String(product.stock ?? 0),
      description: product.description,
      imageColor: product.imageColor,
      inStock: product.inStock,
      featured: product.featured,
      bestSeller: product.bestSeller,
    });
    setImageFile(null);
    setImagePreview(product.imageUrl || "");
    setSaveError("");
    setFormErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setImageFile(null);
    setImagePreview("");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const validate = (): boolean => {
    const errors: Partial<ProductForm> = {};
    if (form.name.trim().length < 2) errors.name = "Name required (min 2 chars)";
    if (!form.price || parseFloat(form.price) <= 0) errors.price = "Valid price required";
    if (!form.unit.trim()) errors.unit = "Unit required (e.g. 1 kg)";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaveError("");
    setSaving(true);

    try {
      const price = parseFloat(form.price);
      const originalPrice = form.originalPrice ? parseFloat(form.originalPrice) : price;
      const discount =
        originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : 0;

      let imageUrl = editingProduct?.imageUrl || "";

      if (imageFile) {
        const productRef = editingProduct
          ? doc(db, "products", editingProduct.id)
          : doc(collection(db, "products"));
        const storageRef = ref(storage, `products/${productRef.id}/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      const data = {
        name: form.name.trim(),
        category: form.category,
        price,
        originalPrice,
        discount,
        unit: form.unit.trim(),
        stock: parseInt(form.stock) || 0,
        description: form.description.trim(),
        imageColor: form.imageColor,
        imageUrl,
        inStock: form.inStock,
        featured: form.featured,
        bestSeller: form.bestSeller,
        rating: editingProduct?.rating ?? 4.5,
        reviewCount: editingProduct?.reviewCount ?? 0,
      };

      if (editingProduct) {
        await updateDoc(doc(db, "products", editingProduct.id), data);
      } else {
        await addDoc(collection(db, "products"), data);
      }

      closeModal();
    } catch (err: unknown) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to save product. Try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId: string, productName: string) => {
    if (!confirm(`Delete "${productName}"? This cannot be undone.`)) return;
    await deleteDoc(doc(db, "products", productId));
  };

  return (
    <>
      <div className="flex flex-col gap-4 px-4 py-5" data-testid="page-admin-products">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-xl font-bold">Products</h2>
            <p className="text-xs text-muted-foreground">
              {products.length} total product{products.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm active:scale-95 transition-transform"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full h-11 pl-9 pr-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>

        {/* Product list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Package className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {search ? "No products match your search" : "No products yet"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border"
                data-testid={`admin-product-${product.id}`}
              >
                {/* Image / swatch */}
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-14 h-14 rounded-xl object-cover shrink-0"
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-xl shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${product.imageColor}55, #0a0a0a)`,
                    }}
                  />
                )}

                {/* Info */}
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span className="text-sm font-semibold truncate">{product.name}</span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {product.category.replace("-", " ")} · {product.unit}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-bold text-primary">
                      {formatINR(product.price)}
                    </span>
                    {product.discount > 0 && (
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
                        -{product.discount}%
                      </span>
                    )}
                    {product.inStock ? (
                      <span className="text-[10px] text-primary flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> In Stock
                        {product.stock !== undefined && ` (${product.stock})`}
                      </span>
                    ) : (
                      <span className="text-[10px] text-destructive flex items-center gap-0.5">
                        <XCircle className="w-3 h-3" /> Out of Stock
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    onClick={() => openEdit(product)}
                    className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary active:scale-90 transition-transform"
                    data-testid={`btn-edit-${product.id}`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id, product.name)}
                    className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive active:scale-90 transition-transform"
                    data-testid={`btn-delete-${product.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex flex-col">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Sheet */}
          <div className="relative mt-auto w-full max-h-[92dvh] bg-background rounded-t-3xl border-t border-border flex flex-col animate-in slide-in-from-bottom-4 duration-300">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <h3 className="text-base font-bold">
                {editingProduct ? "Edit Product" : "Add Product"}
              </h3>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable form */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
              {/* Image upload */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-muted-foreground">
                  Product Image (optional)
                </label>
                <div className="flex items-center gap-3">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-20 h-20 rounded-xl object-cover"
                      />
                      <button
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview("");
                        }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="w-20 h-20 rounded-xl flex items-center justify-center cursor-pointer"
                      style={{
                        background: `linear-gradient(135deg, ${form.imageColor}55, #0a0a0a)`,
                      }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImagePlus className="w-6 h-6 text-white/60" />
                    </div>
                  )}
                  <div className="flex flex-col gap-2 flex-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-10 px-4 rounded-xl border border-border text-sm font-medium text-muted-foreground bg-card active:scale-95 transition-transform"
                    >
                      <ImagePlus className="w-4 h-4 inline mr-2" />
                      {imagePreview ? "Change Image" : "Upload Image"}
                    </button>
                    <p className="text-[10px] text-muted-foreground">
                      JPG, PNG, WebP · max 5 MB
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </div>
              </div>

              {/* Product Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setField("name")(e.target.value)}
                  placeholder="e.g. Organic Bananas"
                  className={inputCls}
                />
                {formErrors.name && (
                  <p className="text-xs text-destructive">{formErrors.name}</p>
                )}
              </div>

              {/* Category */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Category *
                </label>
                <div className="relative">
                  <select
                    value={form.category}
                    onChange={(e) => setField("category")(e.target.value)}
                    className={selectCls}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price + Original Price */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={form.price}
                    onChange={(e) => setField("price")(e.target.value)}
                    placeholder="99"
                    className={inputCls}
                  />
                  {formErrors.price && (
                    <p className="text-xs text-destructive">{formErrors.price}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Original Price (₹)
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={form.originalPrice}
                    onChange={(e) => setField("originalPrice")(e.target.value)}
                    placeholder="129"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Unit + Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Unit *
                  </label>
                  <input
                    type="text"
                    value={form.unit}
                    onChange={(e) => setField("unit")(e.target.value)}
                    placeholder="1 kg"
                    className={inputCls}
                  />
                  {formErrors.unit && (
                    <p className="text-xs text-destructive">{formErrors.unit}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Stock Qty
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setField("stock")(e.target.value)}
                    placeholder="100"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setField("description")(e.target.value)}
                  placeholder="Brief description of the product..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
                />
              </div>

              {/* Image Color */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-muted-foreground">
                  Card Accent Color
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setField("imageColor")(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        form.imageColor === color
                          ? "border-white scale-110"
                          : "border-transparent"
                      }`}
                      style={{ background: color }}
                    />
                  ))}
                  <input
                    type="color"
                    value={form.imageColor}
                    onChange={(e) => setField("imageColor")(e.target.value)}
                    className="w-8 h-8 rounded-full cursor-pointer border-0 bg-transparent"
                    title="Custom color"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-col gap-3 p-4 rounded-2xl bg-card border border-border">
                {(
                  [
                    { key: "inStock", label: "In Stock", desc: "Product is available for purchase" },
                    { key: "featured", label: "Featured", desc: "Show in featured section on Home" },
                    { key: "bestSeller", label: "Best Seller", desc: "Show best seller badge" },
                  ] as const
                ).map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{label}</span>
                      <span className="text-xs text-muted-foreground">{desc}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setField(key)(!form[key])}
                      className={`w-11 h-6 rounded-full transition-colors shrink-0 relative ${
                        form[key] ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
                          form[key] ? "left-[calc(100%-22px)]" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>

              {saveError && (
                <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                  {saveError}
                </div>
              )}

              {/* Bottom spacer */}
              <div className="h-2" />
            </div>

            {/* Save button */}
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
                  <>{editingProduct ? "Update Product" : "Add Product"}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

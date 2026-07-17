import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  signOut,
} from "firebase/auth";
import { doc, deleteDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { BottomNav } from "../components/BottomNav";
import {
  ChevronLeft,
  Lock,
  LogOut,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  X,
  CheckCircle2,
} from "lucide-react";

const inputCls =
  "w-full h-11 px-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm";

function PasswordInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputCls} pr-11`}
        autoComplete="off"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export function PrivacySecurity() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Change password state
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  // Sign out state
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePw, setDeletePw] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);

    if (!currentPw || !newPw || !confirmPw) {
      setPwError("All fields are required.");
      return;
    }
    if (newPw.length < 6) {
      setPwError("New password must be at least 6 characters.");
      return;
    }
    if (newPw !== confirmPw) {
      setPwError("Passwords do not match.");
      return;
    }
    if (!user?.email) return;

    setPwLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPw);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPw);
      setPwSuccess(true);
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      if (code.includes("wrong-password") || code.includes("invalid-credential")) {
        setPwError("Current password is incorrect.");
      } else {
        setPwError("Failed to update password. Please try again.");
      }
    } finally {
      setPwLoading(false);
    }
  };

  const handleSignOut = async () => {
    setSignOutLoading(true);
    try {
      await signOut(auth);
      navigate("/login", { replace: true });
    } finally {
      setSignOutLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError("");
    if (!deletePw) {
      setDeleteError("Enter your password to confirm.");
      return;
    }
    if (!user?.email) return;

    setDeleteLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, deletePw);
      await reauthenticateWithCredential(user, credential);

      // Delete Firestore user data
      try { await deleteDoc(doc(db, "users", user.uid)); } catch { /* best effort */ }
      try { await deleteDoc(doc(db, "carts", user.uid)); } catch { /* best effort */ }

      await deleteUser(user);
      navigate("/login", { replace: true });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      if (code.includes("wrong-password") || code.includes("invalid-credential")) {
        setDeleteError("Incorrect password. Please try again.");
      } else {
        setDeleteError("Failed to delete account. Please try again.");
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <div
        className="min-h-[100dvh] w-full bg-background pb-24 animate-in fade-in duration-300"
        data-testid="page-privacy-security"
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
            <h1 className="text-xl font-bold">Privacy & Security</h1>
          </div>
        </div>

        <div className="flex flex-col gap-5 px-4 py-4">
          {/* Change Password */}
          <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Lock className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-base font-bold">Change Password</h2>
            </div>

            <div className="flex flex-col rounded-2xl bg-card border border-border overflow-hidden gap-0">
              <div className="flex flex-col gap-1.5 p-4 border-b border-border/50">
                <label className="text-xs font-semibold text-muted-foreground">Current Password</label>
                <PasswordInput value={currentPw} onChange={setCurrentPw} placeholder="Enter current password" />
              </div>
              <div className="flex flex-col gap-1.5 p-4 border-b border-border/50">
                <label className="text-xs font-semibold text-muted-foreground">New Password</label>
                <PasswordInput value={newPw} onChange={setNewPw} placeholder="Min. 6 characters" />
              </div>
              <div className="flex flex-col gap-1.5 p-4">
                <label className="text-xs font-semibold text-muted-foreground">Confirm New Password</label>
                <PasswordInput value={confirmPw} onChange={setConfirmPw} placeholder="Repeat new password" />
              </div>
            </div>

            {pwError && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/30">
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                <p className="text-xs text-destructive">{pwError}</p>
              </div>
            )}

            {pwSuccess && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <p className="text-xs text-primary font-medium">Password updated successfully!</p>
              </div>
            )}

            <button
              type="submit"
              disabled={pwLoading}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60"
            >
              {pwLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</>
              ) : (
                <><ShieldCheck className="w-4 h-4" /> Update Password</>
              )}
            </button>
          </form>

          {/* Sign Out */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-400/10 flex items-center justify-center">
                <LogOut className="w-4 h-4 text-amber-400" />
              </div>
              <h2 className="text-base font-bold">Sign Out</h2>
            </div>
            <div className="flex flex-col rounded-2xl bg-card border border-border overflow-hidden p-4 gap-3">
              <p className="text-sm text-muted-foreground">
                You'll be signed out of your account on this device. Your cart and order history will remain intact.
              </p>
              {!showSignOutConfirm ? (
                <button
                  onClick={() => setShowSignOutConfirm(true)}
                  className="w-full h-11 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-400 font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowSignOutConfirm(false)}
                    className="flex-1 h-11 rounded-xl border border-border text-muted-foreground font-semibold text-sm active:scale-[0.98] transition-transform"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSignOut}
                    disabled={signOutLoading}
                    className="flex-1 h-11 rounded-xl bg-amber-500 text-black font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60"
                  >
                    {signOutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Delete Account — Danger Zone */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-destructive" />
              </div>
              <h2 className="text-base font-bold text-destructive">Danger Zone</h2>
            </div>
            <div className="flex flex-col rounded-2xl bg-card border border-destructive/30 overflow-hidden p-4 gap-3">
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data. This action{" "}
                <span className="font-semibold text-foreground">cannot be undone.</span>
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full h-11 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <Trash2 className="w-4 h-4" />
                Delete My Account
              </button>
            </div>
          </div>
        </div>

        <BottomNav />
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => { setShowDeleteModal(false); setDeletePw(""); setDeleteError(""); }}
          />
          <div className="relative w-full bg-background rounded-t-3xl border-t border-border p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <h3 className="text-base font-bold text-destructive">Delete Account?</h3>
              </div>
              <button
                onClick={() => { setShowDeleteModal(false); setDeletePw(""); setDeleteError(""); }}
                className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              All your data — orders, addresses, and preferences — will be permanently deleted. This cannot be reversed.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Enter your password to confirm
              </label>
              <PasswordInput
                value={deletePw}
                onChange={setDeletePw}
                placeholder="Your current password"
              />
              {deleteError && (
                <p className="text-xs text-destructive mt-1">{deleteError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeletePw(""); setDeleteError(""); }}
                className="flex-1 h-12 rounded-xl border border-border text-foreground font-semibold text-sm active:scale-[0.98] transition-transform"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="flex-1 h-12 rounded-xl bg-destructive text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60"
              >
                {deleteLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Delete Forever"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

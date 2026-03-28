// src/shell/LoginPage.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { useAuth } from "./AuthProvider";
import { AUTH_BASE } from "@/core/auth/token";

export default function LoginPage() {
  const nav = useNavigate();
  const { role, loading: authLoading, login } = useAuth();
  const [form, setForm] = useState({ username: "", password: "", captcha: "" });
  const [cap, setCap] = useState<{ code_id: number; image: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const lock = useRef(false);
  const init = useRef(false);

  useEffect(() => {
    if (!authLoading && role !== "guest") nav("/", { replace: true });
  }, [role, authLoading, nav]);

  const loadCap = useCallback(async () => {
    if (lock.current) return;
    lock.current = true;
    try {
      const r = await fetch(`${AUTH_BASE}/auth/captcha`);
      if (r.ok) {
        setCap(await r.json());
        setForm((f) => ({ ...f, captcha: "" }));
      }
    } catch {
    } finally {
      lock.current = false;
    }
  }, []);

  useEffect(() => {
    if (authLoading || role !== "guest" || init.current) return;
    init.current = true;
    loadCap();
  }, [authLoading, role, loadCap]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cap || busy) return;
    setBusy(true);
    setErr(null);
    try {
      await login(
        form.username.trim(),
        form.password,
        cap.code_id,
        form.captcha.trim(),
      );
      nav("/", { replace: true });
    } catch (x) {
      setErr(x instanceof Error ? x.message : "登录失败");
      await loadCap();
    } finally {
      setBusy(false);
    }
  };

  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  if (authLoading)
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">登录运维后台</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="u">用户名</Label>
              <Input
                id="u"
                value={form.username}
                onChange={set("username")}
                placeholder="用户名 / 昵称 / 邮箱"
                autoComplete="username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p">密码</Label>
              <Input
                id="p"
                type="password"
                value={form.password}
                onChange={set("password")}
                autoComplete="current-password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c">验证码</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="c"
                  value={form.captcha}
                  onChange={set("captcha")}
                  placeholder="计算结果"
                  autoComplete="off"
                  inputMode="numeric"
                  className="flex-1"
                  required
                />
                <button
                  type="button"
                  onClick={loadCap}
                  className="h-10 w-28 shrink-0 overflow-hidden rounded-md border bg-muted hover:border-primary/40"
                >
                  {cap ? (
                    <img
                      src={cap.image}
                      alt="captcha"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      加载中
                    </span>
                  )}
                </button>
              </div>
            </div>
            {err && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {err}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={busy || !cap}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "登录"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

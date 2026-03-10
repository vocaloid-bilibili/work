// src/views/Login.tsx

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { AUTH_BASE } from "@/utils/auth";

export default function Login() {
  const navigate = useNavigate();
  const { role, loading: authLoading, login } = useAuth();

  const [form, setForm] = useState({
    username: "",
    password: "",
    captchaAnswer: "",
  });
  const [captcha, setCaptcha] = useState<{
    code_id: number;
    image: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const captchaLock = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    if (!authLoading && role !== "guest") {
      navigate("/", { replace: true });
    }
  }, [role, authLoading, navigate]);

  const loadCaptcha = useCallback(async () => {
    if (captchaLock.current) return;
    captchaLock.current = true;
    try {
      const res = await fetch(`${AUTH_BASE}/auth/captcha`);
      if (!res.ok) return;
      const data = await res.json();
      setCaptcha(data);
      setForm((f) => ({ ...f, captchaAnswer: "" }));
    } catch {
      // ignore
    } finally {
      captchaLock.current = false;
    }
  }, []);

  useEffect(() => {
    if (authLoading || role !== "guest") return;
    if (mounted.current) return;
    mounted.current = true;
    loadCaptcha();
  }, [authLoading, role, loadCaptcha]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captcha || loading) return;

    setLoading(true);
    setError(null);
    try {
      await login(
        form.username.trim(),
        form.password,
        captcha.code_id,
        form.captchaAnswer.trim(),
      );
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");

      await loadCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const set =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  if (authLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">登录运维后台</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                value={form.username}
                onChange={set("username")}
                placeholder="用户名 / 昵称 / 邮箱"
                autoComplete="username"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={set("password")}
                autoComplete="current-password"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="captcha">验证码</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="captcha"
                  value={form.captchaAnswer}
                  onChange={set("captchaAnswer")}
                  placeholder="计算结果"
                  autoComplete="off"
                  inputMode="numeric"
                  className="flex-1"
                  required
                />
                <button
                  type="button"
                  onClick={loadCaptcha}
                  className="h-10 w-28 shrink-0 overflow-hidden rounded-md border bg-muted transition hover:border-primary/40"
                >
                  {captcha ? (
                    <img
                      src={captcha.image}
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

            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !captcha}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "登录"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface UserSession {
  userId: string;
  username: string;
  displayName: string;
  role: "admin" | "user";
}

export default function NavBar() {
  const [session, setSession] = useState<UserSession | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setSession)
      .catch(() => setSession(null));
  }, [pathname]);

  if (!session || pathname === "/login") return null;

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const navItems = [
    { href: "/", label: "변환기" },
    { href: "/library", label: "라이브러리" },
  ];
  if (session.role === "admin") {
    navItems.push({ href: "/admin", label: "관리" });
  }

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(10,10,10,0.9)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "0 24px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "52px",
        }}
      >
        {/* 좌: 로고 + 네비 */}
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <Link
            href="/"
            style={{
              fontSize: "16px",
              fontWeight: 800,
              background: "linear-gradient(135deg, #f9a825, #ff8f00)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            MBG
          </Link>

          <div style={{ display: "flex", gap: "4px" }}>
            {navItems.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: active ? "#ffd54f" : "rgba(255,255,255,0.5)",
                    background: active ? "rgba(249,168,37,0.1)" : "transparent",
                    transition: "all 0.15s",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* 우: 유저 정보 + 로그아웃 */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span
            style={{
              fontSize: "13px",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            {session.displayName}
            {session.role === "admin" && (
              <span
                style={{
                  marginLeft: "6px",
                  fontSize: "10px",
                  padding: "2px 6px",
                  borderRadius: "6px",
                  background: "rgba(249,168,37,0.15)",
                  color: "#ffd54f",
                }}
              >
                관리자
              </span>
            )}
          </span>
          <button
            onClick={handleLogout}
            style={{
              padding: "5px 12px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "transparent",
              color: "rgba(255,255,255,0.4)",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            로그아웃
          </button>
        </div>
      </div>
    </nav>
  );
}

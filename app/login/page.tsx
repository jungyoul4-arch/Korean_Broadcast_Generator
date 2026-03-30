"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "로그인 실패");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("서버 연결 오류");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: "380px",
          background: "rgba(255,255,255,0.04)",
          borderRadius: "16px",
          border: "1px solid rgba(255,255,255,0.08)",
          padding: "40px 32px",
        }}
      >
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 800,
            marginBottom: "8px",
            background: "linear-gradient(135deg, #f9a825, #ff8f00)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Korean Broadcast
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "rgba(255,255,255,0.4)",
            marginBottom: "32px",
          }}
        >
          로그인하여 시작하세요
        </p>

        {error && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "10px",
              background: "rgba(239,83,80,0.1)",
              border: "1px solid rgba(239,83,80,0.3)",
              color: "#ef9a9a",
              fontSize: "13px",
              marginBottom: "20px",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              color: "rgba(255,255,255,0.5)",
              marginBottom: "6px",
            }}
          >
            아이디
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            required
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: "28px" }}>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              color: "rgba(255,255,255,0.5)",
              marginBottom: "6px",
            }}
          >
            비밀번호
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "10px",
            border: "none",
            background: loading
              ? "rgba(249,168,37,0.3)"
              : "linear-gradient(135deg, #f9a825, #e65100)",
            color: "#fff",
            fontSize: "15px",
            fontWeight: 700,
            cursor: loading ? "default" : "pointer",
          }}
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.04)",
  color: "#fff",
  fontSize: "14px",
  outline: "none",
};

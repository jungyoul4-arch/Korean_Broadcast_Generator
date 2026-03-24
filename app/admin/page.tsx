"use client";

import { useState, useEffect, useCallback } from "react";

interface User {
  id: string;
  username: string;
  displayName: string;
  role: "admin" | "user";
  groupId?: string;
  createdAt: string;
}

interface Group {
  id: string;
  name: string;
  description?: string;
  memberIds: string[];
  createdAt: string;
}

type Tab = "users" | "groups" | "library";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [libraryData, setLibraryData] = useState<{ problems: unknown[]; total: number; owners: { id: string; name: string }[] } | null>(null);

  // 유저 생성 폼
  const [newUser, setNewUser] = useState<{ username: string; password: string; displayName: string; role: "admin" | "user" }>({ username: "", password: "", displayName: "", role: "user" });
  const [userError, setUserError] = useState("");

  // 그룹 생성 폼
  const [newGroupName, setNewGroupName] = useState("");

  // 라이브러리 필터
  const [libOwner, setLibOwner] = useState("");

  const fetchUsers = useCallback(async () => {
    const r = await fetch("/api/admin/users");
    if (r.ok) { const d = await r.json(); setUsers(d.users); }
  }, []);

  const fetchGroups = useCallback(async () => {
    const r = await fetch("/api/admin/groups");
    if (r.ok) { const d = await r.json(); setGroups(d.groups); }
  }, []);

  const fetchLibrary = useCallback(async () => {
    const params = new URLSearchParams();
    if (libOwner) params.set("owner", libOwner);
    params.set("limit", "100");
    const r = await fetch(`/api/admin/library?${params}`);
    if (r.ok) setLibraryData(await r.json());
  }, [libOwner]);

  useEffect(() => {
    fetchUsers();
    fetchGroups();
  }, [fetchUsers, fetchGroups]);

  useEffect(() => {
    if (tab === "library") fetchLibrary();
  }, [tab, fetchLibrary]);

  // ── 유저 관리 ──

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError("");
    const r = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });
    const d = await r.json();
    if (!r.ok) { setUserError(d.error); return; }
    setNewUser({ username: "", password: "", displayName: "", role: "user" });
    fetchUsers();
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`"${name}" 유저를 삭제하시겠습니까?`)) return;
    await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchUsers();
  };

  const handleResetPassword = async (id: string) => {
    const pw = prompt("새 비밀번호를 입력하세요:");
    if (!pw) return;
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, password: pw }),
    });
    alert("비밀번호가 변경되었습니다");
  };

  // ── 그룹 관리 ──

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    await fetch("/api/admin/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newGroupName }),
    });
    setNewGroupName("");
    fetchGroups();
  };

  const handleDeleteGroup = async (id: string, name: string) => {
    if (!confirm(`"${name}" 그룹을 삭제하시겠습니까? 멤버들의 그룹이 해제됩니다.`)) return;
    await fetch(`/api/admin/groups/${id}`, { method: "DELETE" });
    fetchGroups();
    fetchUsers();
  };

  const handleAddMember = async (groupId: string, userId: string) => {
    await fetch(`/api/admin/groups/${groupId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addMember: userId }),
    });
    fetchGroups();
    fetchUsers();
  };

  const handleRemoveMember = async (groupId: string, userId: string) => {
    await fetch(`/api/admin/groups/${groupId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ removeMember: userId }),
    });
    fetchGroups();
    fetchUsers();
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "32px 24px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "24px", color: "#ffd54f" }}>
        관리자
      </h1>

      {/* 탭 */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "28px" }}>
        {(["users", "groups", "library"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 20px",
              borderRadius: "8px",
              border: "none",
              background: tab === t ? "rgba(249,168,37,0.15)" : "rgba(255,255,255,0.04)",
              color: tab === t ? "#ffd54f" : "rgba(255,255,255,0.5)",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {{ users: "유저", groups: "그룹", library: "라이브러리" }[t]}
          </button>
        ))}
      </div>

      {/* ── 유저 탭 ── */}
      {tab === "users" && (
        <div>
          {/* 생성 폼 */}
          <form onSubmit={handleCreateUser} style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
            <input placeholder="아이디" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} required style={inputStyle} />
            <input placeholder="비밀번호" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required style={inputStyle} />
            <input placeholder="이름" value={newUser.displayName} onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })} required style={inputStyle} />
            <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value as "user" | "admin" })} style={{ ...inputStyle, minWidth: "90px" }}>
              <option value="user">유저</option>
              <option value="admin">관리자</option>
            </select>
            <button type="submit" style={btnPrimary}>생성</button>
          </form>
          {userError && <p style={{ color: "#ef9a9a", fontSize: "13px", marginBottom: "12px" }}>{userError}</p>}

          {/* 유저 목록 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {users.map((u) => (
              <div key={u.id} style={rowStyle}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600, marginRight: "8px" }}>{u.displayName}</span>
                  <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>@{u.username}</span>
                  {u.role === "admin" && <span style={badgeAdmin}>관리자</span>}
                  {u.groupId && (
                    <span style={badgeGroup}>
                      {groups.find((g) => g.id === u.groupId)?.name || "그룹"}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button onClick={() => handleResetPassword(u.id)} style={btnSmall}>비밀번호 변경</button>
                  <button onClick={() => handleDeleteUser(u.id, u.displayName)} style={{ ...btnSmall, color: "#ef9a9a" }}>삭제</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 그룹 탭 ── */}
      {tab === "groups" && (
        <div>
          {/* 그룹 생성 */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
            <input
              placeholder="새 그룹 이름"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button onClick={handleCreateGroup} style={btnPrimary}>그룹 생성</button>
          </div>

          {groups.length === 0 && (
            <p style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "40px" }}>
              아직 생성된 그룹이 없습니다
            </p>
          )}

          {groups.map((g) => {
            const members = users.filter((u) => g.memberIds.includes(u.id));
            const nonMembers = users.filter((u) => !g.memberIds.includes(u.id) && u.role !== "admin");
            return (
              <div key={g.id} style={{ ...rowStyle, flexDirection: "column", alignItems: "stretch", marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#ffd54f" }}>{g.name}</h3>
                  <button onClick={() => handleDeleteGroup(g.id, g.name)} style={{ ...btnSmall, color: "#ef9a9a" }}>그룹 삭제</button>
                </div>

                {/* 현재 멤버 */}
                <div style={{ marginBottom: "10px" }}>
                  <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "6px", display: "block" }}>
                    멤버 ({members.length}명)
                  </span>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {members.map((m) => (
                      <span key={m.id} style={{ ...tagChip, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        {m.displayName}
                        <button
                          onClick={() => handleRemoveMember(g.id, m.id)}
                          style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "12px", padding: 0 }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {members.length === 0 && <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.2)" }}>멤버 없음</span>}
                  </div>
                </div>

                {/* 멤버 추가 */}
                {nonMembers.length > 0 && (
                  <div>
                    <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "6px", display: "block" }}>
                      추가 가능
                    </span>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {nonMembers.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => handleAddMember(g.id, u.id)}
                          style={{ ...tagChip, cursor: "pointer", background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
                        >
                          + {u.displayName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── 라이브러리 탭 ── */}
      {tab === "library" && libraryData && (
        <div>
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px", alignItems: "center" }}>
            <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)" }}>
              전체 {libraryData.total}개 문제
            </span>
            <select value={libOwner} onChange={(e) => setLibOwner(e.target.value)} style={inputStyle}>
              <option value="">전체 유저</option>
              {libraryData.owners.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>

          {(libraryData.problems as Array<{ id: string; subject: string; unitName: string; source: string; ownerName: string; createdAt: string }>).map((p) => (
            <div key={p.id} style={{ ...rowStyle, marginBottom: "6px" }}>
              <div style={{ flex: 1, display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: "12px", padding: "2px 8px", borderRadius: "8px", background: "rgba(100,181,246,0.15)", color: "#90caf9" }}>
                  {p.subject}
                </span>
                {p.unitName && (
                  <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>{p.unitName}</span>
                )}
                {p.source && (
                  <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>{p.source}</span>
                )}
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "8px", background: "rgba(129,199,132,0.1)", color: "#a5d6a7" }}>
                  {p.ownerName}
                </span>
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)" }}>
                  {new Date(p.createdAt).toLocaleDateString("ko-KR")}
                </span>
              </div>
            </div>
          ))}

          {libraryData.problems.length === 0 && (
            <p style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "40px" }}>
              저장된 문제가 없습니다
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── 스타일 ──

const inputStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.04)",
  color: "#fff",
  fontSize: "13px",
  outline: "none",
};

const btnPrimary: React.CSSProperties = {
  padding: "8px 18px",
  borderRadius: "8px",
  border: "none",
  background: "linear-gradient(135deg, #f9a825, #e65100)",
  color: "#fff",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
};

const btnSmall: React.CSSProperties = {
  padding: "4px 10px",
  borderRadius: "6px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "transparent",
  color: "rgba(255,255,255,0.5)",
  fontSize: "11px",
  cursor: "pointer",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "12px 16px",
  borderRadius: "10px",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
};

const badgeAdmin: React.CSSProperties = {
  marginLeft: "6px",
  fontSize: "10px",
  padding: "2px 6px",
  borderRadius: "6px",
  background: "rgba(249,168,37,0.15)",
  color: "#ffd54f",
};

const badgeGroup: React.CSSProperties = {
  marginLeft: "6px",
  fontSize: "10px",
  padding: "2px 6px",
  borderRadius: "6px",
  background: "rgba(100,181,246,0.15)",
  color: "#90caf9",
};

const tagChip: React.CSSProperties = {
  padding: "4px 10px",
  borderRadius: "8px",
  border: "1px solid rgba(249,168,37,0.2)",
  background: "rgba(249,168,37,0.08)",
  color: "rgba(255,213,79,0.8)",
  fontSize: "12px",
};

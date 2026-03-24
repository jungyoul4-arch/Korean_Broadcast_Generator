"use client";

import { useState, useEffect, useCallback } from "react";

interface SavedProblem {
  id: string;
  createdAt: string;
  ownerId: string;
  ownerName?: string;
  subject: string;
  unitName: string;
  type: string;
  points: number;
  difficulty: number;
  source: string;
  tags: string[];
  hasOriginal: boolean;
  hasProblemPng: boolean;
  hasContiPng: boolean;
  bodyHtml: string;
  headerText?: string;
  footerText?: string;
}

interface LibraryData {
  problems: SavedProblem[];
  total: number;
  subjects: string[];
  units: string[];
  allTags: string[];
  owners: { id: string; name: string }[];
}

export default function LibraryPage() {
  const [data, setData] = useState<LibraryData | null>(null);
  const [loading, setLoading] = useState(true);

  // 필터 상태
  const [subject, setSubject] = useState("");
  const [unit, setUnit] = useState("");
  const [tag, setTag] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // 상세 보기
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 태그 편집
  const [editingTags, setEditingTags] = useState<string | null>(null);
  const [editTagsValue, setEditTagsValue] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const fetchLibrary = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (subject) params.set("subject", subject);
    if (unit) params.set("unit", unit);
    if (tag) params.set("tag", tag);
    if (difficulty) params.set("difficulty", difficulty);
    if (search) params.set("search", search);

    const res = await fetch(`/api/library?${params}`);
    if (res.ok) {
      setData(await res.json());
    }
    setLoading(false);
  }, [subject, unit, tag, difficulty, search]);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  // 과목 변경 시 단원 리셋
  const handleSubjectChange = (s: string) => {
    setSubject(s);
    setUnit("");
  };

  const handleSearch = () => {
    setSearch(searchInput);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 문제를 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/library/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchLibrary();
      if (selectedId === id) setSelectedId(null);
    }
  };

  const handleSaveTags = async (id: string) => {
    await fetch(`/api/library/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: editTagsValue }),
    });
    setEditingTags(null);
    fetchLibrary();
  };

  const addEditTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !editTagsValue.includes(trimmed)) {
      setEditTagsValue((prev) => [...prev, trimmed]);
    }
    setTagInput("");
  };

  // 다운로드 (서버에서 PNG 파일 가져오기)
  const handleDownload = async (id: string, fileType: "problem" | "conti") => {
    const res = await fetch(`/api/library/${id}?file=${fileType}`);
    if (!res.ok) return;
    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${id}_${fileType}.png`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const diffLabel = (d: number) =>
    ({ 1: "기본", 2: "쉬움", 3: "보통", 4: "준킬러", 5: "킬러" })[d] || "";

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "40px 24px",
        minHeight: "100vh",
      }}
    >
      {/* 헤더 */}
      <header style={{ marginBottom: "32px" }}>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 800,
            marginBottom: "8px",
            background: "linear-gradient(135deg, #f9a825, #ff8f00)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          문제 라이브러리
        </h1>
        <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.5)" }}>
          {data ? `총 ${data.total}개 문제` : "로딩 중..."}
        </p>
      </header>

      {/* 필터 바 */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "24px",
        }}
      >
        {/* 과목 */}
        <select
          value={subject}
          onChange={(e) => handleSubjectChange(e.target.value)}
          style={selectStyle}
        >
          <option value="">전체 과목</option>
          {data?.subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* 단원 */}
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          style={selectStyle}
        >
          <option value="">전체 단원</option>
          {data?.units.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>

        {/* 난이도 */}
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          style={selectStyle}
        >
          <option value="">전체 난이도</option>
          <option value="1">기본</option>
          <option value="2">쉬움</option>
          <option value="3">보통</option>
          <option value="4">준킬러</option>
          <option value="5">킬러</option>
        </select>

        {/* 검색 */}
        <div style={{ display: "flex", gap: "4px", flex: 1, minWidth: "200px" }}>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="검색 (출처, 내용, 태그...)"
            style={{
              flex: 1,
              padding: "8px 14px",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.04)",
              color: "#fff",
              fontSize: "13px",
              outline: "none",
            }}
          />
          <button
            onClick={handleSearch}
            style={{
              padding: "8px 16px",
              borderRadius: "10px",
              border: "none",
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            검색
          </button>
        </div>
      </div>

      {/* 태그 필터 */}
      {data && data.allTags.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
            marginBottom: "24px",
          }}
        >
          {tag && (
            <button
              onClick={() => setTag("")}
              style={{
                ...tagChipStyle,
                background: "rgba(239,83,80,0.15)",
                borderColor: "rgba(239,83,80,0.3)",
                color: "#ef9a9a",
              }}
            >
              {tag} ×
            </button>
          )}
          {data.allTags
            .filter((t) => t !== tag)
            .slice(0, 20)
            .map((t) => (
              <button
                key={t}
                onClick={() => setTag(t)}
                style={tagChipStyle}
              >
                {t}
              </button>
            ))}
        </div>
      )}

      {/* 로딩 */}
      {loading && (
        <div
          style={{
            textAlign: "center",
            padding: "60px",
            color: "rgba(255,255,255,0.4)",
          }}
        >
          로딩 중...
        </div>
      )}

      {/* 빈 상태 */}
      {!loading && data && data.problems.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "80px 20px",
            color: "rgba(255,255,255,0.3)",
          }}
        >
          <p style={{ fontSize: "48px", marginBottom: "16px" }}>{'{ }'}</p>
          <p style={{ fontSize: "16px" }}>
            {subject || unit || tag || search
              ? "검색 결과가 없습니다"
              : "아직 저장된 문제가 없습니다"}
          </p>
          <p style={{ fontSize: "13px", marginTop: "8px" }}>
            변환기에서 문제를 변환한 후 &quot;저장&quot; 버튼을 눌러주세요
          </p>
        </div>
      )}

      {/* 카드 그리드 */}
      {!loading && data && data.problems.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "16px",
          }}
        >
          {data.problems.map((prob) => (
            <div
              key={prob.id}
              style={{
                background: "rgba(255,255,255,0.04)",
                borderRadius: "12px",
                border:
                  selectedId === prob.id
                    ? "1px solid rgba(249,168,37,0.5)"
                    : "1px solid rgba(255,255,255,0.08)",
                overflow: "hidden",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onClick={() =>
                setSelectedId(selectedId === prob.id ? null : prob.id)
              }
            >
              {/* 썸네일 */}
              <div
                style={{
                  background: "#0d3b2e",
                  padding: "12px",
                  display: "flex",
                  justifyContent: "center",
                  height: "180px",
                  overflow: "hidden",
                }}
              >
                <img
                  src={`/api/library/${prob.id}?file=problem`}
                  alt={`문제 ${prob.id}`}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "156px",
                    objectFit: "contain",
                  }}
                />
              </div>

              {/* 정보 */}
              <div style={{ padding: "14px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      padding: "2px 8px",
                      borderRadius: "10px",
                      background: "rgba(100,181,246,0.15)",
                      color: "#90caf9",
                    }}
                  >
                    {prob.subject}
                  </span>
                  {prob.unitName && (
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "2px 8px",
                        borderRadius: "10px",
                        background: "rgba(129,199,132,0.15)",
                        color: "#a5d6a7",
                      }}
                    >
                      {prob.unitName}
                    </span>
                  )}
                  {prob.points > 0 && (
                    <span
                      style={{
                        fontSize: "11px",
                        color: "rgba(255,255,255,0.4)",
                      }}
                    >
                      {prob.points}점
                    </span>
                  )}
                  {prob.difficulty > 0 && (
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "2px 6px",
                        borderRadius: "8px",
                        background:
                          prob.difficulty >= 4
                            ? "rgba(239,83,80,0.15)"
                            : "rgba(255,255,255,0.06)",
                        color:
                          prob.difficulty >= 4
                            ? "#ef9a9a"
                            : "rgba(255,255,255,0.4)",
                      }}
                    >
                      {diffLabel(prob.difficulty)}
                    </span>
                  )}
                </div>

                {prob.source && (
                  <p
                    style={{
                      fontSize: "12px",
                      color: "rgba(255,255,255,0.4)",
                      marginBottom: "8px",
                    }}
                  >
                    {prob.source}
                  </p>
                )}

                {/* 태그 */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "4px",
                  }}
                >
                  {prob.tags.slice(0, 5).map((t) => (
                    <span
                      key={t}
                      style={{
                        fontSize: "10px",
                        padding: "1px 6px",
                        borderRadius: "6px",
                        background: "rgba(249,168,37,0.1)",
                        color: "rgba(255,213,79,0.7)",
                      }}
                    >
                      {t}
                    </span>
                  ))}
                  {prob.tags.length > 5 && (
                    <span
                      style={{
                        fontSize: "10px",
                        color: "rgba(255,255,255,0.3)",
                      }}
                    >
                      +{prob.tags.length - 5}
                    </span>
                  )}
                </div>

                {/* 소유자 + 날짜 */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "8px",
                  }}
                >
                  {prob.ownerName && (
                    <span
                      style={{
                        fontSize: "10px",
                        padding: "1px 6px",
                        borderRadius: "6px",
                        background: "rgba(129,199,132,0.1)",
                        color: "#a5d6a7",
                      }}
                    >
                      {prob.ownerName}
                    </span>
                  )}
                  <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)" }}>
                    {new Date(prob.createdAt).toLocaleDateString("ko-KR")}
                  </span>
                </div>
              </div>

              {/* 상세 패널 (선택 시 확장) */}
              {selectedId === prob.id && (
                <div
                  style={{
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                    padding: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* 태그 편집 */}
                  {editingTags === prob.id ? (
                    <div>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "4px",
                          marginBottom: "8px",
                        }}
                      >
                        {editTagsValue.map((t) => (
                          <button
                            key={t}
                            onClick={() =>
                              setEditTagsValue((prev) =>
                                prev.filter((x) => x !== t)
                              )
                            }
                            style={{
                              ...tagChipStyle,
                              fontSize: "11px",
                              padding: "2px 8px",
                            }}
                          >
                            {t} ×
                          </button>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: "4px" }}>
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && (e.preventDefault(), addEditTag())
                          }
                          placeholder="태그 추가"
                          style={{
                            flex: 1,
                            padding: "6px 10px",
                            borderRadius: "8px",
                            border: "1px solid rgba(255,255,255,0.15)",
                            background: "rgba(255,255,255,0.04)",
                            color: "#fff",
                            fontSize: "12px",
                            outline: "none",
                          }}
                        />
                        <button
                          onClick={() => handleSaveTags(prob.id)}
                          style={{
                            ...actionBtnStyle,
                            background: "rgba(102,187,106,0.2)",
                            color: "#a5d6a7",
                          }}
                        >
                          완료
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingTags(prob.id);
                        setEditTagsValue([...prob.tags]);
                        setTagInput("");
                      }}
                      style={{
                        ...actionBtnStyle,
                        background: "rgba(255,255,255,0.06)",
                      }}
                    >
                      태그 편집
                    </button>
                  )}

                  {/* 액션 버튼들 */}
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={() => handleDownload(prob.id, "problem")}
                      style={{
                        ...actionBtnStyle,
                        flex: 1,
                        background: "rgba(66,165,245,0.15)",
                        color: "#90caf9",
                      }}
                    >
                      문제 PNG
                    </button>
                    {prob.hasContiPng && (
                      <button
                        onClick={() => handleDownload(prob.id, "conti")}
                        style={{
                          ...actionBtnStyle,
                          flex: 1,
                          background: "rgba(124,77,255,0.15)",
                          color: "#b39ddb",
                        }}
                      >
                        콘티 PNG
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(prob.id)}
                      style={{
                        ...actionBtnStyle,
                        background: "rgba(239,83,80,0.15)",
                        color: "#ef9a9a",
                      }}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 스타일 상수 ──────────────────────────────

const selectStyle: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.15)",
  background: "#1a1a1a",
  color: "#fff",
  fontSize: "13px",
  outline: "none",
  minWidth: "140px",
};

const tagChipStyle: React.CSSProperties = {
  padding: "4px 10px",
  borderRadius: "10px",
  border: "1px solid rgba(249,168,37,0.2)",
  background: "rgba(249,168,37,0.08)",
  color: "rgba(255,213,79,0.8)",
  fontSize: "12px",
  cursor: "pointer",
};

const actionBtnStyle: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: "8px",
  border: "none",
  color: "rgba(255,255,255,0.7)",
  fontSize: "12px",
  cursor: "pointer",
};

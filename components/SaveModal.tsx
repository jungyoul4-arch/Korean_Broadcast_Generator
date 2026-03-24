"use client";

import { useState, useCallback } from "react";

interface SaveModalProps {
  autoTags: string[];
  onSave: (tags: string[]) => void;
  onClose: () => void;
  saving?: boolean;
}

export default function SaveModal({
  autoTags,
  onSave,
  onClose,
  saving,
}: SaveModalProps) {
  const [tags, setTags] = useState<string[]>(autoTags);
  const [input, setInput] = useState("");

  const addTag = useCallback(() => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setInput("");
  }, [input, tags]);

  const removeTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addTag();
      }
    },
    [addTag]
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#1a1a1a",
          borderRadius: "16px",
          border: "1px solid rgba(255,255,255,0.1)",
          padding: "28px",
          maxWidth: "480px",
          width: "90%",
          maxHeight: "80vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            fontSize: "18px",
            fontWeight: 700,
            marginBottom: "20px",
            color: "#f9a825",
          }}
        >
          라이브러리에 저장
        </h3>

        {/* 태그 목록 */}
        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              fontSize: "13px",
              color: "rgba(255,255,255,0.5)",
              marginBottom: "8px",
              display: "block",
            }}
          >
            태그 (클릭하여 제거)
          </label>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "6px",
              minHeight: "36px",
            }}
          >
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => removeTag(tag)}
                style={{
                  padding: "4px 12px",
                  borderRadius: "12px",
                  border: "1px solid rgba(249,168,37,0.3)",
                  background: "rgba(249,168,37,0.1)",
                  color: "#ffd54f",
                  fontSize: "12px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {tag} ×
              </button>
            ))}
          </div>
        </div>

        {/* 태그 입력 */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "24px",
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="태그 추가 (Enter)"
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.04)",
              color: "#fff",
              fontSize: "13px",
              outline: "none",
            }}
          />
          <button
            onClick={addTag}
            style={{
              padding: "10px 16px",
              borderRadius: "10px",
              border: "none",
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            추가
          </button>
        </div>

        {/* 액션 버튼 */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.2)",
              background: "transparent",
              color: "rgba(255,255,255,0.6)",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            취소
          </button>
          <button
            onClick={() => onSave(tags)}
            disabled={saving}
            style={{
              padding: "10px 24px",
              borderRadius: "10px",
              border: "none",
              background: saving
                ? "rgba(249,168,37,0.3)"
                : "linear-gradient(135deg, #f9a825, #e65100)",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 600,
              cursor: saving ? "default" : "pointer",
            }}
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}

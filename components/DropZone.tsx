"use client";

import { useCallback, useState, useRef } from "react";

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  compact?: boolean;
}

export default function DropZone({ onFilesSelected, disabled, compact }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      if (e.type === "dragenter" || e.type === "dragover") {
        setIsDragging(true);
      } else if (e.type === "dragleave") {
        setIsDragging(false);
      }
    },
    [disabled]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (disabled) return;

      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/")
      );
      if (files.length > 0) onFilesSelected(files);
    },
    [onFilesSelected, disabled]
  );

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) =>
      f.type.startsWith("image/")
    );
    if (files.length > 0) onFilesSelected(files);
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={handleClick}
      style={{
        border: `2px dashed ${isDragging ? "#f9a825" : "rgba(255,255,255,0.2)"}`,
        borderRadius: "16px",
        padding: compact ? "24px 40px" : "60px 40px",
        textAlign: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        background: isDragging
          ? "rgba(249, 168, 37, 0.05)"
          : "rgba(255,255,255,0.02)",
        transition: "all 0.2s ease",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      {!compact && (
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>
          {isDragging ? "+" : ""}
        </div>
      )}
      <p
        style={{
          fontSize: compact ? "14px" : "18px",
          fontWeight: 600,
          marginBottom: compact ? "0" : "8px",
          color: isDragging ? "#f9a825" : "#e5e5e5",
        }}
      >
        {isDragging
          ? "여기에 놓으세요"
          : compact
            ? "+ 문제 이미지 추가 (드래그 또는 클릭)"
            : "수학 문제 이미지를 드래그 & 드롭"}
      </p>
      {!compact && (
        <>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)" }}>
            또는 클릭하여 파일 선택 (PNG, JPG, WebP)
          </p>
          <p
            style={{
              fontSize: "13px",
              color: "rgba(255,255,255,0.3)",
              marginTop: "8px",
            }}
          >
            여러 장을 동시에 올리면 병렬로 처리됩니다
          </p>
        </>
      )}
    </div>
  );
}

"use client";

import { useCallback, useState, useRef, useEffect } from "react";

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  compact?: boolean;
  label?: string;
}

export default function DropZone({ onFilesSelected, disabled, compact, label }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [pasteFlash, setPasteFlash] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Ctrl+V / Cmd+V 붙여넣기로 이미지 업로드
  useEffect(() => {
    if (disabled) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        onFilesSelected(imageFiles);
        setPasteFlash(true);
        setTimeout(() => setPasteFlash(false), 600);
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [onFilesSelected, disabled]);

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
        border: `2px dashed ${pasteFlash ? "#66bb6a" : isDragging ? "#f9a825" : "rgba(255,255,255,0.2)"}`,
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
            ? `+ ${label || "문제 이미지"} 추가 (드래그 또는 클릭)`
            : `${label || "국어/EBS 문제 이미지"}를 드래그 & 드롭`}
      </p>
      {!compact && (
        <>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)" }}>
            클릭하여 파일 선택 또는 <span style={{ color: "#81c784", fontWeight: 600 }}>Ctrl+V</span>로 붙여넣기
          </p>
          <p
            style={{
              fontSize: "13px",
              color: "rgba(255,255,255,0.3)",
              marginTop: "8px",
            }}
          >
            PNG, JPG, WebP | 여러 장 동시 업로드 가능
          </p>
        </>
      )}
    </div>
  );
}

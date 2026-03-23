"use client";

interface ProgressBarProps {
  current: number;
  total: number;
  label: string;
}

export default function ProgressBar({
  current,
  total,
  label,
}: ProgressBarProps) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div style={{ marginBottom: "16px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "6px",
          fontSize: "13px",
          color: "rgba(255,255,255,0.6)",
        }}
      >
        <span>{label}</span>
        <span>
          {current}/{total} ({percent}%)
        </span>
      </div>
      <div
        style={{
          height: "6px",
          background: "rgba(255,255,255,0.08)",
          borderRadius: "3px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${percent}%`,
            background: "linear-gradient(90deg, #f9a825, #ff8f00)",
            borderRadius: "3px",
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}

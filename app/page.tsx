"use client";

import { useState, useCallback } from "react";
import DropZone from "@/components/DropZone";
import ProblemCard from "@/components/ProblemCard";
import ProgressBar from "@/components/ProgressBar";
import SaveModal from "@/components/SaveModal";

interface ProblemState {
  id: string;
  file: File;
  number: number;
  status: "pending" | "analyzing" | "ready" | "rendering" | "done" | "error";
  errorMessage?: string;
  itemType: "problem" | "lecture-note";
  linkedProblemNumber?: number;
  subject: string;
  type: string;
  points: number;
  source: string;
  unitName: string;
  headerText: string;
  footerText: string;
  bodyHtml: string;
  html?: string;
  contiHtml?: string;
  originalThumb?: string;
  previewImage?: string;
  pngBase64?: string;
  contiPngBase64?: string;
}

interface PassageState {
  id: string;
  file: File;
  status: "pending" | "analyzing" | "ready" | "rendering" | "done" | "error";
  errorMessage?: string;
  passageHtml: string;
  passageSubject: string;
  passageUnit: string;
  originalThumb?: string;
  html?: string;
  pngBase64?: string;
}

interface NoteState {
  id: string;
  file: File;
  status: "pending" | "analyzing" | "ready" | "rendering" | "done" | "error";
  errorMessage?: string;
  noteHtml: string;
  noteTitle: string;
  noteSubject: string;
  hasDiagram?: boolean;
  originalThumb?: string;
  html?: string;
  pngBase64?: string;
}

interface ProblemSet {
  id: string;
  passages: PassageState[];
  problems: ProblemState[];
  notes: NoteState[];
}

type AppPhase = "upload" | "analyzing" | "preview" | "rendering" | "done";

export default function Home() {
  const [sets, setSets] = useState<ProblemSet[]>([]);
  const [phase, setPhase] = useState<AppPhase>("upload");
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [renderProgress, setRenderProgress] = useState(0);
  const [globalSource, setGlobalSource] = useState("");
  const [backgroundPreset, setBackgroundPreset] = useState<"transparent" | "chalkboard" | "gradient-dark" | "gradient-navy" | "paper">("transparent");
  const [saveModalTarget, setSaveModalTarget] = useState<"all" | string | null>(null);
  const [savingToLibrary, setSavingToLibrary] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  // 모든 세트의 문제를 평탄화
  const allProblems = sets.flatMap((s) => s.problems);

  // 새 세트 추가
  const addSet = useCallback(() => {
    setSets((prev) => [
      ...prev,
      { id: `set-${Date.now()}`, passages: [], problems: [], notes: [] },
    ]);
  }, []);

  // 세트 삭제
  const removeSet = useCallback((setId: string) => {
    setSets((prev) => prev.filter((s) => s.id !== setId));
  }, []);

  // 지문 이미지 업로드
  const handlePassageSelected = useCallback(
    async (setId: string, files: File[]) => {
      if (files.length === 0) return;
      const sorted = files.sort((a, b) => a.name.localeCompare(b.name));

      const thumbs = await Promise.all(
        sorted.map(
          (file) =>
            new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            })
        )
      );

      const newPassages: PassageState[] = sorted.map((file, i) => ({
        id: `passage-${Date.now()}-${i}`,
        file,
        status: "pending" as const,
        passageHtml: "",
        passageSubject: "",
        passageUnit: "",
        originalThumb: thumbs[i],
      }));

      setSets((prev) =>
        prev.map((s) => (s.id === setId ? { ...s, passages: [...s.passages, ...newPassages] } : s))
      );
    },
    []
  );

  // 문제 이미지 업로드 (세트 내)
  const handleProblemsSelected = useCallback(
    async (setId: string, files: File[]) => {
      const sorted = files.sort((a, b) => a.name.localeCompare(b.name));

      const thumbs = await Promise.all(
        sorted.map(
          (file) =>
            new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            })
        )
      );

      setSets((prev) =>
        prev.map((s) => {
          if (s.id !== setId) return s;
          const startNumber = s.problems.length + 1;
          const newProblems: ProblemState[] = sorted.map((file, i) => ({
            id: `${Date.now()}-${i}`,
            file,
            number: startNumber + i,
            status: "pending" as const,
            itemType: "problem" as const,
            subject: "",
            type: "",
            points: 0,
            source: "",
            unitName: "",
            headerText: "",
            footerText: "",
            bodyHtml: "",
            originalThumb: thumbs[i],
          }));
          return { ...s, problems: [...s.problems, ...newProblems] };
        })
      );
    },
    []
  );

  // 단독 문제 업로드 (세트 없이 — 지문 없는 문제용)
  const handleStandaloneSelected = useCallback(
    async (files: File[]) => {
      const sorted = files.sort((a, b) => a.name.localeCompare(b.name));

      const thumbs = await Promise.all(
        sorted.map(
          (file) =>
            new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            })
        )
      );

      const totalExisting = sets.reduce((acc, s) => acc + s.problems.length, 0);
      const startNumber = totalExisting + 1;

      const newProblems: ProblemState[] = sorted.map((file, i) => ({
        id: `${Date.now()}-${i}`,
        file,
        number: startNumber + i,
        status: "pending" as const,
        itemType: "problem" as const,
        subject: "",
        type: "",
        points: 0,
        source: "",
        unitName: "",
        headerText: "",
        footerText: "",
        bodyHtml: "",
        originalThumb: thumbs[i],
      }));

      setSets((prev) => [
        ...prev,
        { id: `set-${Date.now()}`, passages: [], problems: newProblems, notes: [] },
      ]);
    },
    [sets]
  );

  // 단독 강의노트 업로드 (메인 화면)
  const handleStandaloneNotes = useCallback(
    async (files: File[]) => {
      const sorted = files.sort((a, b) => a.name.localeCompare(b.name));

      const thumbs = await Promise.all(
        sorted.map(
          (file) =>
            new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            })
        )
      );

      const newNotes: NoteState[] = sorted.map((file, i) => ({
        id: `note-${Date.now()}-${i}`,
        file,
        status: "pending" as const,
        noteHtml: "",
        noteTitle: "",
        noteSubject: "",
        originalThumb: thumbs[i],
      }));

      setSets((prev) => [
        ...prev,
        { id: `set-${Date.now()}`, passages: [], problems: [], notes: newNotes },
      ]);
    },
    []
  );

  // 강의노트 이미지 업로드 (세트 내)
  const handleNotesSelected = useCallback(
    async (setId: string, files: File[]) => {
      const sorted = files.sort((a, b) => a.name.localeCompare(b.name));

      const thumbs = await Promise.all(
        sorted.map(
          (file) =>
            new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            })
        )
      );

      const newNotes: NoteState[] = sorted.map((file, i) => ({
        id: `note-${Date.now()}-${i}`,
        file,
        status: "pending" as const,
        noteHtml: "",
        noteTitle: "",
        noteSubject: "",
        originalThumb: thumbs[i],
      }));

      setSets((prev) =>
        prev.map((s) =>
          s.id === setId ? { ...s, notes: [...s.notes, ...newNotes] } : s
        )
      );
    },
    []
  );

  // 문제 업데이트
  const updateProblem = useCallback(
    (probId: string, updates: Partial<ProblemState>) => {
      setSets((prev) =>
        prev.map((s) => ({
          ...s,
          problems: s.problems.map((p) =>
            p.id === probId ? { ...p, ...updates } : p
          ),
        }))
      );
    },
    []
  );

  // 문제 삭제
  const handleRemoveProblem = useCallback((probId: string) => {
    setSets((prev) =>
      prev.map((s) => ({
        ...s,
        problems: s.problems
          .filter((p) => p.id !== probId)
          .map((p, i) => ({ ...p, number: i + 1 })),
      }))
    );
  }, []);

  // 분석 시작 (세트별 파이프라인 병렬 실행)
  const handleStartAnalyze = useCallback(async () => {
    setPhase("analyzing");
    setAnalyzeProgress(0);
    let completed = 0;
    const BATCH = 20;

    const processSet = async (set: ProblemSet) => {
      // 1단계: 지문 분석 (배치 병렬)
      const pendingPassages = set.passages.filter((p) => p.status === "pending");
      if (pendingPassages.length > 0) {
        const analyzePassage = async (passage: PassageState) => {
          const passageIdx = set.passages.indexOf(passage);
          setSets((prev) =>
            prev.map((s) => ({
              ...s,
              passages: s.passages.map((p) =>
                p.id === passage.id ? { ...p, status: "analyzing" as const } : p
              ),
            }))
          );

          try {
            const formData = new FormData();
            formData.append("image", passage.file);
            if (globalSource) formData.append("source", globalSource);
            formData.append("isFirst", passageIdx === 0 ? "true" : "false");

            const res = await fetch("/api/analyze-passage", {
              method: "POST",
              body: formData,
            });

            if (!res.ok) {
              const err = await res.json();
              throw new Error(err.error || "지문 분석 실패");
            }

            const data = await res.json();
            setSets((prev) =>
              prev.map((s) => ({
                ...s,
                passages: s.passages.map((p) =>
                  p.id === passage.id
                    ? {
                        ...p,
                        status: "ready" as const,
                        passageHtml: data.passageHtml,
                        passageSubject: data.passageSubject,
                        passageUnit: data.passageUnit,
                        html: data.html,
                      }
                    : p
                ),
              }))
            );
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "지문 분석 오류";
            setSets((prev) =>
              prev.map((s) => ({
                ...s,
                passages: s.passages.map((p) =>
                  p.id === passage.id ? { ...p, status: "error" as const, errorMessage: message } : p
                ),
              }))
            );
          } finally {
            completed++;
            setAnalyzeProgress(completed);
          }
        };

        for (let i = 0; i < pendingPassages.length; i += BATCH) {
          const batch = pendingPassages.slice(i, i + BATCH);
          await Promise.all(batch.map(analyzePassage));
        }
      }

      // 2단계: 문제 분석 (지문 완료 후, 배치 병렬)
      const pendingProblems = set.problems.filter((p) => p.status === "pending");
      if (pendingProblems.length > 0) {
        let passageHtml = "";
        setSets((prev) => {
          const currentSet = prev.find((s) => s.id === set.id);
          const readyPassages = currentSet?.passages.filter((p) => p.status === "ready") || [];
          if (readyPassages.length > 0) {
            passageHtml = readyPassages.map((p) => p.passageHtml).join("\n\n");
          }
          return prev;
        });

        pendingProblems.forEach((p) => {
          updateProblem(p.id, { status: "analyzing" });
        });

        const analyzeSingle = async (prob: ProblemState) => {
          try {
            const formData = new FormData();
            formData.append("image", prob.file);
            formData.append("number", prob.number.toString());
            const source = prob.source || globalSource;
            if (source) formData.append("source", source);
            if (prob.headerText) formData.append("headerText", prob.headerText);
            if (prob.footerText) formData.append("footerText", prob.footerText);
            if (passageHtml) formData.append("passageHtml", passageHtml);
            formData.append("background", backgroundPreset);

            const res = await fetch("/api/analyze", {
              method: "POST",
              body: formData,
            });

            if (!res.ok) {
              const err = await res.json();
              throw new Error(err.error || "분석 실패");
            }

            const data = await res.json();
            updateProblem(prob.id, {
              status: "ready",
              subject: data.problemData.subject,
              type: data.problemData.type,
              points: data.problemData.points,
              unitName: data.problemData.unitName || "",
              bodyHtml: data.problemData.bodyHtml || "",
              html: data.html,
              contiHtml: data.contiHtml || undefined,
            });
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "알 수 없는 오류";
            updateProblem(prob.id, { status: "error", errorMessage: message });
          } finally {
            completed++;
            setAnalyzeProgress(completed);
          }
        };

        for (let i = 0; i < pendingProblems.length; i += BATCH) {
          const batch = pendingProblems.slice(i, i + BATCH);
          await Promise.all(batch.map(analyzeSingle));
        }
      }

      // 3단계: 강의노트 분석 (배치 병렬)
      const pendingNotes = set.notes.filter((n) => n.status === "pending");
      if (pendingNotes.length > 0) {
        const analyzeNote = async (note: NoteState) => {
          setSets((prev) =>
            prev.map((s) => ({
              ...s,
              notes: s.notes.map((n) =>
                n.id === note.id ? { ...n, status: "analyzing" as const } : n
              ),
            }))
          );

          try {
            const formData = new FormData();
            formData.append("image", note.file);
            if (globalSource) formData.append("source", globalSource);
            formData.append("background", backgroundPreset);

            const res = await fetch("/api/analyze-note", {
              method: "POST",
              body: formData,
            });

            if (!res.ok) {
              const err = await res.json();
              throw new Error(err.error || "강의노트 분석 실패");
            }

            const data = await res.json();
            setSets((prev) =>
              prev.map((s) => ({
                ...s,
                notes: s.notes.map((n) =>
                  n.id === note.id
                    ? {
                        ...n,
                        status: "ready" as const,
                        noteHtml: data.noteHtml,
                        noteTitle: data.noteTitle,
                        noteSubject: data.noteSubject,
                        hasDiagram: data.hasDiagram || false,
                        html: data.html,
                      }
                    : n
                ),
              }))
            );
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "강의노트 분석 오류";
            setSets((prev) =>
              prev.map((s) => ({
                ...s,
                notes: s.notes.map((n) =>
                  n.id === note.id ? { ...n, status: "error" as const, errorMessage: message } : n
                ),
              }))
            );
          } finally {
            completed++;
            setAnalyzeProgress(completed);
          }
        };

        for (let i = 0; i < pendingNotes.length; i += BATCH) {
          const batch = pendingNotes.slice(i, i + BATCH);
          await Promise.all(batch.map(analyzeNote));
        }
      }
    };

    // 모든 세트를 병렬로 처리 (각 세트 내부는 지문→문제→노트 순서 유지)
    await Promise.all(sets.map(processSet));

    setPhase("preview");
  }, [sets, updateProblem, globalSource, backgroundPreset]);

  // 렌더링
  const handleRender = useCallback(async () => {
    const readyProblems = allProblems.filter((p) => p.status === "ready" && p.html);
    const readyPassages = sets
      .flatMap((s) => s.passages)
      .filter((p) => p.status === "ready" && p.html);
    const readyNotes = sets
      .flatMap((s) => s.notes)
      .filter((n) => n.status === "ready" && n.html);

    if (readyProblems.length === 0 && readyPassages.length === 0 && readyNotes.length === 0) return;

    setPhase("rendering");
    setRenderProgress(0);

    readyProblems.forEach((p) => {
      updateProblem(p.id, { status: "rendering" });
    });

    // 지문+노트 상태도 rendering으로
    setSets((prev) =>
      prev.map((s) => ({
        ...s,
        passages: s.passages.map((p) =>
          p.status === "ready" && p.html ? { ...p, status: "rendering" as const } : p
        ),
        notes: s.notes.map((n) =>
          n.status === "ready" && n.html ? { ...n, status: "rendering" as const } : n
        ),
      }))
    );

    // 렌더링 아이템: 지문(번호 2000+) + 강의노트(번호 3000+) + 문제
    const items = [
      ...readyPassages.map((p, i) => ({
        html: p.html!,
        number: 2000 + i,
        type: "passage" as const,
      })),
      ...readyNotes.map((n, i) => ({
        html: n.html!,
        number: 3000 + i,
        type: "note" as const,
      })),
      ...readyProblems.map((p) => ({
        html: p.html!,
        number: p.number,
        type: "problem" as const,
      })),
    ];

    try {
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, omitBackground: backgroundPreset === "transparent" }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "렌더링 실패");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("스트림을 읽을 수 없습니다");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;

          try {
            const result = JSON.parse(data);
            if (result.error) throw new Error(result.error);

            if (result.number >= 3000) {
              // 강의노트 렌더링 완료
              const noteIdx = result.number - 3000;
              const noteId = readyNotes[noteIdx]?.id;
              if (noteId) {
                setSets((prev) =>
                  prev.map((s) => ({
                    ...s,
                    notes: s.notes.map((n) =>
                      n.id === noteId ? { ...n, status: "done" as const, pngBase64: result.pngBase64 } : n
                    ),
                  }))
                );
              }
              setRenderProgress((prev) => prev + 1);
            } else if (result.number >= 2000) {
              // 지문 렌더링 완료
              const passageIdx = result.number - 2000;
              const passageId = readyPassages[passageIdx]?.id;
              if (passageId) {
                setSets((prev) =>
                  prev.map((s) => ({
                    ...s,
                    passages: s.passages.map((p) =>
                      p.id === passageId ? { ...p, status: "done" as const, pngBase64: result.pngBase64 } : p
                    ),
                  }))
                );
              }
              setRenderProgress((prev) => prev + 1);
            } else {
              const prob = readyProblems.find((p) => p.number === result.number);
              if (prob) {
                updateProblem(prob.id, {
                  status: "done",
                  pngBase64: result.pngBase64,
                });
                setRenderProgress((prev) => prev + 1);
              }
            }
          } catch (e) {
            if (e instanceof Error && e.message !== "렌더링 오류") {
              console.warn("SSE 파싱 경고:", e);
            }
          }
        }
      }

      setPhase("done");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "렌더링 오류";
      readyProblems.forEach((p) => {
        updateProblem(p.id, { status: "error", errorMessage: message });
      });
      setPhase("preview");
    }
  }, [allProblems, sets, updateProblem]);

  // 다운로드 헬퍼
  const downloadBase64 = useCallback((base64: string, filename: string) => {
    const byteChars = atob(base64);
    const byteArray = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteArray[i] = byteChars.charCodeAt(i);
    }
    const blob = new Blob([byteArray], { type: "image/png" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const handleDownloadProblem = useCallback(
    (prob: ProblemState) => {
      if (!prob.pngBase64) return;
      downloadBase64(prob.pngBase64, `prob${prob.number}_문제.png`);
    },
    [downloadBase64]
  );

  const handleDownloadAll = useCallback(async () => {
    const doneProblems = allProblems.filter((p) => p.status === "done" && p.pngBase64);
    const donePassages = sets.flatMap((s) => s.passages).filter((p) => p.status === "done" && p.pngBase64);
    const doneNotes = sets.flatMap((s) => s.notes).filter((n) => n.status === "done" && n.pngBase64);

    const allFiles = [
      ...doneProblems.map((p) => ({ name: `prob${p.number}_문제.png`, base64: p.pngBase64! })),
      ...donePassages.map((p, i) => ({ name: `passage_${i + 1}_지문.png`, base64: p.pngBase64! })),
      ...doneNotes.map((n) => ({ name: `note_${n.noteTitle || '강의노트'}.png`, base64: n.pngBase64! })),
    ];

    if (allFiles.length === 0) return;

    if (allFiles.length === 1) {
      downloadBase64(allFiles[0].base64, allFiles[0].name);
      return;
    }

    const res = await fetch("/api/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files: allFiles }),
    });

    if (!res.ok) return;

    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "korean-broadcast.zip";
    link.click();
    URL.revokeObjectURL(link.href);
  }, [allProblems, sets, downloadBase64]);

  const handleReset = useCallback(() => {
    setSets([]);
    setPhase("upload");
    setAnalyzeProgress(0);
    setRenderProgress(0);
    setSavedIds(new Set());
  }, []);

  // 라이브러리 저장
  const generateAutoTags = useCallback((prob: ProblemState): string[] => {
    const tags: string[] = [];
    if (prob.subject) tags.push(prob.subject);
    if (prob.unitName) tags.push(prob.unitName);
    if (prob.type) tags.push(prob.type);
    if (prob.points) tags.push(`${prob.points}점`);
    const src = prob.source || globalSource;
    if (src) {
      const patterns: RegExp[] = [
        /(\d{4})/, /(수능|모의고사|학력평가|교육청|평가원|수능특강|수능완성)/,
        /(6월|9월|3월|4월|7월|10월|11월)/, /(고[123]|중[123])/, /(기출|EBS)/,
      ];
      for (const pat of patterns) {
        const m = src.match(pat);
        if (m) tags.push(m[1]);
      }
    }
    return [...new Set(tags)];
  }, [globalSource]);

  const fileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.includes(",") ? result.split(",")[1] : result);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleSaveToLibrary = useCallback(async (tags: string[]) => {
    setSavingToLibrary(true);
    try {
      const targetProblems = saveModalTarget === "all"
        ? allProblems.filter((p) => p.status === "done" && p.pngBase64 && !savedIds.has(p.id))
        : allProblems.filter((p) => p.id === saveModalTarget && p.pngBase64);

      for (const prob of targetProblems) {
        const originalBase64 = prob.file ? await fileToBase64(prob.file) : undefined;
        const res = await fetch("/api/library", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemType: prob.itemType,
            subject: prob.subject,
            unitName: prob.unitName,
            type: prob.type,
            points: prob.points,
            difficulty: 0,
            source: prob.source || globalSource,
            bodyHtml: prob.bodyHtml,
            headerText: prob.headerText,
            footerText: prob.footerText,
            tags,
            originalImageBase64: originalBase64,
            problemPngBase64: prob.pngBase64,
            html: prob.html,
          }),
        });
        if (res.ok) {
          setSavedIds((prev) => new Set(prev).add(prob.id));
        }
      }
      setSaveModalTarget(null);
    } catch (err) {
      console.error("라이브러리 저장 오류:", err);
    } finally {
      setSavingToLibrary(false);
    }
  }, [saveModalTarget, allProblems, savedIds, globalSource, fileToBase64]);

  const allNotes = sets.flatMap((s) => s.notes);
  const allPassages = sets.flatMap((s) => s.passages);
  const pendingCount = allProblems.filter((p) => p.status === "pending").length
    + allPassages.filter((p) => p.status === "pending").length
    + allNotes.filter((n) => n.status === "pending").length;
  const readyCount = allProblems.filter((p) => p.status === "ready").length
    + allPassages.filter((p) => p.status === "ready" && p.html).length
    + allNotes.filter((n) => n.status === "ready" && n.html).length;
  const doneCount = allProblems.filter((p) => p.status === "done").length
    + allPassages.filter((p) => p.status === "done").length
    + allNotes.filter((n) => n.status === "done").length;
  const errorCount = allProblems.filter((p) => p.status === "error").length;
  const totalAnalyze = allProblems.length + allPassages.length + allNotes.length;

  return (
    <div
      style={{
        maxWidth: "960px",
        margin: "0 auto",
        padding: "40px 24px",
        minHeight: "100vh",
      }}
    >
      {/* 헤더 */}
      <header style={{ marginBottom: "40px" }}>
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
          Korean Broadcast Generator
        </h1>
        <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.5)" }}>
          국어/EBS 문제 이미지를 방송용 투명 PNG로 자동 변환
        </p>
      </header>

      {/* 출처 입력 */}
      <div style={{ marginBottom: "16px" }}>
        <input
          type="text"
          value={globalSource}
          onChange={(e) => setGlobalSource(e.target.value)}
          placeholder="출처 입력 (예: 2026 수능, 6월 모의고사, 수능특강 독서)"
          style={{
            width: "100%",
            padding: "12px 20px",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.04)",
            color: "#fff",
            fontSize: "14px",
            outline: "none",
          }}
        />
      </div>

      {/* 배경 스타일 선택 */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginBottom: "8px", fontWeight: 600, letterSpacing: "0.5px" }}>
          배경 스타일
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {([
            { value: "transparent" as const, label: "투명", icon: "◻", desc: "합성용" },
            { value: "chalkboard" as const, label: "칠판", icon: "🟢", desc: "EBS 강의풍" },
            { value: "gradient-dark" as const, label: "다크", icon: "🔵", desc: "프리미엄 다크" },
            { value: "gradient-navy" as const, label: "네이비", icon: "🌊", desc: "EBS 네이비" },
            { value: "paper" as const, label: "종이", icon: "📄", desc: "밝은 종이" },
          ]).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setBackgroundPreset(opt.value)}
              style={{
                padding: "8px 16px",
                borderRadius: "10px",
                border: backgroundPreset === opt.value
                  ? "2px solid #f9a825"
                  : "1px solid rgba(255,255,255,0.1)",
                background: backgroundPreset === opt.value
                  ? "rgba(249,168,37,0.12)"
                  : "rgba(255,255,255,0.03)",
                color: backgroundPreset === opt.value ? "#ffd54f" : "rgba(255,255,255,0.7)",
                fontSize: "13px",
                fontWeight: backgroundPreset === opt.value ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>{opt.icon}</span>
              <span>{opt.label}</span>
              <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)" }}>{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 세트 목록 */}
      {sets.map((set, setIdx) => (
        <div
          key={set.id}
          style={{
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "16px",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#ce93d8" }}>
              세트 {setIdx + 1}
            </h3>
            <button
              onClick={() => removeSet(set.id)}
              style={{
                background: "rgba(239,83,80,0.6)",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
                padding: "4px 12px",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              세트 삭제
            </button>
          </div>

          {/* 지문 영역 (여러 장 지원) */}
          <div style={{ marginBottom: "12px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#ce93d8", marginBottom: "6px" }}>
              지문 (제시문) — 여러 장 업로드 가능
            </div>
            {set.passages.length > 0 && (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "12px",
                marginBottom: "12px",
              }}>
                {set.passages.map((passage, pIdx) => (
                  <div
                    key={passage.id}
                    style={{
                      position: "relative",
                      borderRadius: "12px",
                      border: "1px solid rgba(171,71,188,0.3)",
                      background: "rgba(171,71,188,0.04)",
                      overflow: "hidden",
                    }}
                  >
                    {passage.pngBase64 ? (
                      <img src={`data:image/png;base64,${passage.pngBase64}`} alt="지문 PNG"
                        style={{ width: "100%", borderRadius: "12px 12px 0 0", background: "#1a1a2e" }} />
                    ) : passage.originalThumb ? (
                      <img src={passage.originalThumb} alt="지문"
                        style={{ width: "100%", maxHeight: "200px", objectFit: "cover", borderRadius: "12px 12px 0 0" }} />
                    ) : null}
                    <div style={{ padding: "10px 14px" }}>
                      <div style={{
                        fontSize: "13px", fontWeight: 600, marginBottom: "6px",
                        color: passage.status === "done" ? "#66bb6a"
                          : passage.status === "ready" ? "#81c784"
                          : passage.status === "error" ? "#ef5350"
                          : passage.status === "analyzing" || passage.status === "rendering" ? "#42a5f5"
                          : "#ce93d8",
                      }}>
                        {passage.status === "done" ? `지문 ${pIdx + 1} 완료`
                          : passage.status === "rendering" ? "렌더링 중..."
                          : passage.status === "ready" ? `지문 ${pIdx + 1} 분석완료`
                          : passage.status === "error" ? `오류: ${passage.errorMessage || ""}`
                          : passage.status === "analyzing" ? "분석 중..."
                          : `지문 ${pIdx + 1} 대기`}
                      </div>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {passage.status === "done" && passage.pngBase64 && (
                          <button onClick={() => {
                            const byteChars = atob(passage.pngBase64!);
                            const byteArray = new Uint8Array(byteChars.length);
                            for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);
                            const blob = new Blob([byteArray], { type: "image/png" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url; a.download = `set${setIdx+1}_지문${pIdx+1}.png`;
                            document.body.appendChild(a); a.click(); document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          }} style={{
                            background: "rgba(102,187,106,0.7)", border: "none", borderRadius: "6px",
                            color: "#fff", padding: "4px 12px", fontSize: "11px", fontWeight: 600, cursor: "pointer",
                          }}>PNG 다운로드</button>
                        )}
                        {(passage.status === "done" || passage.status === "ready" || passage.status === "error") && (
                          <button onClick={() => setSets((prev) => prev.map((s) => s.id === set.id
                            ? { ...s, passages: s.passages.map((p) => p.id === passage.id
                                ? { ...p, status: "pending" as const, pngBase64: undefined, html: undefined, passageHtml: "", errorMessage: undefined }
                                : p)}
                            : s))}
                            style={{
                              background: "rgba(124,77,255,0.7)", border: "none", borderRadius: "6px",
                              color: "#fff", padding: "4px 12px", fontSize: "11px", fontWeight: 600, cursor: "pointer",
                            }}>재분석</button>
                        )}
                        <button onClick={() => setSets((prev) => prev.map((s) => s.id === set.id
                          ? { ...s, passages: s.passages.filter((p) => p.id !== passage.id) } : s))}
                          style={{
                            background: "rgba(239,83,80,0.6)", border: "none", borderRadius: "6px",
                            color: "#fff", padding: "4px 12px", fontSize: "11px", cursor: "pointer", marginLeft: "auto",
                          }}>삭제</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <DropZone
              onFilesSelected={(files) => handlePassageSelected(set.id, files)}
              disabled={phase === "rendering" || phase === "analyzing"}
              compact
              label="지문 이미지"
            />
          </div>

          {/* 문제 영역 */}
          <div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#42a5f5", marginBottom: "6px" }}>
              문제 이미지
            </div>
            {set.problems.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                  gap: "12px",
                  marginBottom: "12px",
                }}
              >
                {set.problems.map((prob) => (
                  <div key={prob.id} style={{ position: "relative" }}>
                    <ProblemCard
                      number={prob.number}
                      subject={prob.subject || (prob.status === "pending" ? "대기" : "분석 중")}
                      unitName={prob.unitName}
                      bodyHtml={prob.bodyHtml}
                      status={prob.status}
                      errorMessage={prob.errorMessage}
                      originalThumb={prob.originalThumb}
                      previewImage={prob.previewImage}
                      pngBase64={prob.pngBase64}
                      contiPngBase64={prob.contiPngBase64}
                    />
                    {/* 문항번호 + 출처 + 머릿말/꼬릿말 입력 (pending 상태) */}
                    {prob.status === "pending" && (
                      <div style={{ marginTop: "-1px" }}>
                        <div style={{ display: "flex", gap: "4px" }}>
                          <input
                            type="number"
                            value={prob.number}
                            onChange={(e) => updateProblem(prob.id, { number: parseInt(e.target.value) || 1 })}
                            placeholder="번호"
                            style={{
                              width: "60px",
                              padding: "8px 10px",
                              border: "1px solid rgba(255,255,255,0.08)",
                              borderTop: "none",
                              background: "rgba(249,168,37,0.08)",
                              color: "#f9a825",
                              fontSize: "14px",
                              fontWeight: 700,
                              textAlign: "center",
                              outline: "none",
                            }}
                          />
                          <input
                            type="text"
                            value={prob.source}
                            onChange={(e) => updateProblem(prob.id, { source: e.target.value })}
                            placeholder="출처 (예: 2026 수능 21번)"
                            style={{
                              flex: 1,
                              padding: "8px 12px",
                              border: "1px solid rgba(255,255,255,0.08)",
                              borderTop: "none",
                              borderLeft: "none",
                              background: "rgba(255,255,255,0.03)",
                              color: "#fff",
                              fontSize: "12px",
                              outline: "none",
                            }}
                          />
                        </div>
                        <input
                          type="text"
                          value={prob.headerText}
                          onChange={(e) => updateProblem(prob.id, { headerText: e.target.value })}
                          placeholder="머릿말 (예: OO쌤의 적중문항)"
                          style={{
                            width: "100%",
                            padding: "7px 12px",
                            border: "1px solid rgba(249,168,37,0.15)",
                            borderTop: "none",
                            background: "rgba(249,168,37,0.04)",
                            color: "rgba(255,213,79,0.9)",
                            fontSize: "11px",
                            outline: "none",
                          }}
                        />
                        <input
                          type="text"
                          value={prob.footerText}
                          onChange={(e) => updateProblem(prob.id, { footerText: e.target.value })}
                          placeholder="꼬릿말 (예: 문제분석을 해보세요)"
                          style={{
                            width: "100%",
                            padding: "7px 12px",
                            borderRadius: "0 0 12px 12px",
                            border: "1px solid rgba(100,181,246,0.15)",
                            borderTop: "none",
                            background: "rgba(100,181,246,0.04)",
                            color: "rgba(144,202,249,0.9)",
                            fontSize: "11px",
                            outline: "none",
                          }}
                        />
                      </div>
                    )}
                    {/* 삭제 버튼 */}
                    {(prob.status === "pending" || prob.status === "ready" || prob.status === "error") && (
                      <button
                        onClick={() => handleRemoveProblem(prob.id)}
                        style={{
                          position: "absolute",
                          top: "6px",
                          right: "6px",
                          background: "rgba(239,83,80,0.8)",
                          border: "none",
                          borderRadius: "50%",
                          color: "#fff",
                          width: "24px",
                          height: "24px",
                          fontSize: "14px",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        ×
                      </button>
                    )}
                    {/* 다운로드/저장 버튼 */}
                    {prob.status === "done" && prob.pngBase64 && (
                      <div style={{
                        position: "absolute",
                        top: "6px",
                        right: "6px",
                        display: "flex",
                        gap: "4px",
                      }}>
                        {!savedIds.has(prob.id) ? (
                          <button
                            onClick={() => setSaveModalTarget(prob.id)}
                            style={{
                              background: "rgba(249,168,37,0.7)",
                              border: "none",
                              borderRadius: "8px",
                              color: "#fff",
                              padding: "3px 8px",
                              fontSize: "10px",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            저장
                          </button>
                        ) : (
                          <span style={{
                            background: "rgba(102,187,106,0.7)",
                            borderRadius: "8px",
                            color: "#fff",
                            padding: "3px 8px",
                            fontSize: "10px",
                            fontWeight: 600,
                          }}>
                            저장됨
                          </span>
                        )}
                        <button
                          onClick={() => handleDownloadProblem(prob)}
                          style={{
                            background: "rgba(0,0,0,0.6)",
                            border: "1px solid rgba(255,255,255,0.2)",
                            borderRadius: "8px",
                            color: "#fff",
                            padding: "3px 8px",
                            fontSize: "10px",
                            cursor: "pointer",
                          }}
                        >
                          PNG
                        </button>
                        <button
                          onClick={() => updateProblem(prob.id, {
                            status: "pending",
                            pngBase64: undefined,
                            html: undefined,
                            bodyHtml: "",
                            subject: "",
                            type: "",
                            unitName: "",
                            errorMessage: undefined,
                          })}
                          style={{
                            background: "rgba(124,77,255,0.7)",
                            border: "none",
                            borderRadius: "8px",
                            color: "#fff",
                            padding: "3px 8px",
                            fontSize: "10px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          재분석
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <DropZone
              onFilesSelected={(files) => handleProblemsSelected(set.id, files)}
              disabled={phase === "rendering" || phase === "analyzing"}
              compact
            />
          </div>

          {/* 강의노트 영역 */}
          <div style={{ marginTop: "12px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#ffb74d", marginBottom: "6px" }}>
              강의노트 (선택)
            </div>
            {set.notes.length > 0 && (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "12px",
                marginBottom: "12px",
              }}>
                {set.notes.map((note) => (
                  <div
                    key={note.id}
                    style={{
                      position: "relative",
                      borderRadius: "12px",
                      border: "1px solid rgba(255,152,0,0.3)",
                      background: "rgba(255,152,0,0.04)",
                      overflow: "hidden",
                    }}
                  >
                    {/* 렌더링 결과 이미지 (큰 미리보기) */}
                    {note.pngBase64 ? (
                      <img
                        src={`data:image/png;base64,${note.pngBase64}`}
                        alt="노트 PNG"
                        style={{ width: "100%", borderRadius: "12px 12px 0 0", background: "#1a1a2e" }}
                      />
                    ) : note.originalThumb ? (
                      <img
                        src={note.originalThumb}
                        alt="노트 원본"
                        style={{ width: "100%", maxHeight: "200px", objectFit: "cover", borderRadius: "12px 12px 0 0" }}
                      />
                    ) : null}

                    {/* 상태 + 제목 */}
                    <div style={{ padding: "10px 14px" }}>
                      <div style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: note.status === "done" ? "#66bb6a"
                          : note.status === "ready" ? "#81c784"
                          : note.status === "error" ? "#ef5350"
                          : note.status === "analyzing" || note.status === "rendering" ? "#42a5f5"
                          : "#ffb74d",
                        marginBottom: "6px",
                      }}>
                        {note.status === "done" ? `완료: ${note.noteTitle}`
                          : note.status === "rendering" ? "렌더링 중..."
                          : note.status === "ready" ? `분석 완료: ${note.noteTitle}`
                          : note.status === "error" ? `오류: ${note.errorMessage || "알 수 없는 오류"}`
                          : note.status === "analyzing" ? "분석 중..."
                          : "대기"}
                      </div>

                      {/* 버튼 그룹 */}
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {/* 재분석 버튼 */}
                        {(note.status === "done" || note.status === "ready" || note.status === "error") && (
                          <button
                            onClick={() => {
                              setSets((prev) => prev.map((s) => s.id === set.id
                                ? { ...s, notes: s.notes.map((n) => n.id === note.id
                                    ? { ...n, status: "pending" as const, pngBase64: undefined, html: undefined, noteHtml: "", noteTitle: "", errorMessage: undefined }
                                    : n
                                  )}
                                : s
                              ));
                            }}
                            style={{
                              background: "rgba(124,77,255,0.7)",
                              border: "none",
                              borderRadius: "6px",
                              color: "#fff",
                              padding: "4px 12px",
                              fontSize: "11px",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            재분석
                          </button>
                        )}

                        {/* PNG 다운로드 */}
                        {note.status === "done" && note.pngBase64 && (
                          <button
                            onClick={() => {
                              const byteChars = atob(note.pngBase64!);
                              const byteArray = new Uint8Array(byteChars.length);
                              for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);
                              const blob = new Blob([byteArray], { type: "image/png" });
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement("a");
                              link.href = url;
                              link.download = `note_${note.noteTitle}.png`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              URL.revokeObjectURL(url);
                            }}
                            style={{
                              background: "rgba(102,187,106,0.7)",
                              border: "none",
                              borderRadius: "6px",
                              color: "#fff",
                              padding: "4px 12px",
                              fontSize: "11px",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            PNG 다운로드
                          </button>
                        )}

                        {/* 삭제 */}
                        <button
                          onClick={() => setSets((prev) => prev.map((s) => s.id === set.id ? { ...s, notes: s.notes.filter((n) => n.id !== note.id) } : s))}
                          style={{
                            background: "rgba(239,83,80,0.6)",
                            border: "none",
                            borderRadius: "6px",
                            color: "#fff",
                            padding: "4px 12px",
                            fontSize: "11px",
                            cursor: "pointer",
                            marginLeft: "auto",
                          }}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <DropZone
              onFilesSelected={(files) => handleNotesSelected(set.id, files)}
              disabled={phase === "rendering" || phase === "analyzing"}
              compact
              label="강의노트 이미지"
            />
          </div>
        </div>
      ))}

      {/* 세트 추가 / 단독 문제 업로드 */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
        <button
          onClick={addSet}
          disabled={phase === "rendering" || phase === "analyzing"}
          style={{
            flex: 1,
            padding: "16px",
            borderRadius: "12px",
            border: "2px dashed rgba(171,71,188,0.4)",
            background: "rgba(171,71,188,0.04)",
            color: "#ce93d8",
            fontSize: "15px",
            fontWeight: 600,
            cursor: phase === "rendering" || phase === "analyzing" ? "not-allowed" : "pointer",
            opacity: phase === "rendering" || phase === "analyzing" ? 0.5 : 1,
          }}
        >
          + 지문+문제 세트 추가
        </button>
      </div>

      {/* 단독 업로드 (항상 표시) */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "#42a5f5", marginBottom: "8px" }}>
            단독 문제 업로드
          </div>
          <DropZone
            onFilesSelected={handleStandaloneSelected}
            disabled={phase === "rendering" || phase === "analyzing"}
            compact={sets.length > 0}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "#ffb74d", marginBottom: "8px" }}>
            강의노트 업로드
          </div>
          <DropZone
            onFilesSelected={handleStandaloneNotes}
            disabled={phase === "rendering" || phase === "analyzing"}
            compact={sets.length > 0}
            label="강의노트 이미지"
          />
        </div>
      </div>

      {/* 분석 진행률 */}
      {phase === "analyzing" && (
        <div style={{ marginBottom: "24px" }}>
          <ProgressBar
            current={analyzeProgress}
            total={totalAnalyze}
            label="Gemini로 지문/문제 분석 중..."
          />
        </div>
      )}

      {/* 렌더링 진행률 */}
      {phase === "rendering" && (
        <div style={{ marginBottom: "24px" }}>
          <ProgressBar
            current={renderProgress}
            total={allProblems.filter((p) => p.status === "rendering" || p.status === "done").length}
            label="Playwright로 투명 PNG 렌더링 중..."
          />
        </div>
      )}

      {/* 액션 버튼들 */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginTop: "24px",
          flexWrap: "wrap",
        }}
      >
        {pendingCount > 0 && phase !== "analyzing" && phase !== "rendering" && (
          <button
            onClick={handleStartAnalyze}
            style={{
              padding: "12px 28px",
              borderRadius: "10px",
              border: "none",
              background: "linear-gradient(135deg, #42a5f5, #1565c0)",
              color: "#fff",
              fontSize: "16px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(66,165,245,0.3)",
            }}
          >
            분석 시작 ({pendingCount}개)
          </button>
        )}

        {(phase === "preview" || phase === "done") && readyCount > 0 && (
          <button
            onClick={handleRender}
            style={{
              padding: "12px 28px",
              borderRadius: "10px",
              border: "none",
              background: "linear-gradient(135deg, #f9a825, #e65100)",
              color: "#fff",
              fontSize: "16px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(249,168,37,0.3)",
            }}
          >
            투명 PNG로 변환 ({readyCount}개)
          </button>
        )}

        {phase === "done" && doneCount > 0 && (
          <button
            onClick={handleDownloadAll}
            style={{
              padding: "12px 28px",
              borderRadius: "10px",
              border: "none",
              background: "linear-gradient(135deg, #66bb6a, #388e3c)",
              color: "#fff",
              fontSize: "16px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(102,187,106,0.3)",
            }}
          >
            {doneCount === 1
              ? "PNG 다운로드"
              : `전체 다운로드 (ZIP, ${doneCount}개)`}
          </button>
        )}

        {phase === "done" && doneCount > 0 && doneCount > savedIds.size && (
          <button
            onClick={() => setSaveModalTarget("all")}
            style={{
              padding: "12px 28px",
              borderRadius: "10px",
              border: "none",
              background: "linear-gradient(135deg, #f9a825, #ff8f00)",
              color: "#fff",
              fontSize: "16px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(249,168,37,0.3)",
            }}
          >
            전체 라이브러리 저장 ({doneCount - savedIds.size}개)
          </button>
        )}

        {(phase === "preview" || phase === "done") && (
          <button
            onClick={handleReset}
            style={{
              padding: "12px 28px",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.2)",
              background: "transparent",
              color: "rgba(255,255,255,0.7)",
              fontSize: "16px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            새로 시작
          </button>
        )}

        {errorCount > 0 && phase === "preview" && (
          <p style={{ fontSize: "13px", color: "rgba(239,83,80,0.8)", alignSelf: "center" }}>
            {errorCount}개 문제에서 오류가 발생했습니다.
          </p>
        )}
      </div>

      {/* 하단 안내 */}
      <footer
        style={{
          marginTop: "60px",
          paddingTop: "24px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          fontSize: "13px",
          color: "rgba(255,255,255,0.3)",
        }}
      >
        <p>Korean Broadcast Generator — 국어/EBS 문제 분석</p>
        <p style={{ marginTop: "4px" }}>
          세트 업로드 (지문+문제) | 투명 배경 PNG | 병렬 처리
        </p>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {saveModalTarget && (
        <SaveModal
          autoTags={
            saveModalTarget === "all"
              ? generateAutoTags(allProblems.find((p) => p.status === "done")!)
              : generateAutoTags(allProblems.find((p) => p.id === saveModalTarget)!)
          }
          onSave={handleSaveToLibrary}
          onClose={() => setSaveModalTarget(null)}
          saving={savingToLibrary}
        />
      )}
    </div>
  );
}

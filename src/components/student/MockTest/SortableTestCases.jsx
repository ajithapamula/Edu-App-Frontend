// src/components/student/MockTest/SortableTestCases.jsx
// ═══════════════════════════════════════════════════════════════════
// Drag-and-drop sortable test cases panel
// Uses @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities
// Import this into CodeEditor.jsx
// ═══════════════════════════════════════════════════════════════════

import React from "react";
import { Box, Typography } from "@mui/material";
import { Check as CheckIcon, Close as CloseIcon } from "@mui/icons-material";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ═══════════════════════════════════════════════════════════════════
// SINGLE SORTABLE TEST CASE ROW
// ═══════════════════════════════════════════════════════════════════

const SortableTestCase = ({ tc, i, T, isDark, parseErrorSummary }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tc.id ?? i });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
    zIndex: isDragging ? 999 : "auto",
    cursor: isDragging ? "grabbing" : "grab",
  };

  const errorInfo = !tc.passed
    ? parseErrorSummary(
        tc.error,
        tc.isCompileError,
        tc.isRuntimeError,
        tc.isTimeout,
      )
    : null;

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      sx={{
        p: "10px 14px",
        borderRadius: "8px",
        fontSize: 13,
        bgcolor: tc.passed ? T.bgSuccess : T.bgError,
        border: `1px solid ${tc.passed ? T.bgSuccessBd : T.bgErrorBd}`,
        transition: "box-shadow 0.2s ease, opacity 0.2s ease",
        userSelect: "none",
        boxShadow: isDragging
          ? "0 8px 24px rgba(0,0,0,0.25)"
          : "none",
        "&:hover": {
          boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
        },
      }}
    >
      {/* ── Drag handle hint bar ── */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mb: 0.8,
          opacity: 0.3,
          "&:hover": { opacity: 0.7 },
          transition: "opacity 0.2s",
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 3,
            borderRadius: 2,
            bgcolor: tc.passed ? T.green : T.red,
          }}
        />
      </Box>

      {/* ── Top row: icon + label + time + pass/fail badge ── */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: "7px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            bgcolor: tc.passed ? T.greenDark : T.redDark,
            color: tc.passed ? T.green : T.red,
          }}
        >
          {tc.passed ? (
            <CheckIcon sx={{ fontSize: 15 }} />
          ) : (
            <CloseIcon sx={{ fontSize: 15 }} />
          )}
        </Box>

        <Typography
          sx={{ color: T.text, flex: 1, fontSize: 13, fontWeight: 500 }}
        >
          {tc.label || `Test ${i + 1}`}
        </Typography>

        {tc.executionTime && (
          <Typography
            sx={{
              fontSize: 11,
              color: T.textMuted,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {tc.executionTime}
          </Typography>
        )}

        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 700,
            px: 1,
            py: 0.3,
            borderRadius: "5px",
            textTransform: "uppercase",
            flexShrink: 0,
            bgcolor: tc.passed ? T.greenDark : T.redDark,
            color: tc.passed ? T.green : T.red,
          }}
        >
          {tc.passed ? "pass" : "fail"}
        </Typography>
      </Box>

      {/* ── Input / Expected / Actual rows ── */}
      <Box
        sx={{
          mt: 1.2,
          ml: "42px",
          display: "flex",
          flexDirection: "column",
          gap: 0.8,
        }}
      >
        {/* Input */}
        {tc.input && tc.input !== "[Hidden]" && (
          <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 700,
                color: T.textMuted,
                minWidth: 60,
                flexShrink: 0,
                pt: "1px",
                textTransform: "uppercase",
                letterSpacing: 0.4,
              }}
            >
              Input
            </Typography>
            <Typography
              sx={{
                fontSize: 12,
                color: T.textLabel,
                fontFamily: "'JetBrains Mono', monospace",
                bgcolor: isDark
                  ? "rgba(255,255,255,0.04)"
                  : "rgba(0,0,0,0.03)",
                px: 1,
                py: 0.3,
                borderRadius: "4px",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                maxHeight: 60,
                overflow: "auto",
                flex: 1,
              }}
            >
              {tc.input.length > 100
                ? tc.input.substring(0, 100) + "..."
                : tc.input}
            </Typography>
          </Box>
        )}

        {/* Expected */}
        {tc.expected && tc.expected !== "[Hidden]" && (
          <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 700,
                color: T.textMuted,
                minWidth: 60,
                flexShrink: 0,
                pt: "1px",
                textTransform: "uppercase",
                letterSpacing: 0.4,
              }}
            >
              Expected
            </Typography>
            <Typography
              sx={{
                fontSize: 12,
                color: tc.passed ? T.green : T.textLabel,
                fontFamily: "'JetBrains Mono', monospace",
                bgcolor: isDark
                  ? "rgba(255,255,255,0.04)"
                  : "rgba(0,0,0,0.03)",
                px: 1,
                py: 0.3,
                borderRadius: "4px",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                flex: 1,
              }}
            >
              {tc.expected.length > 100
                ? tc.expected.substring(0, 100) + "..."
                : tc.expected}
            </Typography>
          </Box>
        )}

        {/* Actual Output */}
        {tc.actualOutput != null && tc.actualOutput !== "[Hidden]" && (
          <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 700,
                color: tc.passed ? T.green : T.red,
                minWidth: 60,
                flexShrink: 0,
                pt: "1px",
                textTransform: "uppercase",
                letterSpacing: 0.4,
              }}
            >
              Output
            </Typography>
            <Typography
              sx={{
                fontSize: 12,
                color: tc.passed ? T.green : T.red,
                fontFamily: "'JetBrains Mono', monospace",
                bgcolor: tc.passed
                  ? isDark
                    ? "rgba(52,211,153,0.06)"
                    : "rgba(22,163,74,0.05)"
                  : isDark
                    ? "rgba(248,113,113,0.06)"
                    : "rgba(220,38,38,0.05)",
                px: 1,
                py: 0.3,
                borderRadius: "4px",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                maxHeight: 60,
                overflow: "auto",
                flex: 1,
                border: `1px solid ${
                  tc.passed
                    ? isDark
                      ? "rgba(52,211,153,0.12)"
                      : "rgba(22,163,74,0.12)"
                    : isDark
                      ? "rgba(248,113,113,0.12)"
                      : "rgba(220,38,38,0.12)"
                }`,
              }}
            >
              {tc.actualOutput
                ? tc.actualOutput.length > 100
                  ? tc.actualOutput.substring(0, 100) + "..."
                  : tc.actualOutput
                : "(no output)"}
            </Typography>
          </Box>
        )}
      </Box>

      {/* ── Error summary ── */}
      {!tc.passed && errorInfo && (
        <Box
          sx={{
            mt: 1,
            ml: "42px",
            p: "8px 12px",
            borderRadius: "6px",
            bgcolor: tc.isCompileError
              ? T.redSoft
              : tc.isTimeout
                ? T.yellowSoft
                : T.peachSoft,
            border: `1px solid ${
              tc.isCompileError
                ? T.bgErrorBd
                : tc.isTimeout
                  ? T.bgWarningBd
                  : "rgba(251,146,60,0.2)"
            }`,
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 700,
              px: 0.8,
              py: 0.2,
              borderRadius: "4px",
              bgcolor: tc.isTimeout ? T.yellow : T.red,
              color: "#fff",
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: 0.3,
              flexShrink: 0,
            }}
          >
            {errorInfo.type}
          </Typography>

          {errorInfo.line && (
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 600,
                px: 0.8,
                py: 0.2,
                borderRadius: "4px",
                bgcolor: isDark
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(0,0,0,0.05)",
                color: T.textLabel,
                fontFamily: "'JetBrains Mono', monospace",
                flexShrink: 0,
              }}
            >
              Line {errorInfo.line}
            </Typography>
          )}

          <Typography
            sx={{
              fontSize: 12,
              color: T.textLabel,
              fontFamily: "'JetBrains Mono', monospace",
              lineHeight: 1.4,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
              minWidth: 0,
            }}
          >
            {errorInfo.message}
          </Typography>
        </Box>
      )}

      {/* ── Wrong answer hint ── */}
      {!tc.passed &&
        !errorInfo &&
        !tc.isCompileError &&
        !tc.isRuntimeError &&
        !tc.isTimeout && (
          <Box
            sx={{
              mt: 1,
              ml: "42px",
              p: "8px 12px",
              borderRadius: "6px",
              bgcolor: T.peachSoft,
              border: "1px solid rgba(251,146,60,0.2)",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 700,
                px: 0.8,
                py: 0.2,
                borderRadius: "4px",
                bgcolor: T.peach,
                color: "#fff",
                fontFamily: "'JetBrains Mono', monospace",
                flexShrink: 0,
              }}
            >
              Wrong Answer
            </Typography>
            <Typography
              sx={{
                fontSize: 12,
                color: T.textLabel,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Output doesn't match expected result
            </Typography>
          </Box>
        )}
    </Box>
  );
};

// ═══════════════════════════════════════════════════════════════════
// MAIN EXPORT — SortableTestCaseList
// ═══════════════════════════════════════════════════════════════════

const SortableTestCaseList = ({
  orderedResults,
  setOrderedResults,
  T,
  isDark,
  parseErrorSummary,
}) => {
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = ({ active, over }) => {
    if (active.id !== over?.id) {
      setOrderedResults((prev) => {
        const oldIndex = prev.findIndex((r) => r.id === active.id);
        const newIndex = prev.findIndex((r) => r.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={orderedResults.map((r) => r.id)}
        strategy={verticalListSortingStrategy}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {orderedResults.map((tc, i) => (
            <SortableTestCase
              key={tc.id ?? i}
              tc={tc}
              i={i}
              T={T}
              isDark={isDark}
              parseErrorSummary={parseErrorSummary}
            />
          ))}
        </Box>
      </SortableContext>
    </DndContext>
  );
};

export default SortableTestCaseList;
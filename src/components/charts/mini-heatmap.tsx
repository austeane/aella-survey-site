import { useEffect, useRef } from "react";

import { CHART_COLORS } from "./chart-config";

export interface MiniHeatmapCell {
  xIndex: number;
  yIndex: number;
  value: number;
}

interface MiniHeatmapProps {
  xLabels: string[];
  yLabels: string[];
  cells: MiniHeatmapCell[];
  width?: number;
  height?: number;
}

export function MiniHeatmap({ xLabels, yLabels, cells, width = 160, height = 110 }: MiniHeatmapProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const cols = Math.max(1, xLabels.length);
    const rows = Math.max(1, yLabels.length);

    const labelFont = "9px 'JetBrains Mono', ui-monospace";
    ctx.font = labelFont;

    const maxYLabelWidth = Math.max(
      20,
      ...yLabels.map((l) => ctx.measureText(l.length > 12 ? `${l.slice(0, 11)}…` : l).width),
    );
    const leftPad = Math.min(Math.ceil(maxYLabelWidth) + 4, Math.floor(width * 0.4));
    const bottomPad = 18;
    const usableW = width - leftPad - 2;
    const usableH = height - bottomPad - 2;
    const cellW = usableW / cols;
    const cellH = usableH / rows;

    const max = Math.max(0.00001, ...cells.map((cell) => cell.value));

    for (const cell of cells) {
      const alpha = Math.max(0.08, Math.min(0.9, cell.value / max));
      const x = leftPad + cell.xIndex * cellW;
      const y = cell.yIndex * cellH;

      ctx.fillStyle = CHART_COLORS.accent;
      ctx.globalAlpha = alpha;
      ctx.fillRect(x, y, Math.max(1, cellW - 1), Math.max(1, cellH - 1));
    }

    ctx.globalAlpha = 1;
    ctx.strokeStyle = CHART_COLORS.ruleLight;
    ctx.lineWidth = 1;

    for (let i = 0; i <= cols; i += 1) {
      const x = leftPad + i * cellW;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, usableH);
      ctx.stroke();
    }

    for (let i = 0; i <= rows; i += 1) {
      const y = i * cellH;
      ctx.beginPath();
      ctx.moveTo(leftPad, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.fillStyle = CHART_COLORS.inkFaded;
    ctx.font = labelFont;

    const maxYChars = Math.max(4, Math.floor((leftPad - 4) / 5.4));
    yLabels.slice(0, rows).forEach((label, index) => {
      const text = label.length > maxYChars ? `${label.slice(0, maxYChars - 1)}…` : label;
      ctx.fillText(text, 2, index * cellH + Math.min(cellH - 2, 10));
    });

    const maxXChars = Math.max(3, Math.floor(cellW / 5.4));
    xLabels.slice(0, cols).forEach((label, index) => {
      const text = label.length > maxXChars ? `${label.slice(0, maxXChars - 1)}…` : label;
      ctx.fillText(text, leftPad + index * cellW + 1, usableH + 10);
    });
  }, [cells, height, width, xLabels, yLabels]);

  return <canvas ref={canvasRef} className="block border border-[var(--rule-light)] bg-[var(--paper)]" />;
}

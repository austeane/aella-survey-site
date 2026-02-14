import findingsRaw from "../../analysis/findings.json";

export type ChartType = "bar" | "grouped-bar" | "line";

export interface ChartPreset {
  id: string;
  title: string;
  shortTitle: string;
  question: string;
  chartType: ChartType;
  sql: string;
  xLabel: string;
  yLabel: string;
  caption: string;
  /** Column names for linking to /explore */
  exploreX: string;
  exploreY: string;
  /** For grouped-bar: the grouping key */
  seriesKey?: string;
  /** For grouped-bar: series labels and colors */
  series?: Array<{ key: string; label: string; color: string }>;
  wave2?: {
    evidenceTier: "robust" | "supported" | "tiny" | "exploratory";
    effectSizeNote: string;
    riskFlags: string[];
    riskNotes: string[];
    recommendedForHome: boolean;
    curationNotes: string;
  };
}

export interface FindingsQuestionCard {
  prompt: string;
  presetId?: string;
  deepLink?: string;
}

interface FindingsPayload {
  featuredPresets: Array<{
    id: string;
    title: string;
    shortTitle: string;
    question: string;
    chartType: string;
    sql: string;
    xLabel: string;
    yLabel: string;
    caption: string;
    exploreX: string;
    exploreY: string;
    series?: Array<{ key: string; label: string; color: string }>;
    wave2?: ChartPreset["wave2"];
  }>;
  questionCards: FindingsQuestionCard[];
  defaultsByPage: {
    home?: { presetId?: string; fallbackPresetIds?: string[] };
    explore?: { x?: string; y?: string; normalization?: string; topN?: number };
    relationships?: { column?: string };
    profile?: {
      suggestedCohorts?: Array<{
        label: string;
        filters: Array<{ column: string; value: string }>;
      }>;
    };
    columns?: { sort?: string; interestingColumns?: string[] };
  };
  termMappings: Array<{ technical: string; plainLanguage: string }>;
}

function isChartType(value: string): value is ChartType {
  return value === "bar" || value === "grouped-bar" || value === "line";
}

export const FINDINGS_PAYLOAD = findingsRaw as FindingsPayload;

export const CHART_PRESETS: ChartPreset[] = FINDINGS_PAYLOAD.featuredPresets
  .filter((preset) => isChartType(preset.chartType))
  .map((preset) => ({
    id: preset.id,
    title: preset.title,
    shortTitle: preset.shortTitle,
    question: preset.question,
    chartType: preset.chartType as ChartType,
    sql: preset.sql,
    xLabel: preset.xLabel,
    yLabel: preset.yLabel,
    caption: preset.caption,
    exploreX: preset.exploreX,
    exploreY: preset.exploreY,
    seriesKey: preset.chartType === "grouped-bar" ? "group_key" : undefined,
    series: preset.chartType === "grouped-bar" ? preset.series : undefined,
    wave2: preset.wave2,
  }));

export const QUESTION_CARDS = FINDINGS_PAYLOAD.questionCards;
export const DEFAULTS_BY_PAGE = FINDINGS_PAYLOAD.defaultsByPage;
export const TERM_MAPPINGS = FINDINGS_PAYLOAD.termMappings;

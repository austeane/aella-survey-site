import referenceEffects from "./reference-effects.json";

interface ReferenceEffect {
  id: string;
  title: string;
  metric: "d" | "r";
  effect: number;
  percentilePointGap: number;
  note?: string;
}

interface ReferenceEffectsPayload {
  generatedAt: string;
  landmarks: ReferenceEffect[];
}

const payload = referenceEffects as ReferenceEffectsPayload;

export function getReferenceEffects(): ReferenceEffect[] {
  return payload.landmarks;
}

function nearestLandmark(absDelta: number): ReferenceEffect | null {
  if (payload.landmarks.length === 0 || !Number.isFinite(absDelta)) {
    return null;
  }

  let best: ReferenceEffect | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const landmark of payload.landmarks) {
    const distance = Math.abs(landmark.percentilePointGap - absDelta);
    if (distance < bestDistance) {
      best = landmark;
      bestDistance = distance;
    }
  }

  return best;
}

export function contextualizeDifference(args: {
  traitLabel: string;
  absDelta: number;
  groupALabel: string;
  groupBLabel: string;
}): string {
  const { traitLabel, absDelta, groupALabel, groupBLabel } = args;

  if (!Number.isFinite(absDelta)) {
    return "The groups look similar on this trait once uncertainty is considered.";
  }

  const rounded = Math.round(absDelta * 10) / 10;
  const landmark = nearestLandmark(absDelta);

  if (!landmark) {
    return `The biggest difference is ${traitLabel} (${rounded} percentile-point gap between ${groupALabel} and ${groupBLabel}).`;
  }

  return `The biggest difference is ${traitLabel} (${rounded} percentile-point gap). For reference, ${landmark.title} is about ${landmark.percentilePointGap} points (${landmark.note ?? "notable"}).`;
}

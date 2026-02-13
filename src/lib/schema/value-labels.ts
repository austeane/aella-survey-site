type ValueLabels = Record<string, string>;

const AROUSAL_SCALE_0_TO_5: ValueLabels = {
  "0": "Not arousing",
  "1": "Slightly arousing",
  "2": "Somewhat arousing",
  "3": "Moderately arousing",
  "4": "Very arousing",
  "5": "Extremely arousing",
};

const VANILLA_AROUSAL_NEGATED: ValueLabels = {
  "0": "Not arousing",
  "-1": "Slightly arousing",
  "-2": "Somewhat arousing",
  "-3": "Moderately arousing",
  "-5": "Very arousing",
  "-8": "Extremely arousing",
};

const AGREEMENT_SCALE: ValueLabels = {
  "3": "Totally agree",
  "2": "Agree",
  "1": "Somewhat agree",
  "0": "Neutral",
  "-1": "Somewhat disagree",
  "-2": "Disagree",
  "-3": "Totally disagree",
};

const VANILLA_COLUMNS = new Set<string>([
  "normalsex",
  "cunnilingus",
  '"I find blowjobs:" (yuc275j)',
  '"I find cunnilingus:" (jn2b355)',
  '"I find dirtytalking erotic" (947wne3)',
]);

const AGREEMENT_COLUMNS = new Set<string>(["supernatural"]);

const AROUSAL_COLUMNS = new Set<string>([
  "abnormalbody",
  "appearance",
  "bestiality",
  "brutality",
  "cgl",
  "clothing",
  "creepy",
  "dirty",
  "eagerness",
  "exhibitionother",
  "exhibitionself",
  "extremebondage",
  "frustration",
  "fulltimepower",
  "futa",
  "genderplay",
  "gentleness",
  "givepain",
  "gratification",
  "humiliation",
  "incest",
  "lightbondage",
  "masterslave",
  "mediumbondage",
  "mentalalteration",
  "mindbreak",
  "multiplepartners",
  "mythical",
  "nonconsent",
  "obedience",
  "objects",
  "oralsexanimal",
  "oralsexanimal2",
  "penetration",
  "penetration2",
  "powerdynamic",
  "pregnancy",
  "progression",
  "receivepain",
  "regression",
  "roles",
  "sadomasochism",
  "secretions",
  "sensory",
  "spanking",
  "teasing",
  "toys",
  "transform",
  "vore",
  "voyeurother",
  "voyeurself",
  "worshipped",
  "worshipping",
  '"I find scenarios where I eagerly beg others to be:" (jvrbyep)',
  '"I find scenarios where others eagerly beg me to be:" (stmm5eg)',
]);

const CUSTOM_VALUE_LABELS: Record<string, ValueLabels> = {
  animated: {
    "-2": "Entirely live action",
    "-1": "Mostly live action",
    "0": "Both equally",
    "1": "Mostly animated",
    "2": "Entirely animated",
  },
  written: {
    "-2": "Entirely visual",
    "-1": "Mostly visual",
    "0": "Both equally",
    "1": "Mostly written",
    "2": "Entirely written",
  },
  violentporn: {
    "0": "None",
    "1": "A little",
    "2": "Moderate",
    "3": "Most",
    "4": "All",
  },
  inducefetish: {
    "0": "No",
    "1": "Variations only",
    "2": "New but similar",
    "3": "New and different",
  },
  allrollidentity: {
    "-2": "Totally one role",
    "-1": "Somewhat one role",
    "1": "Somewhat all roles",
    "2": "Totally all roles",
  },
  highenergy: {
    "-3": "Totally gentle",
    "-2": "Mostly gentle",
    "-1": "Somewhat gentle",
    "0": "Equal",
    "1": "Somewhat intense",
    "2": "Mostly intense",
    "3": "Totally intense",
  },
};

export function getValueLabels(columnName: string): ValueLabels | null {
  if (VANILLA_COLUMNS.has(columnName)) {
    return VANILLA_AROUSAL_NEGATED;
  }

  if (AGREEMENT_COLUMNS.has(columnName)) {
    return AGREEMENT_SCALE;
  }

  if (AROUSAL_COLUMNS.has(columnName)) {
    return AROUSAL_SCALE_0_TO_5;
  }

  return CUSTOM_VALUE_LABELS[columnName] ?? null;
}

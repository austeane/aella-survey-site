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

const AGREEMENT_COLUMNS = new Set<string>([
  "supernatural",
  '"To what extent do you agree with this statement: I am a narcissist. (1bqtk47)',
  '"I am aroused by being submissive in sexual interactions" (xem7hbu)',
  '"I find age-related things (beyond "normal" stuff like being attracted to people your own age) to be:" (92qqx0)',
  '"I find it erotic when two people of the opposite gender to me sexually interact with each other" (fbqcymm)',
  '"I find the thought of existing (in *nonsexual* situations) as a biological *female* to be erotic" (6w84yry)',
  '"I find the thought of existing (in *nonsexual* situations) as a biological *male* to be erotic" (l7vpprx)',
  '"I find the thought of masturbating alone as a biological female, to be erotic" (sgdpy8l)',
  '"I find the thought of masturbating alone as a biological male, to be erotic" (guwym9g)',
  '"I sometimes find people who have clearly reached sexual maturity, but are not yet adults (e.g., ages 13-17), to be sexually attractive" (kbpolw9)',
]);

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
  "agegap",
  "genderswapped",
]);

const CUSTOM_VALUE_LABELS: Record<string, ValueLabels> = {
  biomale: {
    "0": "Female",
    "1": "Male",
  },
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

// Ordinal value orders: arrays define the correct sort order for non-numeric categorical columns.
// Values not listed will appear at the end, sorted alphabetically.
const VALUE_ORDERS: Record<string, string[]> = {
  age: ["14-17", "18-20", "21-24", "25-28", "29-32"],
  sexcount: ["0", "1-2", "3-7", "8-20", "21+"],
  politics: ["Liberal", "Moderate", "Conservative"],
  childhood_gender_tolerance: ["Intolerant", "Medium", "Tolerant"],
  'At what age did you first begin (at least semiregularly) masturbating?': [
    "7 or younger", "8-9", "10-11", "12-13", "14-15", "16-17", "18+", "Never",
  ],
  'At what age did you begin watching porn or reading erotic content at least semiregularly? (ugf1hyy)': [
    ">6yo", "7-8yo", "9-10yo", "11-12yo", "13-14yo", "15-16yo", "17-18yo", "19-25yo", "26yo+",
  ],
  'From the ages of 0-14, how often were you spanked as a form of discipline? (p957nyk)': [
    "Never", "Sometimes", "Often",
  ],
  'How "sexually liberated" was your upbringing? (fs700v2)': [
    "Repressed", "Neutral", "Liberated",
  ],
  'How horny are you right now? (1jtj2nx)': [
    "Not horny at all", "A little horny", "Moderately horny", "Real horny",
  ],
  'How horny have you been in the last 24 hours? (2hyrmvh)': [
    "Not horny at all", "A little horny", "Moderately horny", "Real horny",
  ],
  'Compared to other people of your same gender and age range, you are (yh6d44s)': [
    "Significantly less attractive", "Moderately less attractive", "Slightly less attractive",
    "About average attractiveness",
    "Slightly more attractive", "Moderately more attractive", "Significantly more attractive",
  ],
  'Your sexual interests feel (44qhm16)': [
    "Very narrow", "Somewhat narrow", "A little narrow",
    "Equally narrow and broad",
    "A little broad", "Somewhat broad", "Very broad",
  ],
  '"In general, on average, the optimal amount of consent in my preferred erotic scenarios is:" (b0ukpvo)': [
    "Full nonconsent", "Mostly nonconsenting, slightly consenting",
    "Equally consenting and nonconsenting",
    "Mostly consenting, slightly nonconsenting", "Full, enthusiastic consent",
  ],
  '"In general, I prefer scenarios where receiver of the pain is:" (8r5zld8)': [
    "Very upset/doesn't want it", "Moderately upset/doesn't want it", "Slightly upset/doesn't want it",
    "Slightly eager/wants it", "Moderately eager/wants it", "Very eager/wants it",
  ],
  '"In general, I prefer scenarios where the intensity of the pain is:" (m73c3q1)': [
    "Very mild", "Moderately mild", "Slightly mild",
    "Equally mild and severe",
    "Slightly severe", "Moderately severe", "Very severe",
  ],
  '"In general, casual sexual hookups have been a ___ experience for me" (ytp3gfm)': [
    "Really bad", "Kinda bad", "Neutral", "Kinda good", "Really good", "I haven't hooked up",
  ],
  '"I usually don\'t leave romantic relationships unless there\'s a very serious violation" (b7gzhvz)': [
    "Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree",
    "I haven't had a relationship end",
  ],
  'Have you ever had a sexual experience with someone else who did not want the experience? (2zafc2j)': [
    "No", "Yes, slightly", "Yes, significantly", "Yes, extremely",
  ],
  'Do you get mood-based PMS symptoms during your menstrual cycle?': [
    "No", "Yes, maybe/slightly", "Yes, moderately", "Yes, severely",
    "I don't menstruate/I don't know",
  ],
  'Are you currently experiencing PMS symptoms? (g953661)': [
    "No", "Uncertain", "Yes",
  ],
};

/**
 * Sort dropdown values by their ordinal order if one is defined for the column.
 * Values not in the order map are appended at the end, sorted alphabetically.
 */
export function sortByOrdinalOrder(columnName: string, values: string[]): string[] {
  const order = VALUE_ORDERS[columnName];
  if (!order) return values;

  const orderIndex = new Map(order.map((v, i) => [v, i]));
  return [...values].sort((a, b) => {
    const ai = orderIndex.get(a);
    const bi = orderIndex.get(b);
    if (ai != null && bi != null) return ai - bi;
    if (ai != null) return -1;
    if (bi != null) return 1;
    return a.localeCompare(b);
  });
}

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

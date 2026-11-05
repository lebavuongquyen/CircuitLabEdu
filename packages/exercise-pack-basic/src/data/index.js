import { primaryLessons as allPrimary } from "./lessons-primary.js";
import { middleLessons as allMiddle } from "./lessons-middle.js";
import { highLessons as allHigh } from "./lessons-high.js";

// Original 20 lessons in original order for perfect backward compatibility
const originalIds = [
  "closed-loop",
  "series-vs-parallel",
  "ohms-law",
  "primary-open-switch",
  "primary-conductors",
  "primary-parallel",
  "middle-series-resistors",
  "middle-parallel-resistors",
  "middle-series-switches",
  "middle-parallel-switches",
  "middle-mixed-network",
  "middle-voltage-divider",
  "high-meter",
  "high-rc",
  "high-rl",
  "high-rlc",
  "high-ac-resistor",
  "high-ac-rc",
  "high-parallel-branch",
  "high-power"
];

const allLessonsMap = new Map();
for (const lesson of [...allPrimary, ...allMiddle, ...allHigh]) {
  allLessonsMap.set(lesson.id, lesson);
}

const originalLessons = originalIds.map(id => allLessonsMap.get(id));
const additionalLessons = [
  ...allPrimary.filter(l => !originalIds.includes(l.id)),
  ...allMiddle.filter(l => !originalIds.includes(l.id)),
  ...allHigh.filter(l => !originalIds.includes(l.id))
];

export const lessons = [...originalLessons, ...additionalLessons];
export const primaryLessons = lessons.filter(l => l.level === "primary");
export const middleLessons = lessons.filter(l => l.level === "middle");
export const highLessons = lessons.filter(l => l.level === "high");

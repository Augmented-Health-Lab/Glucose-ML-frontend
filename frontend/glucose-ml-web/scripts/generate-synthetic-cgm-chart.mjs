import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(
  scriptDirectory,
  "../public/static_data/background_cgm_chart.json"
);

const profiles = [
  { key: "t1d", baseline: 150, meals: [88, 112, 96], variation: 24 },
  { key: "t2d", baseline: 132, meals: [66, 86, 74], variation: 16 },
  { key: "pred", baseline: 108, meals: [44, 52, 46], variation: 10 },
  { key: "nd", baseline: 92, meals: [28, 34, 30], variation: 7 },
];

const gaussian = (hour, center, width) =>
  Math.exp(-((hour - center) ** 2) / (2 * width ** 2));

const clamp = (value, minimum, maximum) =>
  Math.min(maximum, Math.max(minimum, value));

const series = profiles.map((profile, profileIndex) => ({
  key: profile.key,
  points: Array.from({ length: 96 }, (_, index) => {
    const hour = index / 4;
    const circadian =
      profile.variation * Math.sin(((hour - 4) / 24) * Math.PI * 2);
    const meals = [8, 13, 19].reduce(
      (total, center, mealIndex) =>
        total + profile.meals[mealIndex] * gaussian(hour, center, 1.15),
      0
    );
    const texture =
      Math.sin(hour * (1.7 + profileIndex * 0.13)) *
      (5 + profileIndex * 1.5);
    const glucose = clamp(
      Math.round((profile.baseline + circadian + meals + texture) * 10) / 10,
      45,
      360
    );

    return { hour, glucose };
  }),
}));

const payload = {
  synthetic: true,
  description:
    "Deterministic synthetic examples created for interface illustration; these points do not represent study participants.",
  series,
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

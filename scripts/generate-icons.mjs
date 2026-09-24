import { readFile, writeFile } from "node:fs/promises";
import { Resvg } from "@resvg/resvg-js";
const source = await readFile(
  new URL("../public/app-icon.svg", import.meta.url),
  "utf8",
);
// Full-bleed backgrounds let the OS supply its own squircle/circle mask. All
// meaningful artwork stays within the central 80% maskable safe circle.
for (const [name, width] of [
  ["icon-v2-192.png", 192],
  ["icon-v2-512.png", 512],
  ["icon-v2-maskable.png", 512],
  ["apple-touch-icon-v2.png", 180],
]) {
  const png = new Resvg(source, { fitTo: { mode: "width", value: width } })
    .render()
    .asPng();
  await writeFile(new URL(`../public/${name}`, import.meta.url), png);
}
const favicon = source.replace('id="background"', 'id="background" rx="112"');
await writeFile(new URL("../public/favicon.svg", import.meta.url), favicon);
console.log(
  "Generated the favicon, Apple touch icon, and regular/maskable PWA icons.",
);

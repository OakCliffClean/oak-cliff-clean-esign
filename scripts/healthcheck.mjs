// scripts/healthcheck.mjs
import fs from "fs";
import path from "path";

const mustExist = (p) => {
  if (!fs.existsSync(p)) throw new Error(`Missing file: ${p}`);
  return p;
};
const read = (p) => fs.readFileSync(p, "utf8");

// 1) package.json must be valid JSON
const pkgPath = mustExist(path.join(process.cwd(), "package.json"));
let pkg;
try {
  pkg = JSON.parse(read(pkgPath));
  console.log("✓ package.json is valid JSON");
} catch (e) {
  console.error("✗ package.json invalid JSON. Open Raw view and remove ANY backticks or comments.");
  process.exit(1);
}

// 2) Tailwind wiring (if you’re using Tailwind UI classes in JSX)
const tailwindFiles = [
  "postcss.config.js",
  "tailwind.config.js",
  "pages/_app.js",
  "styles/globals.css",
];
for (const f of tailwindFiles) {
  const p = path.join(process.cwd(), f);
  if (!fs.existsSync(p)) console.warn(`! Consider adding: ${f}`);
  else console.log(`✓ Found ${f}`);
}

// 3) Core pages/components existence
const icFormPath = mustExist(path.join(process.cwd(), "components/ICForm.js"));
const indexPath  = mustExist(path.join(process.cwd(), "pages/index.js"));

// 4) ICForm basic sanity: default export name and no stray HTML after closing brace
const ic = read(icFormPath);
if (!/export\s+default\s+function\s+ICForm\s*\(/.test(ic)) {
  console.error("✗ ICForm.js must export default function ICForm()");
  process.exit(1);
}
const trimmed = ic.trimEnd();
if (!trimmed.endsWith("}")) {
  console.error("✗ ICForm.js should end with the component's closing '}' (nothing after it)");
  process.exit(1);
}
if (/^[ \t]*<\/div>/m.test(ic.split("\n").slice(0, 15).join("\n"))) {
  console.error("✗ Stray </div> near top of ICForm.js — remove anything outside return(...)");
  process.exit(1);
}
console.log("✓ ICForm export and file ending look good");

// 5) index imports component correctly
const idx = read(indexPath);
if (!/import\(.+['"]\.\.\/components\/ICForm['"]\)/.test(idx) && !/from ['"]\.\.\/components\/ICForm['"]/.test(idx)) {
  console.warn("! pages/index.js should import ../components/ICForm (dynamic or static)");
} else {
  console.log("✓ index imports ICForm");
}

// 6) Env var names used by frontend
if (/process\.env\.APP_BASE_URL/.test(ic)) {
  console.warn("! Use NEXT_PUBLIC_APP_BASE_URL (frontend), not APP_BASE_URL");
} else {
  console.log("✓ Frontend uses NEXT_PUBLIC_APP_BASE_URL or window.location.origin");
}

console.log("\nHealth check complete ✅");

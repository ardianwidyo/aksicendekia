import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const designMdPath = path.resolve(__dirname, '../../../design/DESIGN.md');
const outputCssPath = path.resolve(__dirname, '../src/tokens.css');
const outputJsonPath = path.resolve(__dirname, '../src/tokens.json');

function parseYamlFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]+?)\r?\n---/);
  if (!match) {
    throw new Error('No YAML frontmatter found in DESIGN.md');
  }

  const yamlText = match[1];
  const result = {};
  let currentKey = null;
  let currentSubKey = null;

  const lines = yamlText.split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;

    const indent = line.search(/\S/);
    if (indent === 0) {
      const colonIdx = line.indexOf(':');
      if (colonIdx !== -1) {
        currentKey = line.substring(0, colonIdx).trim();
        const val = line.substring(colonIdx + 1).trim();
        result[currentKey] = val ? val.replace(/^['"]|['"]$/g, '') : {};
        currentSubKey = null;
      }
    } else if (indent === 2 && currentKey && typeof result[currentKey] === 'object') {
      const colonIdx = line.indexOf(':');
      if (colonIdx !== -1) {
        const subKey = line.substring(0, colonIdx).trim();
        const val = line.substring(colonIdx + 1).trim();
        if (val) {
          result[currentKey][subKey] = val.replace(/^['"]|['"]$/g, '');
          currentSubKey = null;
        } else {
          result[currentKey][subKey] = {};
          currentSubKey = subKey;
        }
      }
    } else if (indent === 4 && currentKey && currentSubKey && typeof result[currentKey][currentSubKey] === 'object') {
      const colonIdx = line.indexOf(':');
      if (colonIdx !== -1) {
        const propKey = line.substring(0, colonIdx).trim();
        const val = line.substring(colonIdx + 1).trim();
        result[currentKey][currentSubKey][propKey] = val.replace(/^['"]|['"]$/g, '');
      }
    }
  }

  return result;
}

try {
  const mdContent = fs.readFileSync(designMdPath, 'utf8');
  const tokensData = parseYamlFrontmatter(mdContent);

  // Generate CSS Custom Properties
  let css = `/* AUTO-GENERATED FROM design/DESIGN.md BY generate-tokens.mjs - DO NOT EDIT DIRECTLY */\n\n:root {\n`;

  // Colors
  if (tokensData.colors) {
    css += `  /* Base M3 Colors */\n`;
    for (const [key, value] of Object.entries(tokensData.colors)) {
      css += `  --color-${key}: ${value};\n`;
    }
  }

  // Radius
  if (tokensData.rounded) {
    css += `\n  /* Border Radius */\n`;
    for (const [key, value] of Object.entries(tokensData.rounded)) {
      const varName = key === 'DEFAULT' ? 'default' : key;
      css += `  --radius-${varName}: ${value};\n`;
    }
  }

  // Spacing
  if (tokensData.spacing) {
    css += `\n  /* Spacing (8px system) */\n`;
    for (const [key, value] of Object.entries(tokensData.spacing)) {
      css += `  --spacing-${key}: ${value};\n`;
    }
  }

  // Default Fonts
  css += `\n  /* Default Typography */\n`;
  css += `  --font-heading: var(--font-quicksand), 'Quicksand', sans-serif;\n`;
  css += `  --font-body: var(--font-inter), 'Inter', sans-serif;\n`;
  css += `}\n\n`;

  // Grade-Level Overrides
  css += `/* Grade Level Themes (TK, SD, SMP, SMA) */\n\n`;

  // TK - Foundational (Soft Pastels, Low Anxiety)
  css += `[data-jenjang="tk"] {\n`;
  css += `  --color-background: #fff8fa;\n`;
  css += `  --color-surface: #ffffff;\n`;
  css += `  --color-surface-container: #fff0f5;\n`;
  css += `  --color-surface-container-high: #ffe4ee;\n`;
  css += `  --color-on-surface: #3b1e2b;\n`;
  css += `  --color-on-surface-variant: #6b4d5a;\n`;
  css += `  --color-primary: #ff7eac;\n`;
  css += `  --color-primary-container: #ffd0e0;\n`;
  css += `  --color-on-primary: #ffffff;\n`;
  css += `  --color-secondary: #ffb84d;\n`;
  css += `  --color-secondary-container: #ffe7c2;\n`;
  css += `  --color-on-secondary: #543600;\n`;
  css += `  --color-tertiary: #4edea3;\n`;
  css += `  --color-outline: #f3c2d4;\n`;
  css += `  --color-outline-variant: #fce1ec;\n`;
  css += `  --font-heading: var(--font-quicksand), 'Quicksand', sans-serif;\n`;
  css += `}\n\n`;

  // SD - Elementary (High-Saturation Primary)
  css += `[data-jenjang="sd"] {\n`;
  css += `  --color-background: #f8f9ff;\n`;
  css += `  --color-surface: #ffffff;\n`;
  css += `  --color-surface-container: #e5eeff;\n`;
  css += `  --color-surface-container-high: #dce9ff;\n`;
  css += `  --color-on-surface: #0b1c30;\n`;
  css += `  --color-on-surface-variant: #424754;\n`;
  css += `  --color-primary: #0058be;\n`;
  css += `  --color-primary-container: #2170e4;\n`;
  css += `  --color-on-primary: #ffffff;\n`;
  css += `  --color-secondary: #fea619;\n`;
  css += `  --color-secondary-container: #ffddb8;\n`;
  css += `  --color-on-secondary: #684000;\n`;
  css += `  --color-tertiary: #00855b;\n`;
  css += `  --color-outline: #727785;\n`;
  css += `  --color-outline-variant: #c2c6d6;\n`;
  css += `  --font-heading: var(--font-quicksand), 'Quicksand', sans-serif;\n`;
  css += `}\n\n`;

  // SMP - Junior High (Sophisticated Jewel Tones - Teal / Purple)
  css += `[data-jenjang="smp"] {\n`;
  css += `  --color-background: #f5f3ff;\n`;
  css += `  --color-surface: #ffffff;\n`;
  css += `  --color-surface-container: #ede9fe;\n`;
  css += `  --color-surface-container-high: #ddd6fe;\n`;
  css += `  --color-on-surface: #1e1b4b;\n`;
  css += `  --color-on-surface-variant: #4c1d95;\n`;
  css += `  --color-primary: #00855b;\n`;
  css += `  --color-primary-container: #006947;\n`;
  css += `  --color-on-primary: #ffffff;\n`;
  css += `  --color-secondary: #8b5cf6;\n`;
  css += `  --color-secondary-container: #c4b5fd;\n`;
  css += `  --color-on-secondary: #2e1065;\n`;
  css += `  --color-tertiary: #0284c7;\n`;
  css += `  --color-outline: #8b5cf6;\n`;
  css += `  --color-outline-variant: #ddd6fe;\n`;
  css += `  --font-heading: var(--font-quicksand), 'Quicksand', sans-serif;\n`;
  css += `}\n\n`;

  // SMA - Senior High (High-Contrast Dark Mode & Neon Lime Accents)
  css += `[data-jenjang="sma"] {\n`;
  css += `  --color-background: #0b121e;\n`;
  css += `  --color-surface: #152238;\n`;
  css += `  --color-surface-container: #1e2d4a;\n`;
  css += `  --color-surface-container-high: #28395b;\n`;
  css += `  --color-on-surface: #f1f5f9;\n`;
  css += `  --color-on-surface-variant: #94a3b8;\n`;
  css += `  --color-primary: #00e699;\n`;
  css += `  --color-primary-container: #00a86b;\n`;
  css += `  --color-on-primary: #052e16;\n`;
  css += `  --color-secondary: #ccff00;\n`;
  css += `  --color-secondary-container: #a3cc00;\n`;
  css += `  --color-on-secondary: #1a3300;\n`;
  css += `  --color-tertiary: #38bdf8;\n`;
  css += `  --color-outline: #334155;\n`;
  css += `  --color-outline-variant: #1e293b;\n`;
  css += `  --font-heading: var(--font-montserrat), 'Montserrat', sans-serif;\n`;
  css += `}\n`;

  // Write outputs
  fs.mkdirSync(path.dirname(outputCssPath), { recursive: true });
  fs.writeFileSync(outputCssPath, css, 'utf8');
  fs.writeFileSync(outputJsonPath, JSON.stringify(tokensData, null, 2), 'utf8');

  console.log('Successfully generated tokens.css and tokens.json from design/DESIGN.md');
} catch (err) {
  console.error('Error generating design tokens:', err);
  process.exit(1);
}

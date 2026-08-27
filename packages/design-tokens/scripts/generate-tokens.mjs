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

  // Grade-Level Attribute Selectors (Single Palette Base - Ready for Future Variations)
  css += `/* Grade Level Selectors (All 4 grade levels share the single canonical token set) */\n`;
  css += `[data-jenjang="tk"],\n[data-jenjang="sd"],\n[data-jenjang="smp"],\n[data-jenjang="sma"] {\n`;
  css += `  /* Inherits canonical tokens from :root. Ready to accommodate future overrides per grade level */\n`;
  css += `}\n\n`;

  // Professional Shell Typography Override Scope
  css += `/* Professional Shell Scope Typography Override */\n`;
  css += `[data-shell="professional"],\n.shell-professional {\n`;
  css += `  --font-heading: var(--font-inter), 'Inter', sans-serif;\n`;
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

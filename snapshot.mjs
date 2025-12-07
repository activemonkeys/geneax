#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const PROFILES_DIR = 'profiles';
const DEFAULT_PROFILE = 'default';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadProfile(profileName) {
  const profilePath = path.resolve(
    __dirname,
    PROFILES_DIR,
    `${profileName}.json`,
  );
  if (!fs.existsSync(profilePath)) {
    console.error(`❌ Profiel niet gevonden: ${profilePath}`);
    process.exit(1);
  }
  try {
    return JSON.parse(fs.readFileSync(profilePath, 'utf-8'));
  } catch (err) {
    console.error(
      `❌ Fout bij het lezen van profiel ${profileName}.json:`,
      err.message,
    );
    process.exit(1);
  }
}

function shouldExclude(name, excludePatterns) {
  return excludePatterns.some((pattern) => {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return regex.test(name);
    }
    return name === pattern;
  });
}

function collectFiles(dir, config, currentDepth = 0) {
  const {
    extensions = [],
    excludeDirs = [],
    excludeFiles = [],
    include = [],
    maxDepth = 20,
  } = config;

  if (currentDepth > maxDepth) return [];

  const dirName = path.basename(dir);
  if (shouldExclude(dirName, excludeDirs) && currentDepth > 0) {
    return [];
  }

  let results = [];

  try {
    const files = fs.readdirSync(dir, {withFileTypes: true});

    for (const file of files) {
      const filePath = path.join(dir, file.name);
      const relativePath = path.relative(__dirname, filePath);

      if (file.isDirectory()) {
        if (shouldExclude(file.name, excludeDirs)) continue;

        // Als include is gespecificeerd, check of we in een relevante directory zijn
        if (include.length > 0) {
          const isIncluded = include.some(
            (inc) =>
              relativePath.startsWith(inc) || inc.startsWith(relativePath),
          );
          if (!isIncluded) continue;
        }

        results = results.concat(
          collectFiles(filePath, config, currentDepth + 1),
        );
      } else {
        if (shouldExclude(file.name, excludeFiles)) continue;

        const ext = path.extname(file.name);
        if (!extensions.includes(ext)) continue;

        // Check include filter voor bestanden
        if (include.length > 0) {
          const isIncluded = include.some((inc) =>
            relativePath.startsWith(inc),
          );
          if (!isIncluded) continue;
        }

        results.push(filePath);
      }
    }
  } catch (err) {
    console.warn(
      `⚠️ Kan directory niet lezen (${path.relative(__dirname, dir)}): ${err.message}`,
    );
  }

  return results;
}

function categorizeFiles(files) {
  const categories = {
    CONFIG: [],
    PRISMA: [],
    'SRC/APP': [],
    'SRC/COMPONENTS': [],
    'SRC/LIB': [],
    'SRC/HOOKS': [],
    'SRC/TYPES': [],
    'SRC/STYLES': [],
    'SRC/UTILS': [],
    'SRC/ACTIONS': [],
    'SRC/OTHER': [],
    PUBLIC: [],
    OTHER: [],
  };

  const configFiles = [
    'package.json',
    'tsconfig.json',
    'next.config',
    'tailwind.config',
    'postcss.config',
    'eslint',
    'prettier',
    '.env',
  ];

  files.forEach((file) => {
    const relative = path.relative(__dirname, file).replace(/\\/g, '/');
    const parts = relative.split('/');

    // Config bestanden in root
    if (
      parts.length === 1 ||
      configFiles.some((c) => relative.toLowerCase().includes(c.toLowerCase()))
    ) {
      if (
        !relative.startsWith('src/') &&
        !relative.startsWith('prisma/') &&
        !relative.startsWith('public/')
      ) {
        categories['CONFIG'].push(file);
        return;
      }
    }

    // Prisma bestanden
    if (relative.startsWith('prisma/')) {
      categories['PRISMA'].push(file);
      return;
    }

    // Public bestanden
    if (relative.startsWith('public/')) {
      categories['PUBLIC'].push(file);
      return;
    }

    // Src bestanden
    if (relative.startsWith('src/')) {
      const srcPath = relative.substring(4); // Remove 'src/'

      if (srcPath.startsWith('app/') || srcPath.startsWith('pages/')) {
        categories['SRC/APP'].push(file);
      } else if (srcPath.startsWith('components/')) {
        categories['SRC/COMPONENTS'].push(file);
      } else if (srcPath.startsWith('lib/')) {
        categories['SRC/LIB'].push(file);
      } else if (srcPath.startsWith('hooks/')) {
        categories['SRC/HOOKS'].push(file);
      } else if (srcPath.startsWith('types/')) {
        categories['SRC/TYPES'].push(file);
      } else if (srcPath.startsWith('styles/')) {
        categories['SRC/STYLES'].push(file);
      } else if (srcPath.startsWith('utils/')) {
        categories['SRC/UTILS'].push(file);
      } else if (srcPath.startsWith('actions/')) {
        categories['SRC/ACTIONS'].push(file);
      } else {
        categories['SRC/OTHER'].push(file);
      }
      return;
    }

    categories['OTHER'].push(file);
  });

  return categories;
}

function generateDocumentation(files, profile, extensions) {
  const outputPath = path.resolve(
    __dirname,
    profile.outputFile || 'project-content.txt',
  );

  let content = `Project snapshot gegenereerd op: ${new Date().toLocaleString('nl-NL')}\n`;
  content += `Profiel: ${profile.name} (${profile.description || 'Geen beschrijving'})\n`;
  content += `Totaal aantal bestanden: ${files.length}\n`;
  content += `Bestandstypen: ${extensions.join(', ')}\n`;
  content += `${'='.repeat(70)}\n\n`;

  const categorized = categorizeFiles(files);

  // Toon structuur overzicht
  content += `STRUCTUUR OVERZICHT:\n`;
  content += `${'-'.repeat(40)}\n`;
  Object.entries(categorized).forEach(([category, categoryFiles]) => {
    if (categoryFiles.length > 0) {
      content += `  ${category}: ${categoryFiles.length} bestanden\n`;
    }
  });
  content += `\n`;

  // Verwerk elke categorie
  Object.entries(categorized).forEach(([category, categoryFiles]) => {
    if (categoryFiles.length === 0) return;

    content += `${'='.repeat(70)}\n`;
    content += `CATEGORIE: ${category}\n`;
    content += `${'='.repeat(70)}\n\n`;

    categoryFiles.sort().forEach((file) => {
      try {
        const fileContent = fs.readFileSync(file, 'utf-8');
        const relativePath = path.relative(__dirname, file).replace(/\\/g, '/');

        content += `// ─────────────────────────────────────────────────────────────\n`;
        content += `// Bestand: ${relativePath}\n`;
        content += `// ─────────────────────────────────────────────────────────────\n`;
        content += fileContent.trim() + '\n\n';

        console.log(`✅ Toegevoegd: ${relativePath}`);
      } catch (err) {
        console.warn(
          `❌ Kan bestand niet lezen (${path.relative(__dirname, file)}): ${err.message}`,
        );
      }
    });
  });

  fs.writeFileSync(outputPath, content.trim(), 'utf-8');
  console.log(
    `\n🎉 Project documentatie gegenereerd: ${path.basename(outputPath)}`,
  );
  console.log(`📊 Totaal ${files.length} bestanden verwerkt.`);
}

// Main execution
const profileNameArg = process.argv[2];
if (!profileNameArg) {
  console.log(
    `ℹ️ Geen profiel opgegeven, gebruik standaardprofiel: '${DEFAULT_PROFILE}'`,
  );
}

const profileName = profileNameArg || DEFAULT_PROFILE;
const profile = loadProfile(profileName);
profile.name = profileName;

console.log(`🚀 Start generatie met profiel: '${profileName}'...`);
console.log(`   Beschrijving: ${profile.description || 'N.v.t.'}`);
console.log('');

// Verzamel bestanden
const config = {
  ...profile.global,
  include: profile.include || [],
};

const allFiles = new Set();

// Scan de project root
const files = collectFiles(__dirname, config);
files.forEach((file) => allFiles.add(file));

// Voeg specifieke root bestanden toe
if (profile.rootFiles) {
  profile.rootFiles.forEach((file) => {
    const filePath = path.resolve(__dirname, file);
    if (fs.existsSync(filePath)) {
      allFiles.add(filePath);
    } else {
      console.warn(`⚠️ Root-bestand '${file}' niet gevonden.`);
    }
  });
}

// Genereer output
const finalFiles = Array.from(allFiles).sort();
const allExtensions = new Set(finalFiles.map((f) => path.extname(f)));

if (finalFiles.length === 0) {
  console.warn('\n⚠️ Geen bestanden gevonden met de criteria in het profiel.');
} else {
  generateDocumentation(finalFiles, profile, Array.from(allExtensions).sort());
}

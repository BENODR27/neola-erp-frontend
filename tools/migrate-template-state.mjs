import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = process.cwd();
const dryRun = process.argv.includes('--dry-run');
const sourceRoot = path.join(root, 'src', 'app');

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(entryPath) : [entryPath];
  });
}

function hasDecorator(property) {
  return property.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.Decorator);
}

function isSignalInitializer(initializer) {
  return /^(signal|computed|input|model|output)\s*\(/.test(initializer.getText());
}

function hasUnsafeMutation(source, name) {
  const pattern = new RegExp(
    `this\\.${name}\\s*(?:\\.push|\\.pop|\\.shift|\\.unshift|\\.splice|\\.sort|\\.reverse|\\.add|\\.delete|\\.clear)|this\\.${name}\\s*(?:\\[[^\\]]+\\]|\\.[A-Za-z_$][\\w$]+)\\s*=|this\\.${name}\\s*(?:[+\\-*/%]=|\\+\\+|--)`,
  );
  return pattern.test(source);
}

function addSignalImport(source) {
  if (/import\s*\{[^}]*\bsignal\b[^}]*\}\s*from\s*['"]@angular\/core['"]/.test(source)) {
    return source;
  }

  const angularImport = source.match(/import\s*\{([^}]*)\}\s*from\s*['"]@angular\/core['"];?/);
  if (angularImport) {
    const replacement = angularImport[0].replace(angularImport[1], `${angularImport[1]}, signal`);
    return source.replace(angularImport[0], replacement);
  }

  return `import { signal } from '@angular/core';\n${source}`;
}

function migrateFile(filePath) {
  const htmlPath = filePath.replace(/\.component\.ts$/, '.component.html');
  if (!fs.existsSync(htmlPath)) return 0;

  const source = fs.readFileSync(filePath, 'utf8');
  const template = fs.readFileSync(htmlPath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true);
  const candidates = [];

  function visit(node) {
    if (ts.isPropertyDeclaration(node) && node.name && ts.isIdentifier(node.name)) {
      const name = node.name.text;
      const initializer = node.initializer;
      const typeText = node.type?.getText(sourceFile) ?? '';
      const templateRef = new RegExp(`(?<![\\w.-])${name}(?![\\w(])`).test(template);
      const twoWayRef = new RegExp(`\\[\\([^)]*\\)\\]\\s*=\\s*["'][^"']*\\b${name}\\b`).test(template);
      const templateAssignment = new RegExp(`(?<![\\w.-])${name}\\s*=`).test(template);
      const hasAssignment = new RegExp(`this\\.${name}\\s*=`).test(source);

      if (
        initializer &&
        templateRef &&
        !twoWayRef &&
        !templateAssignment &&
        !hasDecorator(node) &&
        !node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ReadonlyKeyword) &&
        !node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword) &&
        !isSignalInitializer(initializer) &&
        name !== 'form' &&
        !typeText.includes('FormGroup') &&
        !typeText.includes('FormControl') &&
        !hasUnsafeMutation(source, name) &&
        (hasAssignment || /^(is|has|show|loading|selected|current|active|search|data|items|rows|list|messages|value|count)/i.test(name))
      ) {
        candidates.push(node);
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  if (!candidates.length) return 0;
  if (dryRun) {
    console.log(`${path.relative(root, filePath)}: ${candidates.map((node) => node.name.getText()).join(', ')}`);
    return candidates.length;
  }

  const edits = [];
  const candidateNames = new Set(candidates.map((node) => node.name.getText()));
  const candidateRanges = candidates.map((node) => [node.getStart(sourceFile), node.end]);

  for (const property of candidates) {
    const name = property.name.getText();
    const initializer = property.initializer.getText(sourceFile);
    const typeText = property.type?.getText(sourceFile);
    const replacement = `readonly ${name} = signal${typeText ? `<${typeText}>` : ''}(${initializer})`;
    edits.push({ start: property.getStart(sourceFile), end: property.end, text: replacement });
  }

  function collectReferences(node) {
    if (
      ts.isPropertyAccessExpression(node) &&
      ts.isThis(node.expression) &&
      candidateNames.has(node.name.text) &&
      !candidateRanges.some(([start, end]) => node.getStart(sourceFile) >= start && node.end <= end)
    ) {
      const parent = node.parent;
      if (
        ts.isBinaryExpression(parent) &&
        parent.left === node &&
        parent.operatorToken.kind === ts.SyntaxKind.EqualsToken
      ) {
        edits.push({
          start: parent.getStart(sourceFile),
          end: parent.end,
          text: `this.${node.name.text}.set(${parent.right.getText(sourceFile)})`,
        });
      } else if (!(ts.isPropertyAccessExpression(parent) && parent.expression === node)) {
        edits.push({
          start: node.getStart(sourceFile),
          end: node.end,
          text: `this.${node.name.text}()`,
        });
      }
    }
    ts.forEachChild(node, collectReferences);
  }

  collectReferences(sourceFile);
  const selectedEdits = [];
  for (const edit of edits.sort((left, right) => {
    const leftSize = left.end - left.start;
    const rightSize = right.end - right.start;
    return rightSize - leftSize || right.start - left.start;
  })) {
    if (selectedEdits.every((selected) => edit.end <= selected.start || edit.start >= selected.end)) {
      selectedEdits.push(edit);
    }
  }
  let migratedSource = source;
  for (const edit of selectedEdits.sort((left, right) => right.start - left.start)) {
    migratedSource = migratedSource.slice(0, edit.start) + edit.text + migratedSource.slice(edit.end);
  }
  for (const name of candidateNames) {
    const reference = new RegExp(`this\\.${name}(?!\\s*(?:\\(|\\.set\\b))`, 'g');
    migratedSource = migratedSource.replace(reference, `this.${name}()`);
  }
  migratedSource = addSignalImport(migratedSource);

  let migratedTemplate = template;
  for (const name of candidateNames) {
    const expression = new RegExp(`(?<![\\w.-])${name}(?![\\w(])`, 'g');
    migratedTemplate = migratedTemplate.replace(expression, `${name}()`);
  }
  fs.writeFileSync(htmlPath, migratedTemplate);
  fs.writeFileSync(filePath, migratedSource);
  return candidates.length;
}

const componentFiles = walk(sourceRoot).filter((filePath) => filePath.endsWith('.component.ts'));
const migrated = componentFiles.reduce((total, filePath) => total + migrateFile(filePath), 0);
console.log(`${dryRun ? 'Candidates' : 'Migrated'}: ${migrated}`);

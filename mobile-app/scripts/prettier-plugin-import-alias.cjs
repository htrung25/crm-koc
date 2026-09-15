const path = require('node:path');
const ts = require('typescript');
const { parsers } = require('prettier/plugins/typescript');

const root = path.resolve(__dirname, '..');
const sourceRoot = path.join(root, 'src');

function isWithin(parent, target) {
  const relative = path.relative(parent, target);
  return (
    !path.isAbsolute(relative) &&
    relative !== '..' &&
    !relative.startsWith(`..${path.sep}`)
  );
}

function readAliases() {
  // Đọc lại mỗi lần format để editor nhận thay đổi tsconfig mà không cần restart.
  const result = ts.readConfigFile(
    path.join(root, 'tsconfig.json'),
    ts.sys.readFile
  );
  if (result.error)
    throw new Error('Cannot read tsconfig.json for import aliases');
  const options = result.config.compilerOptions ?? {};
  const base = path.resolve(root, options.baseUrl ?? '.');
  return Object.entries(options.paths ?? {})
    .filter(
      ([alias, targets]) =>
        alias.startsWith('@/') &&
        alias.endsWith('/*') &&
        targets.length === 1 &&
        targets[0].endsWith('/*')
    )
    .map(([alias, targets]) => ({
      prefix: alias.slice(0, -1),
      directory: path.resolve(base, targets[0].slice(0, -2)),
    }))
    .sort((a, b) => b.directory.length - a.directory.length);
}

function preprocess(text, options) {
  // Node scripts không được Metro resolve alias; chỉ áp dụng cho source của app.
  if (
    !options.filepath ||
    !isWithin(sourceRoot, path.resolve(options.filepath))
  )
    return text;
  const aliases = readAliases();
  const source = ts.createSourceFile(
    options.filepath,
    text,
    ts.ScriptTarget.Latest,
    true
  );
  const edits = [];

  function visit(node) {
    let specifier;
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      specifier = node.moduleSpecifier;
    } else if (
      ts.isImportTypeNode(node) &&
      ts.isLiteralTypeNode(node.argument)
    ) {
      specifier = node.argument.literal;
    } else if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference)
    ) {
      specifier = node.moduleReference.expression;
    } else if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) &&
          node.expression.text === 'require'))
    ) {
      specifier = node.arguments[0];
    }

    if (
      specifier &&
      ts.isStringLiteral(specifier) &&
      /^\.{1,2}\//.test(specifier.text)
    ) {
      const target = path.resolve(
        path.dirname(options.filepath),
        specifier.text
      );
      const alias = aliases.find(({ directory }) =>
        isWithin(directory, target)
      );
      if (alias) {
        const relative = path
          .relative(alias.directory, target)
          .split(path.sep)
          .join('/');
        edits.push({
          start: specifier.getStart(source),
          end: specifier.end,
          value: JSON.stringify(
            relative ? alias.prefix + relative : alias.prefix.slice(0, -1)
          ),
        });
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(source);
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    text = text.slice(0, edit.start) + edit.value + text.slice(edit.end);
  }
  return text;
}

module.exports = {
  parsers: {
    typescript: { ...parsers.typescript, preprocess },
  },
};

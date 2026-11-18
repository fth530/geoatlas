const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const ts = require('typescript');

require.extensions['.ts'] = function compileTs(module, filename) {
  const raw = fs.readFileSync(filename, 'utf8');
  const source = raw.replace(
    /import\.meta\.url/g,
    JSON.stringify(pathToFileURL(filename).href),
  );
  const transpiled = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      resolveJsonModule: true,
    },
  });
  module._compile(transpiled.outputText, filename);
};

require(path.resolve(__dirname, 'run.ts'));

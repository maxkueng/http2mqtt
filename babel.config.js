const fs = require('fs');
const path = require('path');
const { resolvePath } = require('babel-plugin-module-resolver');

function isFileSync(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.isFile();
  } catch (err) {
    return false;
  }
}

function isDirectorySync(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.isDirectory();
  } catch (err) {
    return false;
  }
}

function resolveRelativePath(from, relativePath) {
  const base = isDirectorySync(from) ? from : path.dirname(from);
  return path.resolve(base, relativePath);
}

function resolvePathNode(sourcePath, currentFile, options) {
  const resolvedPath = resolvePath(sourcePath, currentFile, options);

  if (!resolvedPath || isFileSync(resolveRelativePath(currentFile, resolvedPath))) {
    return resolvedPath;
  }

  const missingExtension = options.extensions.find((ext) => {
    return isFileSync(resolveRelativePath(currentFile, `${resolvedPath}${ext}`));
  });

  if (!missingExtension) {
    throw new Error('meh..');
  }

  return `${resolvedPath}${missingExtension}`;
}

module.exports = function (api) {
  api.cache(false);

  return {
    presets: [
      [
        '@babel/preset-env',
        {
          targets: {
            node: true,
          },
        },
      ],
      '@babel/typescript',
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: [path.resolve(process.cwd(), './src')],
          extensions: ['.ts', '.js'],
          stripExtensions: ['.js'],
          resolvePath: resolvePathNode,
        },
      ],
      '@babel/plugin-proposal-class-properties',
      '@babel/proposal-object-rest-spread',
    ],
  };
};

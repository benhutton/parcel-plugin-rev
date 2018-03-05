const fs = require('fs');
const md5File = require('md5-file');
const walkedFiles = new Map();
const hashMap = new Map();
const { basename, extname } = require('path');

const packageHasher = mainBundle => walkBundles(mainBundle, '--');

const renameReferences = (fileName, hashMap) => {
  if (fs.existsSync(fileName)) {
    let data = fs.readFileSync(fileName, 'utf8');

    hashMap.forEach((value, key) => {
      data = data.replace(new RegExp(key, 'g'), value);
    });

    fs.writeFileSync(fileName, data, 'utf8');
  } else {
    console.log(`${fileName} not found. Must have already been moved!`);
  }
}

const walkBundles = (bundle, indent) => {
  for (let child of bundle.childBundles) {
    if (!walkedFiles.has(child.name)) {
      walkBundles(child, `${indent}--`);
    }
  }

  const type = bundle.entryAsset.type;

  if (type != 'woff' && type != 'woff2') {
    renameReferences(bundle.name, hashMap);
  }

  const oldHash = basename(bundle.name, extname(bundle.name));
  const hash = md5File.sync(bundle.name);
  const newLocation = `${bundle.entryAsset.options.outDir}/${hash}.${bundle.entryAsset.type}`;

  walkedFiles.set(bundle.name, hash);
  hashMap.set(oldHash, hash);

  // If it's not the entry file, rename it
  if (bundle.parentBundle) {
    fs.renameSync(bundle.name, newLocation);
  }
}

module.exports = bundler => {
  bundler.on('bundled', bundle => packageHasher(bundle));
}

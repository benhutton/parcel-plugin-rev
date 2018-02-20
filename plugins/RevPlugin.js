const fs = require('fs');
const md5File = require('md5-file');
const walkedFiles = new Map();
const hashMap = new Map();
const Path = require('path');

module.exports = function (bundler) {
  const logger = bundler.logger;

  const packageHasher = (mainBundle) => {
    walkBundles(mainBundle, '--');
  };

  const walkBundles = (bundle, indent) =>  {
    for (let child of bundle.childBundles) {
      if (!walkedFiles.has(child.name)) {
        walkBundles(child, indent + '--');
      }
    }

    renameReferences(bundle.name, hashMap);

    let oldHash = Path.basename(bundle.name, Path.extname(bundle.name));
    let hash = md5File.sync(bundle.name);
    walkedFiles.set(bundle.name, hash);
    hashMap.set(oldHash, hash);
    // logger.log(indent + bundle.name)
    console.log(indent + bundle.entryAsset.name);

    let newLocation = `${bundle.entryAsset.options.outDir}/${hash}.${
      bundle.entryAsset.type
    }`;
    // logger.log(indent + newLocation + " (move here)");

    // If it's not the entry file, rename it
    if (bundle.parentBundle) {
      fs.renameSync(bundle.name, newLocation);
    }
  }

  const renameReferences = (fileName, hashMap) => {
    if (fs.existsSync(fileName)) {
      let data = fs.readFileSync(fileName, 'utf8');

      hashMap.forEach(function(value, key) {
        data = data.replace(new RegExp(key, 'g'), value);
      });

      fs.writeFileSync(fileName, data, 'utf8', function(err) {
        if (err) return console.log(err);
      });
    } else {
      console.log(fileName + ' not found. Must have already been moved!');
    }
  }

  bundler.on('bundled', (bundle) => {
    console.log('ABOUT TO FINGERPRINT!!');
    packageHasher(bundle);
  });
}

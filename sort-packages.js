const fs = require('fs');
const path = require('path');

// Load package.json
const packagePath = path.join(__dirname, 'package.json');
const packageFile = fs.readFileSync(packagePath);
const packageJson = JSON.parse(packageFile);

// Sort dependencies and devDependencies
if (packageJson.dependencies) {
  packageJson.dependencies = sortObject(packageJson.dependencies);
}
if (packageJson.devDependencies) {
  packageJson.devDependencies = sortObject(packageJson.devDependencies);
}

// Function to sort an object by its keys
function sortObject(unsortedObj) {
  return Object.keys(unsortedObj)
    .sort()
    .reduce((obj, key) => {
      obj[key] = unsortedObj[key];
      return obj;
    }, {});
}

// Write the sorted package.json back to file
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));

console.log('Sorted package.json and wrote to file.');

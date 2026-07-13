const os = require('os');
const path = require('path');
const fs = require('fs');

const sampleFilesDir = path.join(__dirname, 'sample-files');
if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}

// OS module
const platform = os.platform();
console.log(`Platform: ${platform}`);

const cpus = os.cpus();
console.log(`CPU: ${cpus[0].model}`);

const totalMemory = os.totalmem();
console.log(`Total Memory: ${totalMemory}`);

// Path module
const filePath = path.join(__dirname, 'sample-files', 'demo.txt');
fs.writeFile(filePath, 'Hello from fs.promises!', 'utf8', (err) => {
  if (err) {
    console.log("Write file failed:", err.message);
    return;
  }
});
console.log(`Joined path: ${filePath}`);

// fs.promises API
fs.promises.readFile(filePath, 'utf8')
  .then((content) => {
    console.log(`fs.promises read: ${content}`);
  })
  .catch((err) => {
    console.log(`fs.promises read failed: ${err.message}`);
  })

// Streams for large files- log first 40 chars of each chunk

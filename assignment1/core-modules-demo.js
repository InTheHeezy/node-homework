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

// fs.promises API


// Streams for large files- log first 40 chars of each chunk

const fs = require('fs');
const fsProm = require('fs').promises;
const path = require('path');

// Write a sample file for demonstration
const filePath = path.join(__dirname, 'sample.txt');
fs.writeFile(filePath, 'Hello async world!', 'utf8', (err) => {
  if (err) {
    console.log("Write file failed:", err.message);
    return;
  }
  console.log('File created successfully');
});

// 1. Callback style
fs.readFile(filePath, "utf8", (err, content) => {
  if (err) {
    console.log("File read failed:", err.message);
    return;
  }
  console.log('File content:', content);
});

  // Callback hell example (test and leave it in comments):
  // fs.writeFile(filePath, 'Hello async world!', 'utf8', (err) => {
  // if (err) {
  //   console.log("Write file failed:", err.message);
  //   return;
  // }
  // console.log('File created successfully');

  // fs.readFile(filePath, "utf8", (err, content) => {
  //   if (err) {
  //     console.log("File read failed:", err.message);
  //     return;
  //   }
  //   console.log('File content:', content);
  //   }); 
  // }); 
  // Big difference is read file is inside write file.   

  // 2. Promise style
  fs.writeFile(filePath, 'Hello async world!', 'utf8')
    .then(() => {
      console.log('File created successfully (Promise)');
      return fs.readFile(filePath, 'utf8');
    })
    .then((content) =>{
      console.log('FileC content (Promise):', content);
    })
    .catch((err) => {
      console.log('Promise operation failed:', err.message);
    })
      // 3. Async/Await style

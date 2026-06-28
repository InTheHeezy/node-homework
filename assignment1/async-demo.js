const fs = require('fs');
const path = require('path');


// Write a sample file for demonstration
const filePath = path.join(__dirname, 'sample.txt');
fs.writeFile(filePath, 'Hello async world!', 'utf8', (err) => {
  if (err) {
    console.log("Write file failed:", err.message);
    return;
  }
  console.log('File created successfully');
})
// 1. Callback style

  // Callback hell example (test and leave it in comments):


  // 2. Promise style


      // 3. Async/Await style

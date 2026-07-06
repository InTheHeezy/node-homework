# Node.js Fundamentals

## What is Node.js?
Node.js is a runtime environment that executes JavaScript outside a browser.

## How does Node.js differ from running JavaScript in the browser?
There are a couple of differences:
- Node does not have a HTML or DOM
- Node can do CRUD operations to server files
- Node runs on the computer/server directly rather than browser

## What is the V8 engine, and how does Node use it?
V8 engine is an engine that reads JavaScript and turns it 
into fast instructions for the computer. 
Node uses this by wrapping the code and enabling features like
file and network access.

## What are some key use cases for Node.js?
Key use cases are: 
-CRUD operations for files
-Starting a webserver
-Creating APIs
-Real time applications

## Explain the difference between CommonJS and ES Modules. Give a code example of each.

**CommonJS (default in Node.js):**
```js
const { register, logoff } = require("../controllers/userController");
```
CommonJS uses require() to handle importing.
CommonJS loads modules synchronously (one after another).

**ES Modules (supported in modern Node.js):**
```js
import { useState, useEffect } from "react";
``` 
ES Modules uses import to handle importing.
ES Modules loads modules asynchronously (parsed before code runs).
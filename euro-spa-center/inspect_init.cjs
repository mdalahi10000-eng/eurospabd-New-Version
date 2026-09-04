const fs = require("fs");
const html = fs.readFileSync("maps_full.html", "utf8");
const initState = html.match(/window\.APP_INITIALIZATION_STATE\s*=\s*(\[.+?\]);/);
const parsed = JSON.parse(initState[1]);
console.log("=== parsed[3] ===");
console.log(JSON.stringify(parsed[3], null, 2));
console.log("=== parsed[5] ===");
console.log(JSON.stringify(parsed[5], null, 2));

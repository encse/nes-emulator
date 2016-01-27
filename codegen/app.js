var Gen = require("./mos6502gen");
var res = new Gen.Mos6502Gen().run();
console.log();
var fs = require('fs');
fs.writeFile("../nes/app/Mos6502Base.ts", res, function (err) {
    if (err) {
        return console.log(err);
    }
    console.log("The file was saved!");
});
//# sourceMappingURL=app.js.map
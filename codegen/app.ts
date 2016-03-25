import Gen = require("./mos6502gen");
var res = new Gen.Mos6502Gen().run();

var fs = require('fs');
fs.writeFile("../nes/app/cpu/Mos6502Base.ts", res, function (err) {
    if (err) {
        return console.log(err);
    }

    console.log("The file was saved!");
}); 
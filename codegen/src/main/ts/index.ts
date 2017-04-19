import * as fs from 'fs';
 import * as Gen from './Mos6502gen';
 import {mkdir} from './Util';

 const res = new Gen.Mos6502Gen().run();

 mkdir('build/generated');
 const fpat = 'build/generated/Mos6502Base.ts';
 fs.writeFile(fpat, res, (err: any) => {
    if (err) {
        return console.log(err);
    }

    console.log(`${fpat} was generated.`);
});

import * as fs from 'fs';
import * as path from 'path';

export function rmdir(dir: string) {
    if (fs.existsSync(dir)) {
        fs.readdirSync(dir).forEach((file) => {
            const curPath = dir + path.sep + file;

            if (fs.lstatSync(curPath).isDirectory()) {
                this.rmdir(curPath);
            } else {
                fs.unlinkSync(curPath);
            }

        });
        fs.rmdirSync(dir);
    }
}

export function mkdir(dir: string) {
    let dirT = '';
    for (const subDir of dir.split(path.sep)) {
        dirT += subDir + path.sep;
        if (!fs.existsSync(dirT)) {
            fs.mkdirSync(dirT);
        }
    }

    return dir;
}

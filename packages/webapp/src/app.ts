import {NesRunner} from 'nes';

let rom = window.location.hash.substring(1);
rom = rom ? rom : 'Super Mario Bros';
new NesRunner(window.document.getElementById('nesContainer'), 'roms/' + rom + '.nes').run();

import {Mos6502} from './Mos6502';
export class IrqLine {
     private isRequestedI = false;

     public constructor(private cpu: Mos6502) {

     }

     public request() {
         if (!this.isRequestedI) {
             this.cpu.irqLine--;
             this.isRequestedI = true;
         }
     }

     public ack() {
         if (this.isRequestedI) {
             this.cpu.irqLine++;
             this.isRequestedI = false;
         }
     }

     public isRequested() {
         return this.isRequestedI;
     }
 }

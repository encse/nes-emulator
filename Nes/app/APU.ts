class APU {

   
    constructor(memory: CompoundMemory) {

        memory.shadowSetter(0x4000, 0x4017, this.setter.bind(this));
        memory.shadowGetter(0x4000, 0x4017, this.getter.bind(this));
    }

    private getter(addr: number) {
     //   console.log('get ', addr.toString(16));
        return 0;
    }

    private setter(addr: number, value: number) {
      //  console.log('set ', addr.toString(16), value);
    }

    
}
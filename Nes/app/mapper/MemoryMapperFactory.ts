class MemoryMapperFactory {

    create(nesImage: NesImage):IMemoryMapper {
        switch (nesImage.mapperType) {
            case 0:
                return new Mmc0(nesImage);
            case 1:
                return new Mmc1(nesImage);
            case 2:
                return new UxRom(nesImage);
            case 4:
                return new Mmc3(nesImage);
            default:
                throw 'unkown mapper ' + nesImage.mapperType;
        }
    }
}

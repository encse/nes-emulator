del temp\palette.o
del temp\palette.nes
cc65\bin\ca65 palette.s -g -o temp\palette.o
cc65\bin\ld65 -C nrom.cfg -o temp\palette.nes temp\palette.o -m temp\palette_map.txt -Ln temp\palette_labels.txt
python palette_symbols.py
@pause
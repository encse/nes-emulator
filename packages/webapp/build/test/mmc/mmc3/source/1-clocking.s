.include "test_mmc3.inc"

main:
	jsr begin_mmc3_tests

	set_test 2,"Counter/IRQ/A12 clocking isn't working at all"
	ldx #10
	jsr begin_counter_test
	jsr clock_counter       ; counter = 10
	jsr clock_counter
	jsr should_be_clear     ; counter shouldn't be zero yet
	
	set_test 3,"Should decrement when A12 is toggled via PPUADDR"
	ldx #2					; $e2f5
	jsr begin_counter_test	; $e2f7
	ldx #9                  ; $e2fa counter = 2
	jsr clock_counter_x     ; $e2fc clock 9 times 
	jsr should_be_set       ; $e2ff should have hit zero at least once by now 
	
	set_test 4,"Writing to $C000 shouldn't cause reload"
	ldx #2
	jsr begin_counter_test
	jsr clock_counter       ; counter = 2
	lda #100
	jsr set_reload
	ldx #8
	jsr clock_counter_x     ; should reach 0 before reloading with 100
	jsr should_be_set       ; and thus IRQ flag should be set by now
	
	set_test 5,"Writing to $C001 shouldn't cause immediate reload"
	ldx #1
	jsr begin_counter_test
	lda #1
	jsr set_reload          ; shouldn't affect counter
	jsr clear_counter       ; request reload on next clock, not immediately
	lda #4
	jsr set_reload          ; reload = 4, which will get used next
	jsr clock_counter       ; counter = 4
	jsr clock_counter       ; 3
	jsr should_be_clear

	set_test 6,"Should reload (no decrement) on first clock after clear"
	ldx #2
	jsr begin_counter_test
	jsr clock_counter       ; 2
	jsr clock_counter       ; 1
	jsr should_be_clear
	
	set_test 7,"Clear should clear counter immediately"
	ldx #2
	jsr begin_counter_test
	jsr clock_counter       ; 2
	jsr clock_counter       ; 1
	jsr clear_counter       ; clear counter
	jsr clock_counter       ; counter isn't 1 anymore, so IRQ shouldn't be set here
	jsr should_be_clear
	
	set_test 8,"IRQ should be set when counter is decremented to 0"
	ldx #1
	jsr begin_counter_test
	jsr clock_counter       ; 1
	jsr clock_counter       ; 0
	jsr should_be_set
	
	set_test 9,"IRQ should never be set when disabled"
	ldx #1
	jsr begin_counter_test
	jsr disable_irq
	ldx #10
	jsr clock_counter_x
	jsr should_be_clear
	
	set_test 10,"Should reload when clocked when counter is 0"
	ldx #1					;$e3e9
	jsr begin_counter_test	;$e3eb
	jsr clock_counter       ;$e3ee 1
	lda #10
	jsr set_reload			; $e3f3
	jsr clock_counter       ; $e3f6 0
	lda #2					; $e3f9
	jsr set_reload
	jsr clock_counter       ; 2
	jsr clock_counter       ; 1
	jsr clear_irq			; 
	jsr clock_counter       ; $e407 0
	jsr should_be_set		; $e40a

	jmp tests_passed

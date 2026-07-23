CC ?= clang
CFLAGS ?= -O2 -std=c11 -Wall -Wextra -Wpedantic
BUILD := build
BIN := $(BUILD)/test_mm

.PHONY: all test clean

all: $(BIN)

$(BIN): mm.c mm.h test_mm.c
	mkdir -p $(BUILD)
	$(CC) $(CFLAGS) mm.c test_mm.c -o $@

test: $(BIN)
	$(BIN)

clean:
	rm -rf $(BUILD)


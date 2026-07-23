CC ?= clang
CFLAGS ?= -O3 -std=c11 -Wall -Wextra -Wpedantic
BUILD := build
BIN := $(BUILD)/matmul

.PHONY: all test run clean

all: $(BIN)

$(BIN): matmul.c
	mkdir -p $(BUILD)
	$(CC) $(CFLAGS) $< -o $@

test: $(BIN)
	$(BIN) --check

run: $(BIN)
	$(BIN) --size 512 --block 32

clean:
	rm -rf $(BUILD)


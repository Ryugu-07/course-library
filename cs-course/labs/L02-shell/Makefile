CC ?= clang
CFLAGS ?= -O2 -std=c11 -Wall -Wextra -Wpedantic
BUILD := build
BIN := $(BUILD)/msh

.PHONY: all test run clean

all: $(BIN)

$(BIN): shell.c
	mkdir -p $(BUILD)
	$(CC) $(CFLAGS) $< -o $@

test: $(BIN)
	python3 test_shell.py $(BIN)

run: $(BIN)
	$(BIN)

clean:
	rm -rf $(BUILD)


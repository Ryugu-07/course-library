CC ?= clang
CFLAGS ?= -O3 -march=native -std=c11 -Wall -Wextra -Wpedantic
BUILD := build
BIN := $(BUILD)/dot

.PHONY: all test run assembly clean

all: $(BIN)

$(BIN): dot.c
	mkdir -p $(BUILD)
	$(CC) $(CFLAGS) $< -o $@

test: $(BIN)
	$(BIN) --check

run: $(BIN)
	$(BIN) --size 16777216

assembly:
	mkdir -p $(BUILD)
	$(CC) $(CFLAGS) -S dot.c -o $(BUILD)/dot.s
	@echo "inspect $(BUILD)/dot.s for vector instructions"

clean:
	rm -rf $(BUILD)


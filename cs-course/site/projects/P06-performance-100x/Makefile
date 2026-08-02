CC ?= cc
CFLAGS ?= -std=c11 -O0 -g -Wall -Wextra -Wpedantic
BUILD := build
SOURCES := starter/baseline.c starter/candidate.c starter/benchmark.c

.PHONY: all clean run candidate

all: $(BUILD)/benchmark

$(BUILD):
	mkdir -p $(BUILD)

$(BUILD)/benchmark: $(SOURCES) starter/benchmark.h | $(BUILD)
	$(CC) $(CFLAGS) $(SOURCES) -o $@

run: all
	./$(BUILD)/benchmark --baseline

candidate: all
	./$(BUILD)/benchmark --candidate

clean:
	rm -rf $(BUILD)

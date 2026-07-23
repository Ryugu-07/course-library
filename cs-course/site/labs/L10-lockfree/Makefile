CXX ?= c++
CXXFLAGS ?= -O2 -std=c++20 -Wall -Wextra -Wpedantic -pthread
BUILD := build
BIN := $(BUILD)/lockfree

.PHONY: all test tsan clean

all: $(BIN)

$(BIN): lockfree.cpp
	mkdir -p $(BUILD)
	$(CXX) $(CXXFLAGS) $< -o $@

test: $(BIN)
	$(BIN)

tsan:
	mkdir -p $(BUILD)
	$(CXX) -O1 -g -std=c++20 -pthread -fsanitize=thread lockfree.cpp -o $(BUILD)/lockfree-tsan
	$(BUILD)/lockfree-tsan

clean:
	rm -rf $(BUILD)


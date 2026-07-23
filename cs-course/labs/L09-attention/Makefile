.PHONY: test test-cuda clean

test:
	python3 reference.py
	python3 verify_source.py

test-cuda:
	nvcc -O3 -lineinfo attention.cu -o attention
	./attention

clean:
	rm -f attention attention.exe


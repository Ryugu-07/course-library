.PHONY: test test-cuda clean

test:
	python3 reference.py
	python3 verify_source.py

test-cuda:
	nvcc -O3 -lineinfo reduce_scan.cu -o reduce_scan
	./reduce_scan

clean:
	rm -f reduce_scan reduce_scan.exe


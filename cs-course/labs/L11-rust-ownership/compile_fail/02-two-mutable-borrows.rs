// expected: cannot borrow as mutable more than once
fn main() {
    let mut values = vec![1, 2, 3];
    let first = &mut values[0];
    let second = &mut values[1];
    *first += *second;
}


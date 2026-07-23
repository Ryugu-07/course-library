use std::sync::{Arc, Mutex};
use std::thread;

pub fn move_then_use_via_borrow(text: &str) -> usize {
    text.len()
}

pub fn split_mutably(values: &mut [i32]) {
    let midpoint = values.len() / 2;
    let (left, right) = values.split_at_mut(midpoint);
    for value in left {
        *value += 1;
    }
    for value in right {
        *value *= 2;
    }
}

pub fn owned_result(input: &str) -> String {
    format!("prefix:{input}")
}

pub fn shared_counter(workers: usize) -> usize {
    let counter = Arc::new(Mutex::new(0usize));
    let handles: Vec<_> = (0..workers)
        .map(|_| {
            let counter = Arc::clone(&counter);
            thread::spawn(move || *counter.lock().unwrap() += 1)
        })
        .collect();
    for handle in handles {
        handle.join().unwrap();
    }
    let result = *counter.lock().unwrap();
    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn borrowing_preserves_owner() {
        let text = String::from("ownership");
        assert_eq!(move_then_use_via_borrow(&text), 9);
        assert_eq!(text, "ownership");
    }

    #[test]
    fn disjoint_mutable_borrows() {
        let mut values = [1, 2, 3, 4];
        split_mutably(&mut values);
        assert_eq!(values, [2, 3, 6, 8]);
    }

    #[test]
    fn return_owned_data() {
        assert_eq!(owned_result("safe"), "prefix:safe");
    }

    #[test]
    fn send_sync_with_arc_mutex() {
        assert_eq!(shared_counter(8), 8);
    }
}


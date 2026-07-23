// expected: Rc cannot be sent between threads safely
use std::rc::Rc;

fn main() {
    let value = Rc::new(42);
    std::thread::spawn(move || println!("{value}")).join().unwrap();
}


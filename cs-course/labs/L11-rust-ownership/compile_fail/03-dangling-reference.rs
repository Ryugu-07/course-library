// expected: cannot return reference to local variable
fn dangling() -> &'static str {
    let text = String::from("temporary");
    &text
}

fn main() {
    println!("{}", dangling());
}


// expected: borrow of moved value
fn main() {
    let text = String::from("moved");
    let consumed = text;
    println!("{text} {consumed}");
}


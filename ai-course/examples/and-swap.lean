namespace Course

/-- 由合取的左右投影，交換兩個合取項。證明項是一個值。 -/
theorem andSwap (p q : Prop) (h : p ∧ q) : q ∧ p :=
  And.intro (And.right h) (And.left h)

/-- 同一條定理，用策略組出同一個證明項。 -/
theorem andSwapTac (p q : Prop) (h : p ∧ q) : q ∧ p := by
  exact And.intro h.right h.left

end Course

#print axioms Course.andSwap
#print axioms Course.andSwapTac

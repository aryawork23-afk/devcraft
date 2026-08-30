import json
from collections import Counter, defaultdict
from pathlib import Path

gold_path = Path("test-data/messages_train.json")
pred_path = Path("output/my_predictions.json")

gold_rows = json.loads(gold_path.read_text(encoding="utf-8"))
pred_rows = json.loads(pred_path.read_text(encoding="utf-8"))

predictions = {
    row["id"]: row
    for row in pred_rows
}

field_hits = Counter()
field_totals = Counter()
domain_results = defaultdict(lambda: Counter())

examples = {
    "customer": [],
    "amount": [],
    "prior": [],
    "item_count": [],
    "quantity": [],
    "attributes": [],
    "date": [],
    "clarification": [],
}


def record(name, correct, domain):
    field_totals[name] += 1
    domain_results[domain][f"{name}_total"] += 1

    if correct:
        field_hits[name] += 1
        domain_results[domain][f"{name}_hit"] += 1


def add_example(category, row, gold_value, pred_value):
    if len(examples[category]) >= 5:
        return

    examples[category].append({
        "id": row["id"],
        "domain": row["domain"],
        "message": row["message"],
        "gold": gold_value,
        "predicted": pred_value,
    })


for row in gold_rows:
    message_id = row["id"]
    domain = row["domain"]
    gold = row["expected"]
    pred = predictions.get(message_id, {})

    customer_correct = gold["customer"] == pred.get("customer")
    record("customer", customer_correct, domain)

    if not customer_correct:
        add_example(
            "customer",
            row,
            gold["customer"],
            pred.get("customer"),
        )

    amount_correct = gold["amount"] == pred.get("amount")
    record("amount", amount_correct, domain)

    if not amount_correct:
        add_example(
            "amount",
            row,
            gold["amount"],
            pred.get("amount"),
        )

    prior_correct = (
        gold["references_prior_order"]
        == pred.get("references_prior_order")
    )
    record("prior", prior_correct, domain)

    if not prior_correct:
        add_example(
            "prior",
            row,
            gold["references_prior_order"],
            pred.get("references_prior_order"),
        )

    date_correct = gold["due_date"] == pred.get("due_date")
    record("date", date_correct, domain)

    if not date_correct:
        add_example(
            "date",
            row,
            gold["due_date"],
            pred.get("due_date"),
        )

    clarification_correct = (
        gold["needs_clarification"]
        == pred.get("needs_clarification")
    )
    record("clarification", clarification_correct, domain)

    if not clarification_correct:
        add_example(
            "clarification",
            row,
            gold["needs_clarification"],
            pred.get("needs_clarification"),
        )

    gold_items = gold.get("items", [])
    pred_items = pred.get("items", [])

    item_count_correct = len(gold_items) == len(pred_items)
    record("item_count", item_count_correct, domain)

    if not item_count_correct:
        add_example(
            "item_count",
            row,
            len(gold_items),
            len(pred_items),
        )

    for index, gold_item in enumerate(gold_items):
        if index >= len(pred_items):
            record("quantity", False, domain)
            record("attributes", False, domain)
            continue

        pred_item = pred_items[index]

        quantity_correct = (
            gold_item.get("quantity")
            == pred_item.get("quantity")
        )
        record("quantity", quantity_correct, domain)

        if not quantity_correct:
            add_example(
                "quantity",
                row,
                gold_item.get("quantity"),
                pred_item.get("quantity"),
            )

        attributes_correct = (
            gold_item.get("attributes", {})
            == pred_item.get("attributes", {})
        )
        record("attributes", attributes_correct, domain)

        if not attributes_correct:
            add_example(
                "attributes",
                row,
                gold_item.get("attributes", {}),
                pred_item.get("attributes", {}),
            )


print("\nOVERALL DIAGNOSTIC")
print("-" * 52)

for name in [
    "customer",
    "amount",
    "prior",
    "item_count",
    "quantity",
    "attributes",
    "date",
    "clarification",
]:
    hits = field_hits[name]
    total = field_totals[name]
    percentage = 100 * hits / total if total else 0

    print(
        f"{name:<18} {hits:>3}/{total:<3} "
        f"{percentage:>6.1f}%"
    )

print("\nRESULTS BY DOMAIN")
print("-" * 52)

for domain in ["tailor", "tiffin", "electrician", "baker"]:
    print(f"\n{domain.upper()}")

    for name in [
        "customer",
        "amount",
        "item_count",
        "quantity",
        "attributes",
        "date",
        "clarification",
    ]:
        hits = domain_results[domain][f"{name}_hit"]
        total = domain_results[domain][f"{name}_total"]
        percentage = 100 * hits / total if total else 0

        print(f"  {name:<16} {percentage:>6.1f}%")

print("\nFIRST FIVE FAILURES PER CATEGORY")
print("=" * 72)

for category, failures in examples.items():
    if not failures:
        continue

    print(f"\n### {category.upper()}")

    for failure in failures:
        print(
            f"\n{failure['id']} [{failure['domain']}]"
        )
        print(f"Message:   {failure['message']}")
        print(f"Gold:      {failure['gold']}")
        print(f"Predicted: {failure['predicted']}")
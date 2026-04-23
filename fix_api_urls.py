import os
import re

src = r"d:\Projects\Law Firm\legal-office-system\frontend\src"

# Match single-quoted strings containing ${API_BASE}/...
# e.g. '${API_BASE}/clients/' -> `${API_BASE}/clients/`
pattern = re.compile(r"'\$\{API_BASE\}/([^']*)'")

fixed = []
for root, dirs, files in os.walk(src):
    for fname in files:
        if not fname.endswith((".tsx", ".ts")):
            continue
        path = os.path.join(root, fname)
        with open(path, encoding="utf-8") as f:
            text = f.read()
        new_text = pattern.sub(r"`${API_BASE}/\1`", text)
        if new_text != text:
            with open(path, "w", encoding="utf-8") as f:
                f.write(new_text)
            fixed.append(fname)

print("Fixed files:", fixed)
print(f"Total: {len(fixed)} files")

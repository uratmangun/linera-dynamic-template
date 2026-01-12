---
description: Rename a file based on its content and context
---

I want you to rename the file located at: $1

1. Read the content of the file at "$1".
2. Analyze the code to understand its primary purpose, class name, component name, or main export.
3. Determine the most appropriate filename based on the project's existing naming conventions (e.g., kebab-case, PascalCase, matching the main component).
4. If the current name is different from the ideal name:
    - Get the sequential number by checking existing files in "$1" folder location that match the pattern (number-name.md)
    - Use the next available number (1, 2, 3, etc.) that hasn't been used yet
    - Analyze the file content to extract a meaningful name based on the primary topic, subject, or purpose
    - Rename the file from "$1" to "{number}-{name}.md" where {number} is the next available sequential number and {name} is derived from the content
   - Explain why you chose the new name.
5. If the current name is already correct, simply state that no change is needed.

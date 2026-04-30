#!/bin/bash

echo "=== TechTemp Documentation Link Validation ==="
echo ""

# Function to check if a file exists relative to base path
check_link() {
    local file_path="$1"
    local base_dir="$2"
    local full_path=""
    
    if [[ "$file_path" == ../* ]]; then
        # Parent directory reference
        full_path="$base_dir/../${file_path#../}"
    elif [[ "$file_path" == */* ]]; then
        # Subdirectory reference
        full_path="$base_dir/$file_path"
    else
        # Same directory reference
        full_path="$base_dir/$file_path"
    fi
    
    if [[ -f "$full_path" ]]; then
        echo "✅ $file_path"
    else
        echo "❌ $file_path (expected at: $full_path)"
    fi
}

# Check USER README links
echo "📄 Checking docs/USER/README.md links:"
base_dir="docs/USER"
grep -oE '\]\([^)]*\.md\)' "$base_dir/README.md" | sed 's/](\([^)]*\))/\1/' | while read link; do
    check_link "$link" "$base_dir"
done

echo ""
echo "📁 Checking docs/USER/guides/ links:"
find docs/USER/guides -name "*.md" | while read guide_file; do
    guide_dir=$(dirname "$guide_file")
    echo "  📄 $guide_file:"
    grep -oE '\]\([^)]*\.md\)' "$guide_file" | sed 's/](\([^)]*\))/\1/' | while read link; do
        echo -n "    "
        check_link "$link" "$guide_dir"
    done
done

echo ""
echo "=== Validation complete ==="
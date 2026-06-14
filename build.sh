#!/usr/bin/env bash
# GeoGenius build script
# Usage:
#   ./build.sh            → output to dist/index.html  (safe, non-destructive)
#   ./build.sh --inplace  → overwrite index.html directly (for release)
#
# How it works:
#   Reads src/topics/e1.js and e2.js, splits on @@SECTION markers, then injects
#   each section into index.html between the matching @@BUILD_START/END markers.

set -euo pipefail
cd "$(dirname "$0")"

INPLACE=0
[[ "${1:-}" == "--inplace" ]] && INPLACE=1

mkdir -p dist

python3 -c "
import sys, re, pathlib

root     = pathlib.Path('.')
src_html = root / 'index.html'
e1_src   = root / 'src' / 'topics' / 'e1.js'
e2_src   = root / 'src' / 'topics' / 'e2.js'
e3_src   = root / 'src' / 'topics' / 'e3.js'
f2_src   = root / 'src' / 'topics' / 'f2.js'
inplace  = $INPLACE

html = src_html.read_text('utf-8')
e1   = e1_src.read_text('utf-8')
e2   = e2_src.read_text('utf-8')
e3   = e3_src.read_text('utf-8')
f2   = f2_src.read_text('utf-8')

def extract_section(src, name):
    m = re.search(
        r'// @@SECTION:' + re.escape(name) + r'@@\n(.*?)(?=\n// @@SECTION:|\Z)',
        src, re.DOTALL)
    if not m:
        sys.exit(f'ERROR: section \"{name}\" not found')
    return m.group(1).rstrip('\n')

def replace_region(html, tag, content):
    pat = (r'([ \t]*// @@BUILD_START:' + re.escape(tag) + r'@@\n)'
           r'.*?'
           r'([ \t]*// @@BUILD_END:'   + re.escape(tag) + r'@@)')
    result, n = re.subn(pat, r'\g<1>' + content.replace('\\\\', '\\\\\\\\') + r'\n\g<2>',
                        html, flags=re.DOTALL)
    if n == 0:
        sys.exit(f'ERROR: region \"{tag}\" not found in index.html')
    print(f'  ✓ {tag}  ({content.count(chr(10))+1} lines)')
    return result

html = replace_region(html, 'e1-helpers', extract_section(e1, 'helpers'))
html = replace_region(html, 'e1-anims',   extract_section(e1, 'anims'))
html = replace_region(html, 'e2-helpers', extract_section(e2, 'helpers'))
html = replace_region(html, 'e2-anims',   extract_section(e2, 'anims'))
html = replace_region(html, 'e3-helpers', extract_section(e3, 'helpers'))
html = replace_region(html, 'e3-anims',   extract_section(e3, 'anims'))
html = replace_region(html, 'f2-helpers', extract_section(f2, 'helpers'))
html = replace_region(html, 'f2-anims',   extract_section(f2, 'anims'))

if inplace:
    src_html.write_text(html, 'utf-8')
    print(f'  → {src_html}  (in-place, {len(html)//1024} KB)')
else:
    out = root / 'dist' / 'index.html'
    out.write_text(html, 'utf-8')
    print(f'  → {out}  ({out.stat().st_size//1024} KB)')
"

echo ""
echo "src/ structure:"
find src/ -name "*.js" | sort | while read f; do
  printf "  %-35s  %d lines\n" "$f" "$(wc -l < "$f")"
done
echo ""
if [[ $INPLACE -eq 0 ]]; then
  echo "To verify:  python3 -m http.server 7789 --directory dist/"
else
  echo "index.html updated in-place."
fi

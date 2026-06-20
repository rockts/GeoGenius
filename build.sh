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
c3_src   = root / 'src' / 'topics' / 'c3.js'
c3b_src  = root / 'src' / 'topics' / 'c3b.js'
c5b_src  = root / 'src' / 'topics' / 'c5b.js'
g1_src   = root / 'src' / 'topics' / 'g1.js'
g2_src   = root / 'src' / 'topics' / 'g2.js'
f1_src   = root / 'src' / 'topics' / 'f1.js'
f2_src   = root / 'src' / 'topics' / 'f2.js'
f3_src   = root / 'src' / 'topics' / 'f3.js'
f4_src   = root / 'src' / 'topics' / 'f4.js'
f5_src   = root / 'src' / 'topics' / 'f5.js'
inplace  = $INPLACE

html = src_html.read_text('utf-8')
e1   = e1_src.read_text('utf-8')
e2   = e2_src.read_text('utf-8')
e3   = e3_src.read_text('utf-8')
c3   = c3_src.read_text('utf-8')
c3b  = c3b_src.read_text('utf-8')
c5b  = c5b_src.read_text('utf-8')
g1   = g1_src.read_text('utf-8')
g2   = g2_src.read_text('utf-8')
f1   = f1_src.read_text('utf-8')
f2   = f2_src.read_text('utf-8')
f3   = f3_src.read_text('utf-8')
f4   = f4_src.read_text('utf-8')
f5   = f5_src.read_text('utf-8')

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
html = replace_region(html, 'c3-helpers', extract_section(c3, 'helpers'))
html = replace_region(html, 'c3-anims',   extract_section(c3, 'anims'))
html = replace_region(html, 'c3b-helpers', extract_section(c3b, 'helpers'))
html = replace_region(html, 'c3b-anims',   extract_section(c3b, 'anims'))
html = replace_region(html, 'c5b-helpers', extract_section(c5b, 'helpers'))
html = replace_region(html, 'c5b-anims',   extract_section(c5b, 'anims'))
html = replace_region(html, 'g1-helpers',  extract_section(g1,  'helpers'))
html = replace_region(html, 'g1-anims',    extract_section(g1,  'anims'))
html = replace_region(html, 'g2-helpers',  extract_section(g2,  'helpers'))
html = replace_region(html, 'g2-anims',    extract_section(g2,  'anims'))
html = replace_region(html, 'f1-helpers', extract_section(f1, 'helpers'))
html = replace_region(html, 'f1-anims',   extract_section(f1, 'anims'))
html = replace_region(html, 'f2-helpers', extract_section(f2, 'helpers'))
html = replace_region(html, 'f2-anims',   extract_section(f2, 'anims'))
html = replace_region(html, 'f3-helpers', extract_section(f3, 'helpers'))
html = replace_region(html, 'f3-anims',   extract_section(f3, 'anims'))
html = replace_region(html, 'f4-helpers', extract_section(f4, 'helpers'))
html = replace_region(html, 'f4-anims',   extract_section(f4, 'anims'))
html = replace_region(html, 'f5-helpers', extract_section(f5, 'helpers'))
html = replace_region(html, 'f5-anims',   extract_section(f5, 'anims'))

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

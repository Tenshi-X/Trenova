import re 
with open(p, encoding='utf-8') as f: t = f.read() 
old = "'Cache-Control': 'public, s-maxage=5, stale-while-revalidate: 3'," 
m = re.search(re.escape(old) + r'.*$', t) 
if m: 
    print('cut done') 
    print('no matching tail found') 

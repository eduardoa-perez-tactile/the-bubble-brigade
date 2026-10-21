#!/usr/bin/env python3
"""Read-only audit of pre-reconstruction bytes; writes only a new phase report."""
from pathlib import Path
import json,hashlib
root=Path(__file__).resolve().parents[2]
base=json.loads((root/'docs/concept-reconstruction/preservation-baseline.json').read_text())
report={'baselineHead':base['baselineHead'],'groups':{},'ok':True}
for group,files in base['sha256'].items():
 differences=[]
 for name,expected in files.items():
  file=root/name
  actual=hashlib.sha256(file.read_bytes()).hexdigest() if file.is_file() else None
  if actual!=expected:differences.append({'path':name,'expected':expected,'actual':actual})
 report['groups'][group]={'checked':len(files),'unchanged':len(files)-len(differences),'mismatches':differences}
 if differences:report['ok']=False
(root/'docs/concept-reconstruction/preservation-final.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'ok':report['ok'],'groups':{k:v['unchanged'] for k,v in report['groups'].items()}}))
raise SystemExit(0 if report['ok'] else 1)

import subprocess,sys,json
ids=[21192498696,21192498693,21192498690,21192498689,21192497443,21192497214,21192497070,21192496930,21192496816,21192496687,21192496539,21192496407]
for id in ids:
    p=subprocess.run(['gh','run','view',str(id),'--repo','Mattywhewell/ai-mall','--json','databaseId,workflowName,conclusion,htmlUrl'], capture_output=True, text=True)
    if p.returncode!=0:
        print('ERR',id,p.stderr)
    else:
        o=json.loads(p.stdout)
        print(o['workflowName'], o.get('conclusion',''), o.get('databaseId'), o.get('htmlUrl'))

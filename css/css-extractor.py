cssfile=open('temp.css','r',encoding='utf8')
htmlfile=open('temp.html','r',encoding='utf8')
classes=set()
for line in htmlfile.readlines():
    class_occ = [i for i in range(len(line)) if line.startswith('class=', i)]
    for i in class_occ:
        tmp=line[i+7:]
        class_names=tmp[0:tmp.find('\"')].split()
        for class_name in class_names:
            classes.add(class_name)
print(classes)
classes.add('body')

new_cssflile=open("stylesheet.css",'w',encoding='utf8')
adding=False
brackets=[]
media=False
for line in cssfile.readlines():
    if line.startswith('@media'):
        media=True
    ind=0
    if media and '{' in line:
            brackets.append('{')
    if media and '}' in line:
        brackets.pop()
        if brackets==[]:
            media=False
    if media:
        continue
    for class_name in classes:
        ind=line.find('.'+class_name)
        if ind==line.find('.') and ind!=-1:
            if line[ind+len(class_name)+1] in [' ','.',':']:
                adding=True
                break
    ind=max(ind,0)
    if adding:
        new_cssflile.write(line[ind:])
        if "}" in line:
            adding=False
            new_cssflile.write('\n')
   

cssfile.close()
htmlfile.close()
new_cssflile.close()
   
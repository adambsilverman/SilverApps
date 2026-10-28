import re
s=open('src.html').read()
libs={'VEXFLOW':'node_modules/vexflow/build/cjs/vexflow-bravura.js','MQTT':'node_modules/mqtt/dist/mqtt.min.js','QRCODE':'node_modules/qrcode-generator/dist/qrcode.js'}
for k,p in libs.items():
    js=open(p).read()
    js=re.sub(r'//# sourceMappingURL=.*','',js)
    js=js.replace('</script','<\\/script').replace('<!--','<\\!--')
    s=s.replace('/*@@%s@@*/'%k, js)
import base64
fonts=[('Young Serif',400,'node_modules/@fontsource/young-serif/files/young-serif-latin-400-normal.woff2'),
       ('Atkinson Hyperlegible',400,'node_modules/@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-normal.woff2'),
       ('Atkinson Hyperlegible',700,'node_modules/@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-700-normal.woff2'),
       ('Martian Mono',700,'node_modules/@fontsource/martian-mono/files/martian-mono-latin-700-normal.woff2')]
ff=''.join("@font-face{font-family:'%s';font-style:normal;font-weight:%d;font-display:swap;src:url(data:font/woff2;base64,%s) format('woff2')}\n"%(n,w,base64.b64encode(open(p,'rb').read()).decode()) for n,w,p in fonts)
s=s.replace('/*@@FONTS@@*/',ff)
open('chord-lab-live.html','w').write(s)
print(len(s))

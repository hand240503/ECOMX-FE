const ts = require('typescript');
const fs = require('fs');
const f = 'src/pages/payment/VnpayCallbackPage.tsx';
const src = fs.readFileSync(f, 'utf8');
const sf = ts.createSourceFile(f, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const diags = sf.parseDiagnostics || [];
for (const d of diags.slice(0, 8)) {
  const pos = sf.getLineAndCharacterOfPosition(d.start);
  console.log(`L${pos.line+1}:C${pos.character+1}  ${ts.flattenDiagnosticMessageText(d.messageText,'\n')}`);
}
console.log('total parse diags:', diags.length);

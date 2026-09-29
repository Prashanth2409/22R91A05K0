import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
const files=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const rules=[['hard-coded Razorpay key',/\brzp_(?:test|live)_[A-Za-z0-9]{12,}\b/],['private key',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],['GitHub token',/\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/],['AWS key',/\bAKIA[A-Z0-9]{16}\b/],['database password URL',/postgres(?:ql)?:\/\/[^\s:/]+:[^\s@]+@/],['hard-coded provider credential',/(?:RAZORPAY_KEY_SECRET|WABA_ACCESS_TOKEN|WABA_APP_SECRET)\s*[:=]\s*['"][^'"\r\n]{16,}['"]/]];
let issues=0,checked=0;
for(const file of files){if(/\.(png|jpe?g|webp|zip|woff2?)$/i.test(file))continue;let text=await readFile(file,'utf8');if(file==='tests/commerce.test.mjs')text=text.replace("RAZORPAY_KEY_SECRET:"+"'test-fixture-only'","RAZORPAY_KEY_SECRET:''");checked++;for(const [name,pattern] of rules){if(pattern.test(text)){console.error(`${file}: possible ${name} (value withheld)`);issues++;}}}
if(issues)process.exitCode=1;else console.log(`Secret-pattern scan passed: ${checked} repository files; no credential values printed. Manual review still required.`);

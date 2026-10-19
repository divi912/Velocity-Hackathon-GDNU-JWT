import { useRef, useState } from 'react';
import { LockKeyhole, UnlockKeyhole } from 'lucide-react';
import { encryptToken, decryptToken } from '../lib/jwe';
import { signToken, verifyToken, parseToken, ISSUER, AUDIENCE } from '../lib/jwt';

export function EncryptionLab() {
  const [envelope, setEnvelope] = useState('');
  const [opened, setOpened] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Try a real encrypted envelope.');
  const generation = useRef(0);

  async function run(action: 'encrypt' | 'decrypt') {
    const current = ++generation.current;
    setBusy(true);
    try {
      if (action === 'encrypt') {
        const now = Math.floor(Date.now() / 1000);
        const signed = await signToken({ sub: 'user_42', role: 'student', iss: ISSUER, aud: AUDIENCE, iat: now, exp: now + 300 });
        const wrapped = await encryptToken(signed);
        if (current !== generation.current) return;
        setEnvelope(wrapped); setOpened(false); setMessage('Locked. The signed token is now hidden inside the envelope.');
      } else {
        const signed = await decryptToken(envelope);
        const check = await verifyToken(signed);
        if (current !== generation.current) return;
        setOpened(true);
        setMessage(`Opened: sub = ${parseToken(signed).payload.sub}. Signature ${check.checks.find(item => item.id === 'signature')?.status === 'pass' ? 'verified' : 'failed'}.`);
      }
    } catch (error) { if (current === generation.current) setMessage(error instanceof Error ? error.message : 'The envelope could not be opened.'); }
    finally { if (current === generation.current) setBusy(false); }
  }

  return <div className="mt-6 border-t border-neutral-300 pt-5">
    <div className="flex flex-wrap gap-2">
      <button disabled={busy} type="button" className="button-base bg-black text-white hover:bg-white hover:text-black" onClick={() => void run('encrypt')}><LockKeyhole size={14} />Encrypt token</button>
      <button disabled={busy || !envelope} type="button" className="button-base hover:bg-black hover:text-white" onClick={() => void run('decrypt')}><UnlockKeyhole size={14} />Decrypt</button>
    </div>
    <p aria-live="polite" className="mt-3 text-[10px] leading-5">{busy ? 'Working with real AES-GCM…' : message}</p>
    {envelope && <details className="mt-3 text-[10px]"><summary className="min-h-8 cursor-pointer underline underline-offset-4">Inspect {opened ? 'the opened' : 'the five-part'} envelope</summary><p className="my-2 leading-5 text-neutral-500">header · empty key part · random IV · ciphertext · check tag</p><code className="block max-h-32 overflow-y-auto border border-neutral-300 p-3 leading-5 break-all">{envelope}</code><p className="mt-2 text-neutral-500">Public demo key. Production keys stay on a server.</p></details>}
  </div>;
}

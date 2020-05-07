import * as X509 from '@ampretia/x509';

export async function loopIterator(iterator) {
  const items = [];
  let res;
  do {
    res = await iterator.next();
    if (res.value) {
      // if not a getHistoryForKey iterator then key is contained in res.value.key
      items.push(JSON.parse(res.value.value.toString('utf8')));
    } // check to see if we have reached then end

    if (res.done) {
      // explicitly close the iterator
      await iterator.close();
    }
  } while (!res.done);

  return items;
}

export function log(args, level = 'info') {
  const logFn = level === 'debug' ? console.debug : console.log;
  if (process.env.NODE_ENV === 'production' && level === 'debug') return;
  logFn('='.repeat(10), args.join(', '), '='.repeat(10));
}

export function lintParam(param) {
  try {
    return JSON.parse(param);
  } catch (err) {
    console.error(err);
    return param;
  }
}

export function lintKeys(keys) {
  if (!Array.isArray(keys)) throw new Error('Input is not Array');
  return keys.filter(k => !!k && k !== 'null').map(k => k.toString());
}

function normalizeX509(raw) {
  const regex = /(-----\s*BEGIN ?[^-]+?-----)([\s\S]*)(-----\s*END ?[^-]+?-----)/;
  let matches = raw.match(regex);
  if (!matches || matches.length !== 4) {
    throw new Error('Failed to find start line or end line of the certificate.');
  }

  // remove the first element that is the whole match
  matches.shift();
  // remove LF or CR
  matches = matches.map((element) => {
    return element.trim();
  });

  // make sure '-----BEGIN CERTIFICATE-----' and '-----END CERTIFICATE-----' are in their own lines
  // and that it ends in a new line
  return matches.join('\n') + '\n';
}

export function constructCallerInfo(stub) {
  const caller = stub.getCreator();
  const certBytes = caller.getIdBytes().toBuffer();
  const normalizedCert = normalizeX509(certBytes.toString());
  const cert = X509.parseCert(normalizedCert);
  return {
    mspid: caller.getMspid(),
    id: cert.serial.toUpperCase()
  };
}

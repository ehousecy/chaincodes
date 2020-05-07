import {
  loopIterator,
  log,
  lintParam,
  lintKeys, constructCallerInfo,
} from '../utils';

const xCertPem = `-----BEGIN CERTIFICATE-----
MIICKTCCAdCgAwIBAgIRALcx414f8lOovyItmkif2mcwCgYIKoZIzj0EAwIwczEL
MAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNhbiBG
cmFuY2lzY28xGTAXBgNVBAoTEG9yZzEuZXhhbXBsZS5jb20xHDAaBgNVBAMTE2Nh
Lm9yZzEuZXhhbXBsZS5jb20wHhcNMjAwMTE3MDI0MTAwWhcNMzAwMTE0MDI0MTAw
WjBrMQswCQYDVQQGEwJVUzETMBEGA1UECBMKQ2FsaWZvcm5pYTEWMBQGA1UEBxMN
U2FuIEZyYW5jaXNjbzEOMAwGA1UECxMFYWRtaW4xHzAdBgNVBAMMFkFkbWluQG9y
ZzEuZXhhbXBsZS5jb20wWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAATL8atuyK04
9IfmfdNttf80nlGEjv034G9BHO0iB3Xk4rF0lhfodC8nMJs5AGG41SWHCpU7hOAQ
0l1/Sg+/3E9no00wSzAOBgNVHQ8BAf8EBAMCB4AwDAYDVR0TAQH/BAIwADArBgNV
HSMEJDAigCA2eb+vs9vmmBuS7fwfUzS5OKdBiQLBbbUGDTXyyvQzBTAKBggqhkjO
PQQDAgNHADBEAiBu7dZbUnb6OYVP34eCzdZj8XMkS/g+8tShnX3xKQbluwIgc5lb
a5Il1lGg+ztA6OOAGluThUrpyo54XZZFBIp6eAA=
-----END CERTIFICATE-----`;

const CertPem = `-----BEGIN CERTIFICATE-----
MIICNzCCAd2gAwIBAgIUdNK/27eKoJUgvXQ346Vik39U164wCgYIKoZIzj0EAwIw
czELMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNh
biBGcmFuY2lzY28xGTAXBgNVBAoTEG9yZzEuZXhhbXBsZS5jb20xHDAaBgNVBAMT
E2NhLm9yZzEuZXhhbXBsZS5jb20wHhcNMjAwMjA4MDE0ODAwWhcNMjEwMjA3MDE1
MzAwWjAhMQ8wDQYDVQQLEwZjbGllbnQxDjAMBgNVBAMTBXRlc3QyMFkwEwYHKoZI
zj0CAQYIKoZIzj0DAQcDQgAE7MFyqOJMBMVi65rqBaSMIOaSV0PXY2DQohmVIhQX
kFWlUupkSeIyNLvdn7C3I5PJndyisRXNJr3UCMIldDJk66OBoDCBnTAOBgNVHQ8B
Af8EBAMCB4AwDAYDVR0TAQH/BAIwADAdBgNVHQ4EFgQUds9d3DP644spWJKfUlxS
/gj7LaAwKwYDVR0jBCQwIoAgNnm/r7Pb5pgbku38H1M0uTinQYkCwW21Bg018sr0
MwUwMQYIKgMEBQYHCAEEJXsiYXR0cnMiOnsiaWRjYXJkIjoiMWHnmq5i5Y2hY+S4
mDIifX0wCgYIKoZIzj0EAwIDSAAwRQIhAJgnTssX6xgjJg3xRDwgKWqjcGufEeQH
dn+liEtMAhIOAiBvWCtJ5Cr6luQ1frpct0Fv+o8ONe7AS65/LWcCVOKZ+Q==
-----END CERTIFICATE-----`

const ResultIdentity = 'B731E35E1FF253A8BF222D9A489FDA67';
describe('utils', () => {
  test('loopIterator: should parse value to object', async () => {
    const mockIterator = {
      next: () => ({
        value: {
          value: '{}',
        },
        done: true,
      }),
      close: async () => null,
    };
    const tmp = JSON.parse;
    JSON.parse = jest.fn().mockImplementation(i => tmp(i));
    await loopIterator(mockIterator);
    expect(JSON.parse).toBeCalled();
    JSON.parse = tmp;
  }, 1000);

  test('log: should not log debug in production mode', () => {
    const debugBackup = console.debug;
    console.debug = jest.fn();
    log(['hello world'], 'debug');
    expect(console.debug).toBeCalled();
    const envBackup = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    log(['hello world'], 'debug');
    console.debug = jest.fn();
    expect(console.debug).not.toBeCalled();
    console.debug = debugBackup;
    process.env.NODE_ENV = envBackup;
  });

  test('lintParam: should return object if parsable', () => {
    expect(lintParam('{}')).toEqual({});
  });

  test('lintParam: should return input if can not parsable', () => {
    expect(lintParam(123)).toEqual(123);
  });

  test('lintKeys: should throw error if input is not an Array instance', () => {
    expect(() => lintKeys(123)).toThrow(/not Array/gi);
  });

  test('lintKeys: should filter null value or null string', () => {
    expect(lintKeys(['abc'])).toEqual(['abc']);
    expect(lintKeys(['abc', 'null'])).toEqual(['abc']);
    expect(lintKeys(['abc', 'null', ''])).toEqual(['abc']);
  });

  test('lintKeys: convert all keys to string', () => {
    expect(lintKeys([123, true])).toEqual(['123', 'true']);
  });

  test('constructCallerInfo', () => {
    const stub = {
      getCreator: () => ({
        getIdBytes: () => ({toBuffer: () => Buffer.from(CertPem)}),
        getMspid: () => 'msp',
      }),
    };
    expect(constructCallerInfo(stub).id).toEqual(ResultIdentity);
  });
});

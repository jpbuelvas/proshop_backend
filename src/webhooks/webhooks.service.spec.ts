import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { WebhooksService } from './webhooks.service';

const SECRET = 'test-events-secret';

function signedBody() {
  const body: any = {
    timestamp: '1700000000',
    signature: { properties: ['transaction.id', 'transaction.status'] },
    data: { transaction: { id: 'txn-1', status: 'APPROVED' } },
  };
  const concatenated = 'txn-1' + 'APPROVED' + body.timestamp + SECRET;
  const checksum = crypto.createHash('sha256').update(concatenated).digest('hex');
  return { body, checksum };
}

describe('WebhooksService.validateWompiSignature', () => {
  let service: WebhooksService;

  beforeEach(() => {
    const config = { get: jest.fn().mockReturnValue(SECRET) } as unknown as ConfigService;
    // Solo se prueba la validación de firma (función pura); las demás
    // dependencias no se usan en este método.
    service = new WebhooksService(config, {} as any, {} as any, {} as any, {} as any);
  });

  it('acepta un checksum calculado correctamente con el secreto configurado', () => {
    const { body, checksum } = signedBody();
    expect(service.validateWompiSignature(body, checksum)).toBe(true);
  });

  it('rechaza el checksum si el payload fue alterado (integridad)', () => {
    const { body, checksum } = signedBody();
    body.data.transaction.status = 'DECLINED'; // alguien cambió el resultado sin recalcular la firma

    expect(service.validateWompiSignature(body, checksum)).toBe(false);
  });

  it('rechaza un checksum arbitrario que no coincide', () => {
    const { body } = signedBody();
    expect(service.validateWompiSignature(body, 'checksum-invalido')).toBe(false);
  });

  it('rechaza un body con forma inesperada en vez de lanzar una excepción', () => {
    expect(service.validateWompiSignature({}, 'cualquiera')).toBe(false);
    expect(service.validateWompiSignature(null, 'cualquiera')).toBe(false);
  });
});

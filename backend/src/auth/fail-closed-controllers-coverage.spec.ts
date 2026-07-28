import { RolesController } from './roles.controller';
import { AssetFieldsController } from '../assets/asset-fields.controller';
import { AssetSchedulesController } from '../assets/asset-schedules.controller';
import { SyncController } from '../sync/sync.controller';
import { FailureCodesController } from '../work-orders/failure-codes.controller';
import { TagsController } from '../tags/tags.controller';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './decorators/permissions.decorator';
import { IS_ALLOW_ANY_ROLE_KEY } from './decorators/allow-any-role.decorator';

describe('Fail-Closed Controller Coverage Verification', () => {
  const reflector = new Reflector();

  const controllers = [
    { name: 'RolesController', instance: RolesController },
    { name: 'AssetFieldsController', instance: AssetFieldsController },
    { name: 'AssetSchedulesController', instance: AssetSchedulesController },
    { name: 'SyncController', instance: SyncController },
    { name: 'FailureCodesController', instance: FailureCodesController },
    { name: 'TagsController', instance: TagsController },
  ];

  controllers.forEach(({ name, instance }) => {
    it(`${name} should have authorization metadata on every handler method`, () => {
      const prototype = instance.prototype;
      const methodNames = Object.getOwnPropertyNames(prototype).filter(
        (m) => m !== 'constructor' && typeof prototype[m] === 'function',
      );

      expect(methodNames.length).toBeGreaterThan(0);

      methodNames.forEach((method) => {
        const handler = prototype[method];
        const requiredPermissions = reflector.get<string[]>(
          PERMISSIONS_KEY,
          handler,
        );
        const allowAnyRole = reflector.get<boolean>(
          IS_ALLOW_ANY_ROLE_KEY,
          handler,
        );

        const isDecorated =
          (requiredPermissions && requiredPermissions.length > 0) ||
          allowAnyRole === true;

        expect(isDecorated).toBe(true);
      });
    });
  });
});

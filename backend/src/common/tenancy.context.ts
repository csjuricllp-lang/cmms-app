import { AsyncLocalStorage } from 'async_hooks';
import { Injectable, Scope } from '@nestjs/common';

export interface TenancyStore {
  organizationId: string;
  userId: string;
  userOrgId: string;
  role: string;
  roleName?: string;
  teamIds: string[];
  locationIds: string[]; // Assigned sites for LBAC
  permissions: string[];
}

@Injectable({ scope: Scope.DEFAULT })
export class TenancyContext {
  private static readonly storage = new AsyncLocalStorage<TenancyStore>();

  static run(store: TenancyStore, callback: () => void) {
    this.storage.run(store, callback);
  }

  static runAsync<T>(
    store: TenancyStore,
    callback: () => Promise<T>,
  ): Promise<T> {
    return this.storage.run(store, callback);
  }

  static get organizationId(): string {
    return this.storage.getStore()?.organizationId!;
  }

  static get userId(): string {
    return this.storage.getStore()?.userId!;
  }

  static get userOrgId(): string {
    return this.storage.getStore()?.userOrgId!;
  }

  static get role(): string {
    return this.storage.getStore()?.role!;
  }

  static get roleName(): string {
    return this.storage.getStore()?.roleName || '';
  }

  static get teamIds(): string[] {
    return this.storage.getStore()?.teamIds || [];
  }

  static get locationIds(): string[] {
    return this.storage.getStore()?.locationIds || [];
  }

  static get permissions(): string[] {
    return this.storage.getStore()?.permissions || [];
  }
}

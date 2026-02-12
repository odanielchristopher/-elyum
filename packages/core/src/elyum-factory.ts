import { ElyumContainer } from './di/container.di';
import { ReflectDependencyResolver } from './di/reflect-dependency-resolver.di';
import { ReflectMetadataReader } from './di/reflect-metadata-reader.di';

export class ElyumFactory {
  static createRoot() {
    const metadataReader = new ReflectMetadataReader();
    const resolver = new ReflectDependencyResolver(metadataReader);
    return new ElyumContainer(resolver);
  }

  static fork(parent: ElyumContainer) {
    const metadataReader = new ReflectMetadataReader();
    const resolver = new ReflectDependencyResolver(metadataReader);
    return new ElyumContainer(resolver, parent);
  }
}

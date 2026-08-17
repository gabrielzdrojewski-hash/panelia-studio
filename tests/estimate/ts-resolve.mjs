// Minimalny hook resolvera ESM: bezrozszerzeniowe importy względne (./x, ../x) mapuje na .ts.
// Umożliwia uruchamianie testów na źródłach TS przez natywne type-stripping Node 24,
// bez dodawania zależności (tsx/ts-node/esbuild).
export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (
      err?.code === 'ERR_MODULE_NOT_FOUND' &&
      (specifier.startsWith('./') || specifier.startsWith('../')) &&
      !/\.\w+$/.test(specifier)
    ) {
      return nextResolve(specifier + '.ts', context);
    }
    throw err;
  }
}

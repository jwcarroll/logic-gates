export function reportGraphErrors(errors?: string[]) {
  if (!errors || !errors.length) return
  const message = `Graph errors: ${errors.join('; ')}`
  // eslint-disable-next-line no-console
  console.warn(message)
  if (typeof window !== 'undefined') {
    ;(window as any).__LAST_GRAPH_ERRORS__ = errors
  }
}

export function reportImportError(errors?: string[]) {
  if (!errors || !errors.length) return
  const message = `Import error: ${errors.join('; ')}`
  // eslint-disable-next-line no-console
  console.warn(message)
  if (typeof window !== 'undefined') {
    ;(window as any).__LAST_IMPORT_ERRORS__ = errors
  }
}

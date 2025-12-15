export function reportGraphErrors(errors?: string[]) {
  if (!errors || !errors.length) return
  const message = `Graph errors: ${errors.join('; ')}`
  console.warn(message)
  if (typeof window !== 'undefined') {
    ;(window as Window & { __LAST_GRAPH_ERRORS__?: string[] }).__LAST_GRAPH_ERRORS__ = errors
  }
}

export function reportImportError(errors?: string[]) {
  if (!errors || !errors.length) return
  const message = `Import error: ${errors.join('; ')}`
  console.warn(message)
  if (typeof window !== 'undefined') {
    ;(window as Window & { __LAST_IMPORT_ERRORS__?: string[] }).__LAST_IMPORT_ERRORS__ = errors
  }
}

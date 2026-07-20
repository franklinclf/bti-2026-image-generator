// Deriva um nome legivel a partir do nome do arquivo.
// Ex.: "Ana-Maria_Silva.jpg" -> "Ana Maria Silva".
export function parseNameFromFile(fileName: string): string {
  const semExt = fileName.replace(/\.[^./\\]+$/, ''); // remove extensao
  return semExt
    .replace(/[_-]+/g, ' ') // _ e - viram espaco
    .replace(/\s+/g, ' ') // colapsa espacos
    .trim()
    .toLowerCase()
    .replace(/(^|\s)\p{L}/gu, (m) => m.toUpperCase()); // Title Case (unicode)
}

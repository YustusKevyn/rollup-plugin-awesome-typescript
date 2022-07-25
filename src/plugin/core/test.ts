import {
  Path,
  Program,
  SourceFile,
  TypeChecker,
  // @ts-ignore
  getDirectoryPath,
  // @ts-ignore
  mapDefined,
  // @ts-ignore
  getSourceFileOfNode,
  // @ts-ignore
  toPath,
  isStringLiteral,
  Symbol,
  StringLiteralLike
} from "typescript";

type GetCanonicalFileName = (fileName: string) => string;

/**
 * Gets the referenced files for a file from the program with values for the keys as referenced file's path to be true
 */
export function getReferencedFiles(
  program: Program,
  sourceFile: SourceFile,
  getCanonicalFileName: GetCanonicalFileName
): Set<Path> | undefined {
  let referencedFiles: Set<Path> | undefined;

  // We need to use a set here since the code can contain the same import twice,
  // but that will only be one dependency.
  // To avoid invernal conversion, the key of the referencedFiles map must be of type Path

  // @ts-ignore
  if (sourceFile.imports && sourceFile.imports.length > 0) {
    const checker: TypeChecker = program.getTypeChecker();
    // @ts-ignore
    for (const importName of sourceFile.imports) {
      const declarationSourceFilePaths = getReferencedFilesFromImportLiteral(
        checker,
        importName
      );
      declarationSourceFilePaths?.forEach(addReferencedFile);
    }
  }

  // @ts-ignore
  const sourceFileDirectory = getDirectoryPath(sourceFile.resolvedPath);
  // Handle triple slash references
  if (sourceFile.referencedFiles && sourceFile.referencedFiles.length > 0) {
    for (const referencedFile of sourceFile.referencedFiles) {
      const referencedPath = getReferencedFileFromFileName(
        program,
        referencedFile.fileName,
        sourceFileDirectory,
        getCanonicalFileName
      );
      addReferencedFile(referencedPath);
    }
  }

  // Handle type reference directives
  // @ts-ignore
  if (sourceFile.resolvedTypeReferenceDirectiveNames) {
    // @ts-ignore
    sourceFile.resolvedTypeReferenceDirectiveNames.forEach(
      (resolvedTypeReferenceDirective: any) => {
        if (!resolvedTypeReferenceDirective) {
          return;
        }

        const fileName = resolvedTypeReferenceDirective.resolvedFileName!; // TODO: GH#18217
        const typeFilePath = getReferencedFileFromFileName(
          program,
          fileName,
          sourceFileDirectory,
          getCanonicalFileName
        );
        addReferencedFile(typeFilePath);
      }
    );
  }

  // Add module augmentation as references
  // @ts-ignore
  if (sourceFile.moduleAugmentations.length) {
    const checker = program.getTypeChecker();
    // @ts-ignore
    for (const moduleName of sourceFile.moduleAugmentations) {
      if (!isStringLiteral(moduleName)) continue;
      const symbol = checker.getSymbolAtLocation(moduleName);
      if (!symbol) continue;

      // Add any file other than our own as reference
      addReferenceFromAmbientModule(symbol);
    }
  }

  // From ambient modules
  for (const ambientModule of program.getTypeChecker().getAmbientModules()) {
    if (ambientModule.declarations && ambientModule.declarations.length > 1) {
      addReferenceFromAmbientModule(ambientModule);
    }
  }

  return referencedFiles;

  function addReferenceFromAmbientModule(symbol: Symbol) {
    if (!symbol.declarations) {
      return;
    }
    // Add any file other than our own as reference
    for (const declaration of symbol.declarations) {
      const declarationSourceFile = getSourceFileOfNode(declaration);
      if (declarationSourceFile && declarationSourceFile !== sourceFile) {
        addReferencedFile(declarationSourceFile.resolvedPath);
      }
    }
  }

  function addReferencedFile(referencedPath: Path) {
    (referencedFiles || (referencedFiles = new Set())).add(referencedPath);
  }
}

/**
 * Compute the hash to store the shape of the file
 */
export type ComputeHash = ((data: string) => string) | undefined;

function getReferencedFilesFromImportedModuleSymbol(symbol: Symbol): Path[] {
  return mapDefined(
    symbol.declarations,
    // @ts-ignore
    (declaration) => getSourceFileOfNode(declaration)?.resolvedPath
  );
}

/**
 * Get the module source file and all augmenting files from the import name node from file
 */
function getReferencedFilesFromImportLiteral(
  checker: TypeChecker,
  importName: StringLiteralLike
): Path[] | undefined {
  const symbol = checker.getSymbolAtLocation(importName);
  return symbol && getReferencedFilesFromImportedModuleSymbol(symbol);
}

/**
 * Gets the path to reference file from file name, it could be resolvedPath if present otherwise path
 */
function getReferencedFileFromFileName(
  program: Program,
  fileName: string,
  sourceFileDirectory: Path,
  getCanonicalFileName: GetCanonicalFileName
): Path {
  return toPath(
    // @ts-ignore
    program.getProjectReferenceRedirect(fileName) || fileName,
    sourceFileDirectory,
    getCanonicalFileName
  );
}

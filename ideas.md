On every cycle:
Create an empty set of changed, processed and checked files

1. Update watched files
   - Remove dead files from program
   - Remember watched file changes
2. Resolve ids via resolver
3. Transform code
   1. Remember transformed files
   2. Update (or create) source file (use createSourceFile and updateSourceFile)
      - Check implementation of updateLanguageServiceSourceFile (service.ts)
   3. Update (or create) program
      - Check implementation of synchronizeHostData (service.ts)
   4. Get emit output (using program.emit)
      - Do not save output
      - Print diagnostics
4. Generate bundle
   1. Processe watched and not yet transformed files
      - Update source file (updateSourceFile)
      - Update program
   2. Typecheck dependants of all processed files (that haven't been checked before)
   3. Add all dependants to watched files
   4. Emit declarations and declaration maps

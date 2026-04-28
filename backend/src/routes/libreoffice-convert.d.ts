declare module 'libreoffice-convert' {
    function convert(
      document: Buffer,
      format: string,
      filter: string | undefined,
      callback: (err: Error | null, result: Buffer) => void
    ): void;
    export = { convert };
  }
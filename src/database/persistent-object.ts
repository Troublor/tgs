export default class PersistentObject<T> {
  static async new<T>(
    save: (value: T) => Promise<void>,
    load: () => Promise<T>,
  ): Promise<PersistentObject<T>> {
    const v = await load();
    return new PersistentObject<T>(save, load, v);
  }

  constructor(
    private readonly save: (value: T) => Promise<void> | void,
    private readonly load: () => Promise<T> | T,
    private cache: T,
  ) {}

  get(): T;
  get(opt: { fetch: false }): T;
  async get(opt: { fetch: true }): Promise<T>;
  get(
    opts: {
      fetch: boolean;
    } = { fetch: false },
  ): T | Promise<T> {
    if (opts.fetch) {
      return new Promise(async (resolve, reject) => {
        try {
          const v = await this.load();
          this.cache = v;
          resolve(v);
        } catch (e) {
          reject(e);
        }
      });
    } else {
      return this.cache;
    }
  }

  set(value: T): Promise<void> | void {
    this.cache = value;
    return this.save(value);
  }
}

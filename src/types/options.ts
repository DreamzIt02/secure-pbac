export interface IOptions<T> {
  readonly value: T;
}

export class Options<T> implements IOptions<T> {
  public readonly value: T;

  constructor(value: T) {
    this.value = value;
  }
}

export interface IOptionsAccessor<T> {
  get(): T;
}

export class OptionsAccessor<T> implements IOptionsAccessor<T> {
  private readonly options: IOptions<T>;

  constructor(options: IOptions<T>) {
    this.options = options;
  }

  get(): T {
    return this.options.value;
  }
}


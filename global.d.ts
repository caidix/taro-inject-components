declare type SimpleValueType = string | number | boolean;
declare interface ValueEnum {
  name?: string;
  title?: string;
  value: SimpleValueType;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      /** 航司小写 */
      AIRLINE?: string;
      /** 航司大写 */
      AIRLINE_LARGE?: string;
      /** 环境变量 */
      ENV?: string;
    }
  }
}

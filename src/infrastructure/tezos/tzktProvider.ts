import axios from 'axios';

export interface BigMapValue {
  keyHash: string;
  keyString: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
}

export class TzktProvider {
  constructor(tzKtApiUrl: string) {
    this._tzKtApiUrl = tzKtApiUrl;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getStorage<T = any>(
    contractAddress: string
  ): Promise<T> {
    const response = await axios.get<T>(
      `${this._tzKtApiUrl}/contracts/${contractAddress}/storage`
    );
    return response.data;
  }

  private _tzKtApiUrl: string;
}

export function createTzKt(tzKtApiUrl: string): TzktProvider {
  return new TzktProvider(tzKtApiUrl);
}

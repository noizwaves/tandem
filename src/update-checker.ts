import {AxiosInstance} from 'axios';

export class UpdateChecker {

  constructor(private axios: AxiosInstance, private currentVersion: string) {
  }

  isUpdateAvailable(): Promise<boolean> {
    return this.axios.get(`https://tandem-nuts.cfapps.io/update/macos/${this.currentVersion}`)
      .then(response => {
        return response.status === 200;
      }, () => {
        return false;
      });
  }
}

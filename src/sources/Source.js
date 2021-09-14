import BLHELI_EEPROM from './Blheli/eeprom';
import BLUEJAY_EEPROM from './Bluejay/eeprom';
import AM32_EEPROM from './AM32/eeprom';

import {
  FileNotAvailableError,
  LocalDataNotAvailableError,
} from '../utils/Errors';

class Source {
  constructor(name, platform, versions, escs, eeprom, pwm) {
    if(!name || platform === undefined || !versions || !escs || !eeprom || !pwm) {
      throw new Error("Parameters required: name, platform, versions, escs, eeprom, localEscs, pwm");
    }

    this.name = name;
    this.platform = platform;
    this.versions = versions;
    this.escs = escs;
    this.eeprom = eeprom;
    this.pwm = pwm;

    this.fetchJson = async (url) => {
      try {
        const response = await fetch(url);
        if(!response.ok) {
          throw new Error(response.statusText);
        }

        return response.json();
      } catch(e) {
        throw new Error(e);
      }
    };
  }

  buildDisplayName() {
    throw new Error("Method buildDisplayName not implemented");
  }

  getPlatform() {
    return this.platform;
  }

  getName() {
    return this.name;
  }

  getPwm() {
    return this.pwm;
  }

  async getVersions() {
    const localStorageKey = `${this.getName()}_versions`;

    try {
      const result = await this.fetchJson(this.versions);
      localStorage.setItem(localStorageKey, JSON.stringify(result));

      return result;
    } catch(e) {
      const content = localStorage.getItem(localStorageKey);

      if(content !== null) {
        return (JSON.parse(content));
      }
    }

    throw new FileNotAvailableError();
  }

  async getEscs() {
    const localStorageKey = `${this.getName()}_escs`;

    try {
      const result = await this.fetchJson(this.escs);
      localStorage.setItem(localStorageKey, JSON.stringify(result));

      return result;
    } catch(e) {
      const content = localStorage.getItem(localStorageKey);

      if(content !== null) {
        return (JSON.parse(content));
      }
    }

    throw new FileNotAvailableError();
  }

  getLocalEscs() {
    const localStorageKey = `${this.getName()}_escs`;
    const content = localStorage.getItem(localStorageKey);

    if(content !== null) {
      return (JSON.parse(content));
    }

    console.log(localStorageKey);

    throw new LocalDataNotAvailableError();
  }

  getEeprom() {
    return this.eeprom;
  }
}

class GithubSource extends Source {
  
  getFileName(key) {
    throw new Error("Method getFileName not implemented");
  }
  
  getTagThing() {
    // todo: refactor to use platform maybe?
    throw new Error("Method getTagThing not implemented");
  }

  async getVersions() {
    const localStorageKey = `${this.getName()}_versions`;

    let versionList = JSON.parse(localStorage.getItem(localStorageKey));

    if(versionList === null) {
      // No version list in cache, try fetching from github
      try {
        versionList = await this.fetchReleasesFromGithub();
        localStorage.setItem(localStorageKey, JSON.stringify(versionList));
      } catch(e) {
        throw new FileNotAvailableError();
      }
    }

    // Version list found in cache, update if more than 24h old
    const CACHE_DURATION = 24 * 60 * 60 * 1000;
    if (new Date() - new Date(versionList.updated || 0) > CACHE_DURATION) {
      // Update version list for next time (do not wait for response now)
      this.fetchReleasesFromGithub()
        .then((newList) => localStorage.setItem(localStorageKey, JSON.stringify(newList)))
        .catch((e) => console.error(e)); // todo log error?
    }

    return versionList;
  }

  async fetchReleasesFromGithub () {
    const repo = this.versions;
    const githubReleases = await this.fetchJson(`https://api.github.com/repos/${repo}/releases`);
    
    const list = githubReleases.map((r) => ({ 
      name: r.name || r.tag_name.replace(/^v/, ''),
      key: r.tag_name,
      url: `https://github.com/${repo}/releases/download/${r.tag_name}/${this.getFileName(r.tag_name)}`,
      prerelease: r.prerelease,
      published_at: r.published_at,
    }));
  
    const res = { updated: new Date() };
    res[this.getTagThing()] = list;
  
    return res;
  }
}

const PLATFORMS = {
  SILABS: 0,
  ARM: 1,
};

const SILABS_TYPES = [
  BLHELI_EEPROM.TYPES.BLHELI_S_SILABS,
  BLUEJAY_EEPROM.TYPES.EFM8,
];

const ARM_TYPES = [
  AM32_EEPROM.TYPES.ARM,
];

export {
  ARM_TYPES,
  PLATFORMS,
  SILABS_TYPES,
  GithubSource,
};

export default Source;

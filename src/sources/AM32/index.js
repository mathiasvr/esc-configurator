import {
  GithubSource, PLATFORMS, 
} from '../Source';
import eeprom from './eeprom';

const GITHUB_REPO = 'AlkaMotors/AM32-MultiRotor-ESC-firmware';
const ESCS_REMOTE = 'https://raw.githubusercontent.com/stylesuxx/esc-configurator/master/src/sources/AM32/escs.json';

class AM32Source extends GithubSource {
  buildDisplayName(flash, make) {
    const settings = flash.settings;
    let revision = 'Unsupported/Unrecognized';
    if(settings.MAIN_REVISION !== undefined && settings.SUB_REVISION !== undefined) {
      revision = `${settings.MAIN_REVISION}.${settings.SUB_REVISION}`;
    }

    if(make === 'NOT READY') {
      revision = 'FLASH FIRMWARE';
    }

    const bootloader = flash.bootloader.valid ? `, Bootloader v${flash.bootloader.version} (${flash.bootloader.pin})` : ', Bootloader unknown';

    return `${make} - AM32, ${revision}${bootloader}`;
  }

  getFileName(key) {
    return `{0}_${key.replace(/^v/, '')}.hex`;
  }

  getTagThing() {
    return 'Arm';
  }
}

const pwmOptions = [];
const source = new AM32Source(
  'AM32',
  PLATFORMS.ARM,
  GITHUB_REPO,
  ESCS_REMOTE,
  eeprom,
  pwmOptions
);

export default source;

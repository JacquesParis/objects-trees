import {countries, Country} from 'countries-list';
import {find, indexOf} from 'lodash';

export class LocalesHelper {
  static getValidLocales(locale?: string): string {
    if (locale) {
      let language: string | undefined =
        locale.length === 2 || locale.length === 5
          ? locale.substr(0, 2).toLowerCase()
          : undefined;
      if (language) {
        let country: string | undefined =
          locale.length === 5 ? locale.substr(3, 2) : language.toUpperCase();
        if (country in countries) {
          if (
            -1 ===
            indexOf(
              (countries as {[key: string]: Country})[country].languages,
              language,
            )
          ) {
            language = (countries as {[key: string]: Country})[country]
              .languages[0];
          }
          return language + '-' + country;
        } else if (language !== 'en') {
          country = find(Object.keys(countries), (oneCountry) => {
            return (
              language ===
              (countries as {[key: string]: Country})[oneCountry].languages[0]
            );
          });
          if (country) {
            return language + '-' + country;
          }
        }
      }
    }
    return 'en-US';
  }
}

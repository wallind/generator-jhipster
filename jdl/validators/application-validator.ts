/**
 * Copyright 2013-2023 the original author or authors from the JHipster project.
 *
 * This file is part of the JHipster project, see https://www.jhipster.tech/
 * for more information.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { applicationOptions, applicationTypes, databaseTypes, websocketTypes } from '../jhipster/index.mjs';
import BinaryOptionValidator from './binary-option-validator.js';
import UnaryOptionValidator from './unary-option-validator.js';
import Validator from './validator.js';

import BinaryOptions from '../jhipster/binary-options.js';
import ApplicationDefinition from '../models/jdl-application-definition.js';

const { OptionNames, OptionValues } = applicationOptions;
const { MICROSERVICE } = applicationTypes;
const { COUCHBASE, NEO4J, CASSANDRA, MONGODB, MARIADB, MSSQL, MYSQL, ORACLE, POSTGRESQL, SQL } = databaseTypes;
const { Options } = BinaryOptions;
const {
  APPLICATION_TYPE,
  AUTHENTICATION_TYPE,
  BASE_NAME,
  BUILD_TOOL,
  PACKAGE_NAME,
  PACKAGE_FOLDER,
  SERVER_PORT,
  BLUEPRINT,
  JHI_PREFIX,
  JWT_SECRET_KEY,
  REMEMBER_ME_KEY,
  LANGUAGES,
  MICROFRONTEND,
  NATIVE_LANGUAGE,
  JHIPSTER_VERSION,
  DTO_SUFFIX,
  ENTITY_SUFFIX,
  CREATION_TIMESTAMP,
  BLUEPRINTS,
  GRADLE_ENTERPRISE_HOST,
  CLIENT_THEME,
  CLIENT_THEME_VARIANT,
  MICROFRONTENDS,
  DATABASE_TYPE,
  TEST_FRAMEWORKS,
  DEV_DATABASE_TYPE,
  PROD_DATABASE_TYPE,
  ENABLE_HIBERNATE_CACHE,
  REACTIVE,
  WEBSOCKET,
} = OptionNames;

const NO_WEBSOCKET = websocketTypes.NO;
export default class ApplicationValidator extends Validator {
  applicationDefinition: ApplicationDefinition = new ApplicationDefinition();

  constructor() {
    super('application', []);
  }

  validate(jdlApplication) {
    if (!jdlApplication) {
      throw new Error('An application must be passed to be validated.');
    }
    this.checkRequiredOptionsAreSet(jdlApplication);
    this.checkBaseNameAgainstApplicationType(jdlApplication);
    this.checkForValidValues(jdlApplication);
    this.checkForInvalidDatabaseCombinations(jdlApplication);
    this.checkApplicationOptions(jdlApplication);
    this.checkForReactiveAppWithWebsocket(jdlApplication);
  }

  checkRequiredOptionsAreSet(jdlApplication) {
    if (
      !jdlApplication.hasConfigurationOption(APPLICATION_TYPE) ||
      !jdlApplication.hasConfigurationOption(AUTHENTICATION_TYPE) ||
      !jdlApplication.hasConfigurationOption(BASE_NAME) ||
      !jdlApplication.hasConfigurationOption(BUILD_TOOL)
    ) {
      throw new Error('The application applicationType, authenticationType, baseName and buildTool options are required.');
    }
  }

  checkBaseNameAgainstApplicationType(jdlApplication) {
    const applicationBaseName = jdlApplication.getConfigurationOptionValue(BASE_NAME);
    const applicationType = jdlApplication.getConfigurationOptionValue(APPLICATION_TYPE);
    if (applicationBaseName.includes('_') && applicationType === MICROSERVICE) {
      throw new Error("An application name can't contain underscores if the application is a microservice.");
    }
  }

  checkForValidValues(jdlApplication) {
    const optionsToIgnore = [
      BASE_NAME,
      PACKAGE_NAME,
      PACKAGE_FOLDER,
      SERVER_PORT,
      BLUEPRINT,
      JHI_PREFIX,
      JWT_SECRET_KEY,
      REMEMBER_ME_KEY,
      LANGUAGES,
      MICROFRONTEND,
      NATIVE_LANGUAGE,
      JHIPSTER_VERSION,
      DTO_SUFFIX,
      ENTITY_SUFFIX,
      CREATION_TIMESTAMP,
      BLUEPRINTS,
      GRADLE_ENTERPRISE_HOST,
    ];
    jdlApplication.forEachConfigurationOption(option => {
      if (optionsToIgnore.includes(option.name)) {
        return;
      }
      this.checkForUnknownApplicationOption(option);
      this.checkForBooleanValue(option);
      this.checkSpecificOptions(option);
    });
  }

  checkForUnknownApplicationOption(option) {
    if (!this.applicationDefinition.doesOptionExist(option.name)) {
      throw new Error(`Unknown application option '${option.name}'.`);
    }
  }

  checkForBooleanValue(option) {
    if (this.applicationDefinition.getTypeForOption(option.name) === 'boolean' && typeof option.getValue() !== 'boolean') {
      throw new Error(`Expected a boolean value for option '${option.name}'`);
    }
  }

  checkSpecificOptions(option) {
    switch (option.name) {
      case CLIENT_THEME:
      case CLIENT_THEME_VARIANT:
      case MICROFRONTENDS:
        break;
      case TEST_FRAMEWORKS:
        this.checkTestFrameworkValues(option.getValue());
        break;
      case DATABASE_TYPE:
        this.checkDatabaseTypeValue(option.getValue());
        break;
      case DEV_DATABASE_TYPE:
        this.checkDevDatabaseTypeValue(option.getValue());
        break;
      case PROD_DATABASE_TYPE:
        this.checkProdDatabaseTypeValue(option.getValue());
        break;
      default:
        this.checkForUnknownValue(option);
    }
  }

  checkTestFrameworkValues(values) {
    if (Object.keys(values).length === 0) {
      return;
    }
    values.forEach(value => {
      if (!this.applicationDefinition.doesOptionValueExist(TEST_FRAMEWORKS, value)) {
        throw new Error(`Unknown value '${value}' for option '${TEST_FRAMEWORKS}'.`);
      }
    });
  }

  checkDatabaseTypeValue(value) {
    if (!this.applicationDefinition.doesOptionValueExist(DATABASE_TYPE, value)) {
      throw new Error(`Unknown value '${value}' for option '${DATABASE_TYPE}'.`);
    }
  }

  checkDevDatabaseTypeValue(value) {
    if (
      !this.applicationDefinition.doesOptionValueExist(DATABASE_TYPE, value) &&
      !this.applicationDefinition.doesOptionValueExist(DEV_DATABASE_TYPE, value) &&
      !this.applicationDefinition.doesOptionValueExist(PROD_DATABASE_TYPE, value)
    ) {
      throw new Error(`Unknown value '${value}' for option '${DEV_DATABASE_TYPE}'.`);
    }
  }

  checkProdDatabaseTypeValue(value) {
    if (
      !this.applicationDefinition.doesOptionValueExist('databaseType', value) &&
      !this.applicationDefinition.doesOptionValueExist(PROD_DATABASE_TYPE, value)
    ) {
      throw new Error(`Unknown value '${value}' for option '${PROD_DATABASE_TYPE}'.`);
    }
  }

  checkForUnknownValue(option) {
    if (
      this.applicationDefinition.getTypeForOption(option.name) !== 'boolean' &&
      !this.applicationDefinition.doesOptionValueExist(option.name, option.getValue())
    ) {
      throw new Error(`Unknown option value '${option.getValue()}' for option '${option.name}'.`);
    }
  }

  checkForInvalidDatabaseCombinations(jdlApplication) {
    const databaseType = jdlApplication.getConfigurationOptionValue(DATABASE_TYPE);
    const devDatabaseType = jdlApplication.getConfigurationOptionValue(DEV_DATABASE_TYPE);
    const prodDatabaseType = jdlApplication.getConfigurationOptionValue(PROD_DATABASE_TYPE);
    const enabledHibernateCache = jdlApplication.getConfigurationOptionValue(ENABLE_HIBERNATE_CACHE);

    if (databaseType === SQL) {
      if (prodDatabaseType && ![MYSQL, POSTGRESQL, MARIADB, ORACLE, MSSQL].includes(prodDatabaseType)) {
        throw new Error(
          `Only ${formatValueList([
            MYSQL,
            POSTGRESQL,
            MARIADB,
            ORACLE,
            MSSQL,
          ])} are allowed as prodDatabaseType values for databaseType 'sql'.`
        );
      }
      if (
        ![
          (OptionValues[OptionNames.DEV_DATABASE_TYPE] as any).h2Memory,
          (OptionValues[OptionNames.DEV_DATABASE_TYPE] as any).h2Disk,
          prodDatabaseType,
        ].includes(devDatabaseType)
      ) {
        throw new Error(
          `Only ${formatValueList([
            (OptionValues[OptionNames.DEV_DATABASE_TYPE] as any).h2Memory,
            (OptionValues[OptionNames.DEV_DATABASE_TYPE] as any).h2Disk,
            prodDatabaseType,
          ])} are allowed as devDatabaseType values for databaseType 'sql'.`
        );
      }
      return;
    }
    if ([MONGODB, COUCHBASE, CASSANDRA, NEO4J].includes(databaseType)) {
      if (devDatabaseType || prodDatabaseType) {
        throw new Error(
          `When the databaseType is either ${formatValueList([
            MONGODB,
            COUCHBASE,
            CASSANDRA,
            NEO4J,
          ])}, the devDatabaseType and prodDatabaseType must be not set.`
        );
      }
      if (enabledHibernateCache) {
        throw new Error(`An application having ${databaseType} as database type can't have the hibernate cache enabled.`);
      }
    }
  }

  checkApplicationOptions(jdlApplication) {
    if (jdlApplication.getOptionQuantity() === 0) {
      return;
    }
    const unaryOptionValidator = new UnaryOptionValidator();
    const binaryOptionValidator = new BinaryOptionValidator();
    jdlApplication.forEachOption(option => {
      if (option.getType() === 'UNARY') {
        unaryOptionValidator.validate(option);
      } else {
        binaryOptionValidator.validate(option);
      }
      this.checkForPaginationInAppWithCassandra(option, jdlApplication);
    });
  }

  checkForPaginationInAppWithCassandra(jdlOption, jdlApplication) {
    if (jdlApplication.getConfigurationOptionValue(DATABASE_TYPE) === CASSANDRA && jdlOption.name === Options.PAGINATION) {
      throw new Error("Pagination isn't allowed when the app uses Cassandra.");
    }
  }

  checkForReactiveAppWithWebsocket(jdlApplication) {
    if (
      jdlApplication.getConfigurationOptionValue(REACTIVE) === true &&
      jdlApplication.getConfigurationOptionValue(WEBSOCKET) !== NO_WEBSOCKET
    ) {
      throw new Error("Websockets aren't allowed when the app is reactive.");
    }
  }
}

function formatValueList(list) {
  return list.map(item => `'${item}'`).join(', ');
}

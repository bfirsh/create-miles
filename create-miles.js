#!/usr/bin/env node

const chalk = require("chalk");
const fs = require("fs");
const os = require("os");
const path = require("path");
const process = require("process");
const childProcess = require("child_process");
const yargs = require("yargs");
const validateProjectName = require("validate-npm-package-name");

// Lots of stuff in here is pinched from create-react-app

PACKAGE = "miles-prototype";

const argv = yargs.usage("$0 <name>").demandCommand(1).argv;
create(argv._[0]);

async function create(appName) {
  const root = path.resolve(appName);
  checkAppName(appName);

  if (fs.existsSync(root)) {
    console.error(`Directory ${chalk.green(root)} already exists.`);
    process.exit(1);
  }
  fs.mkdirSync(root);
  process.chdir(root);

  console.log(`Creating a new Miles app in ${chalk.green(root)}...`);
  console.log();

  const packageJson = {
    name: appName,
    version: "0.1.0",
    private: true
  };
  fs.writeFileSync(
    path.join(root, "package.json"),
    JSON.stringify(packageJson, null, 2) + os.EOL
  );
  await install([PACKAGE]);
  await spawn(process.execPath, [
    `node_modules/${PACKAGE}/scripts/init.js`,
    root
  ]);
}

async function install(dependencies) {
  await spawn(
    "npm",
    ["install", "--save", "--save-exact", "--loglevel", "error"].concat(
      dependencies
    )
  );
}

function spawn(command, args) {
  return new Promise((resolve, reject) => {
    const child = childProcess.spawn(command, args, { stdio: "inherit" });
    child.on("close", code => {
      if (code !== 0) {
        reject({
          command: `${command} ${args.join(" ")}`
        });
        return;
      }
      resolve();
    });
  });
}

function printValidationResults(results) {
  if (typeof results !== "undefined") {
    results.forEach(error => {
      console.error(chalk.red(`  *  ${error}`));
    });
  }
}

function checkAppName(appName) {
  const validationResult = validateProjectName(appName);
  if (!validationResult.validForNewPackages) {
    console.error(
      `Could not create a project called ${chalk.red(
        `"${appName}"`
      )} because of npm naming restrictions:`
    );
    printValidationResults(validationResult.errors);
    printValidationResults(validationResult.warnings);
    process.exit(1);
  }
}
